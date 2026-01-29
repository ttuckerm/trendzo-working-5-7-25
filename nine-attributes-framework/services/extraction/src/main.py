"""
Nine Attributes Extraction Service
Production-ready extraction pipeline for content analysis (lazy model init)
"""

import asyncio
import hashlib
import json
import logging
import os
import time
import re
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple, Any
from uuid import uuid4

import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from prometheus_client import Counter, Histogram, Gauge, make_asgi_app

# Optional heavy deps imported lazily inside functions
try:
    import cv2  # type: ignore
except Exception:  # pragma: no cover
    cv2 = None  # type: ignore

try:
    import ffmpeg  # type: ignore
except Exception:  # pragma: no cover
    ffmpeg = None  # type: ignore

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None  # type: ignore

try:
    import librosa  # type: ignore
except Exception:  # pragma: no cover
    librosa = None  # type: ignore

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Metrics
extraction_counter = Counter('nine_attrs_extraction_total', 'Total extractions', ['status'])
extraction_duration = Histogram('nine_attrs_extraction_duration_seconds', 'Extraction duration seconds')
attribute_scores = Histogram('nine_attrs_attribute_scores', 'Attribute score distribution', ['attribute'])
gate_failures = Counter('nine_attrs_gate_failures_total', 'Gate check failures', ['reason'])

app = FastAPI(title="Nine Attributes Extraction Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount metrics endpoint
app.mount("/metrics", make_asgi_app())


# Redis client (guarded)
def _create_redis_client():
    if redis is None:
        return None
    host = os.getenv('REDIS_HOST', 'redis')
    port = int(os.getenv('REDIS_PORT', '6379'))
    try:
        return redis.Redis(host=host, port=port, decode_responses=True)
    except Exception:
        return None


redis_client = _create_redis_client()


def _redis_get(key: str) -> Optional[str]:
    if not redis_client:
        return None
    try:
        return redis_client.get(key)
    except Exception:
        return None


def _redis_setex(key: str, ttl: int, value: str) -> None:
    if not redis_client:
        return
    try:
        redis_client.setex(key, ttl, value)
    except Exception:
        return


class AttributeScore(BaseModel):
    """Individual attribute score with evidence"""
    name: str
    score: float = Field(ge=0, le=10)
    evidence: Dict[str, Any]


class AnalysisRequest(BaseModel):
    """Content analysis request"""
    video_url: Optional[str] = None
    file_path: Optional[str] = None
    platform: str = "instagram"
    creator_id: Optional[str] = None


class AnalysisResponse(BaseModel):
    """Content analysis response"""
    audit_id: str
    attributes: List[AttributeScore]
    total_score: float
    violations: List[str]
    evidence: Dict[str, Any]
    processing_time_ms: int
    alg_version: str = "nine-attrs-v1.0"


class GateCheckRequest(BaseModel):
    """Gate check request"""
    attributes: List[AttributeScore]


class GateCheckResponse(BaseModel):
    """Gate check response"""
    pass_gate: bool
    reasons: List[str]
    required_fixes: List[str]
    total_score: float


@dataclass
class VideoMetadata:
    """Video metadata extracted from file"""
    duration: float
    fps: float
    width: int
    height: int
    frame_count: int


@dataclass
class AudioFeatures:
    """Audio features for pacing analysis"""
    tempo: float
    energy: np.ndarray
    zero_crossing_rate: np.ndarray
    spectral_centroid: np.ndarray


# Lazy model holders
_whisper_model = None
_emotion_classifier = None
_sentiment_analyzer = None


def _get_whisper_model():  # pragma: no cover - heavy
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper  # type: ignore
            _whisper_model = whisper.load_model(os.getenv("WHISPER_MODEL", "base"))
        except Exception as e:  # keep service alive if model unavailable
            logger.warning(f"Whisper model unavailable: {e}")
            _whisper_model = None
    return _whisper_model


def _get_emotion_classifier():  # pragma: no cover - heavy
    global _emotion_classifier
    if _emotion_classifier is None:
        try:
            from transformers import pipeline  # type: ignore
            _emotion_classifier = pipeline(
                "text-classification",
                model=os.getenv("EMOTION_MODEL", "j-hartmann/emotion-english-distilroberta-base"),
                top_k=None
            )
        except Exception as e:
            logger.warning(f"Emotion classifier unavailable: {e}")
            _emotion_classifier = None
    return _emotion_classifier


class NineAttributesExtractor:
    """Main extraction pipeline for Nine Attributes"""

    def __init__(self):
        self.cache_ttl = 3600  # seconds

    async def extract_video_metadata(self, video_path: str) -> VideoMetadata:
        """Extract basic video metadata"""
        if ffmpeg is None:
            raise HTTPException(status_code=503, detail="FFmpeg not available")
        try:
            probe = ffmpeg.probe(video_path)
            video_stream = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            fps_str = video_stream.get('r_frame_rate') or video_stream.get('avg_frame_rate') or '0/1'
            fps = eval(fps_str) if '/' in fps_str else float(fps_str)  # safe enough for N/D
            frame_count = int(float(video_stream.get('nb_frames') or 0))

            return VideoMetadata(
                duration=float(probe['format'].get('duration', 0.0)),
                fps=float(fps) if fps else 0.0,
                width=int(video_stream.get('width', 0)),
                height=int(video_stream.get('height', 0)),
                frame_count=frame_count,
            )
        except Exception as e:  # pragma: no cover
            logger.error(f"Error extracting metadata: {e}")
            raise HTTPException(status_code=400, detail="Invalid video file")

    async def extract_scene_changes(self, video_path: str, metadata: VideoMetadata) -> Dict[str, Any]:
        """Detect scene changes and calculate cut rate"""
        if cv2 is None:
            raise HTTPException(status_code=503, detail="OpenCV not available")
        cap = cv2.VideoCapture(video_path)
        prev_frame = None
        scene_changes: List[float] = []
        frame_idx = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if prev_frame is not None and frame_idx % 5 == 0:  # sample every 5 frames
                    diff = cv2.absdiff(frame, prev_frame)
                    mean_diff = float(np.mean(diff))
                    if mean_diff > 30:
                        # scene change timestamp (sec)
                        t = frame_idx / metadata.fps if metadata.fps else 0.0
                        scene_changes.append(t)
                prev_frame = frame
                frame_idx += 1
        finally:
            cap.release()

        duration = metadata.duration if metadata.duration else 0.0
        cut_rate = (len(scene_changes) / duration) if duration > 0 else 0.0

        return {
            "scene_changes": scene_changes,
            "cut_rate": cut_rate,
            "total_cuts": len(scene_changes),
        }

    async def extract_audio_features(self, video_path: str) -> AudioFeatures:
        """Extract audio features for pacing analysis"""
        if ffmpeg is None or librosa is None:
            raise HTTPException(status_code=503, detail="Audio stack unavailable")

        audio_path = f"/tmp/{uuid4()}.wav"
        try:
            stream = ffmpeg.input(video_path)
            stream = ffmpeg.output(stream, audio_path, acodec='pcm_s16le', ar=22050)
            ffmpeg.run(stream, overwrite_output=True, quiet=True)

            y, sr = librosa.load(audio_path, sr=22050)
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            energy = librosa.feature.rms(y=y)[0]
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]

            return AudioFeatures(
                tempo=float(tempo),
                energy=energy,
                zero_crossing_rate=zcr,
                spectral_centroid=spectral_centroid,
            )
        finally:  # best-effort cleanup
            try:
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception:
                pass

    async def transcribe_audio(self, video_path: str) -> Dict[str, Any]:
        """Transcribe audio using Whisper"""
        model = _get_whisper_model()
        if model is None:  # degrade gracefully
            return {"text": "", "segments": [], "language": "en"}
        result = model.transcribe(video_path)
        return {
            "text": result.get("text", ""),
            "segments": result.get("segments", []),
            "language": result.get("language", "en"),
        }

    def analyze_hook_strength(self, transcript: Dict[str, Any], scene_data: Dict[str, Any]) -> AttributeScore:
        """Analyze hook strength (first 3 seconds)"""
        evidence: Dict[str, Any] = {}
        score = 5.0

        if transcript.get("segments"):
            first_segment = transcript["segments"][0]
            opening_text = (first_segment.get("text") or "")[:100]
            hook_patterns = [
                ("question", ["how", "what", "why", "is it possible"]),
                ("result", ["went from", "achieved", "got", "made"]),
                ("authority", ["after", "studied", "analyzed", "tested"]),
                ("surprise", ["weird", "unexpected", "shocking", "crazy"]),
            ]
            for pattern_name, keywords in hook_patterns:
                if any(kw in opening_text.lower() for kw in keywords):
                    score += 1.5
                    evidence[f"hook_pattern_{pattern_name}"] = True

        early_cuts = sum(1 for t in scene_data.get("scene_changes", []) if t <= 3)
        if early_cuts >= 2:
            score += 1.5
            evidence["visual_hook_cuts"] = early_cuts

        evidence["has_text_overlay"] = True  # Placeholder until OCR added
        if evidence["has_text_overlay"]:
            score += 1.0

        score = min(score, 10.0)
        return AttributeScore(name="HookStrength", score=round(score, 1), evidence=evidence)

    def analyze_tam_resonance(self, transcript: Dict[str, Any], metadata: VideoMetadata) -> AttributeScore:
        """Analyze Total Addressable Market resonance"""
        score = 5.0
        evidence: Dict[str, Any] = {}

        universal_topics = [
            "money", "love", "health", "success", "family",
            "food", "travel", "technology", "education", "entertainment",
        ]
        text = (transcript.get("text") or "").lower()
        matched_topics = [topic for topic in universal_topics if topic in text]
        if matched_topics:
            score += len(matched_topics) * 0.5
            evidence["universal_topics"] = matched_topics

        if getattr(metadata, 'duration', 0) <= 60:
            score += 1.0
            evidence["optimal_length"] = True
        elif getattr(metadata, 'duration', 0) <= 180:
            score += 0.5

        if getattr(metadata, 'height', 0) > getattr(metadata, 'width', 0):
            score += 0.5
            evidence["mobile_optimized"] = True

        score = min(score, 10.0)
        return AttributeScore(name="TAMResonance", score=round(score, 1), evidence=evidence)

    def analyze_sharability(self, transcript: Dict[str, Any], emotion_results: List[Dict[str, Any]]) -> AttributeScore:
        """Analyze sharability factors"""
        score = 5.0
        evidence: Dict[str, Any] = {}

        high_arousal_emotions = ["joy", "surprise", "anger", "fear"]
        detected_emotions = [e.get("label") for e in emotion_results if e.get("score", 0) > 0.7]
        arousal_matches = [e for e in detected_emotions if e in high_arousal_emotions]
        if arousal_matches:
            score += 2.0
            evidence["emotional_triggers"] = arousal_matches

        social_currency_phrases = [
            "nobody talks about", "secret", "hack", "trick",
            "what they don't tell you", "truth about", "exposed",
        ]
        text = (transcript.get("text") or "").lower()
        found_phrases = [p for p in social_currency_phrases if p in text]
        if found_phrases:
            score += 1.5
            evidence["social_currency"] = found_phrases

        practical_indicators = ["how to", "step by step", "guide", "tutorial", "tips"]
        if any(ind in text for ind in practical_indicators):
            score += 1.0
            evidence["practical_value"] = True

        score = min(score, 10.0)
        return AttributeScore(name="Sharability", score=round(score, 1), evidence=evidence)

    def analyze_format_innovation(self, scene_data: Dict[str, Any], audio_features: AudioFeatures) -> AttributeScore:
        """Analyze format and presentation innovation"""
        score = 5.0
        evidence: Dict[str, Any] = {}

        cut_rate = float(scene_data.get("cut_rate", 0))
        if cut_rate >= 0.5:
            score += 2.5
            evidence["format"] = "rapid_change"
        elif cut_rate >= 0.2:
            score += 1.5
            evidence["format"] = "dynamic"
        else:
            score -= 1.0
            evidence["format"] = "static"

        energy_std = float(np.std(audio_features.energy)) if getattr(audio_features, 'energy', None) is not None else 0.0
        if energy_std > 0.1:
            score += 1.0
            evidence["audio_variation"] = round(energy_std, 3)

        evidence["cut_rate"] = round(cut_rate, 2)
        score = min(max(score, 0), 10.0)
        return AttributeScore(name="FormatInnovation", score=round(score, 1), evidence=evidence)

    def analyze_value_density(self, transcript: Dict[str, Any], metadata: VideoMetadata) -> AttributeScore:
        """Analyze value density (insights per minute)"""
        score = 5.0
        evidence: Dict[str, Any] = {}

        actionable_keywords = [
            "first", "second", "third", "step", "tip", "trick",
            "method", "strategy", "technique", "approach",
        ]
        text = (transcript.get("text") or "").lower()
        keyword_count = sum(text.count(kw) for kw in actionable_keywords)

        duration_minutes = (getattr(metadata, 'duration', 0) or 0) / 60.0
        if duration_minutes > 0:
            insights_per_minute = keyword_count / duration_minutes
            score += min(insights_per_minute, 3.0)
            evidence["insights_per_minute"] = round(insights_per_minute, 2)

        numbers = re.findall(r'\d+', text)
        if len(numbers) > 3:
            score += 1.0
            evidence["specific_data_points"] = len(numbers)

        filler_words = ["um", "uh", "like", "you know", "basically", "actually"]
        filler_count = sum(text.count(fw) for fw in filler_words)
        if filler_count > 10:
            score -= 1.0
            evidence["excessive_filler"] = True

        score = min(max(score, 0), 10.0)
        return AttributeScore(name="ValueDensity", score=round(score, 1), evidence=evidence)

    def analyze_pacing_rhythm(self, audio_features: AudioFeatures, scene_data: Dict[str, Any]) -> AttributeScore:
        """Analyze pacing and rhythm"""
        score = 5.0
        evidence: Dict[str, Any] = {}

        optimal_tempo_range = (100, 140)
        tempo = float(getattr(audio_features, 'tempo', 0))
        if optimal_tempo_range[0] <= tempo <= optimal_tempo_range[1]:
            score += 1.5
            evidence["optimal_tempo"] = True
        evidence["tempo_bpm"] = round(tempo, 1)

        energy_std = float(np.std(audio_features.energy)) if getattr(audio_features, 'energy', None) is not None else 0.0
        if 0.05 <= energy_std <= 0.2:
            score += 1.5
            evidence["good_energy_variation"] = True
        evidence["energy_std"] = round(energy_std, 3)

        changes = scene_data.get("scene_changes", [])
        if changes and len(changes) > 1:
            intervals = [changes[i + 1] - changes[i] for i in range(len(changes) - 1)]
            interval_std = float(np.std(intervals))
            if interval_std < 2.0:
                score += 1.0
                evidence["consistent_cuts"] = True

        score = min(score, 10.0)
        return AttributeScore(name="PacingRhythm", score=round(score, 1), evidence=evidence)

    def analyze_curiosity_gaps(self, transcript: Dict[str, Any]) -> AttributeScore:
        """Analyze presence and effectiveness of curiosity gaps"""
        score = 5.0
        evidence: Dict[str, Any] = {"loops": []}

        loop_openers = [
            "but first", "before we get to that", "i'll tell you in a moment",
            "the third one", "the last one", "stay until the end",
            "but there's a catch", "here's the thing",
        ]
        loop_closers = [
            "as i mentioned", "like i said", "going back to",
            "remember when", "that's why", "so that's how",
        ]

        text = (transcript.get("text") or "").lower()
        opened_loops: List[Dict[str, Any]] = []
        for opener in loop_openers:
            if opener in text:
                position = text.index(opener)
                opened_loops.append({"type": "open", "phrase": opener, "position": position})
                score += 0.75
        for closer in loop_closers:
            if closer in text:
                position = text.index(closer)
                opened_loops.append({"type": "close", "phrase": closer, "position": position})
                score += 0.5
        evidence["loops"] = opened_loops[:5]
        evidence["loop_count"] = len(opened_loops)

        numbered_pattern = r'(first|second|third|number \d+|step \d+)'
        if re.search(numbered_pattern, text):
            score += 1.0
            evidence["numbered_structure"] = True

        score = min(score, 10.0)
        return AttributeScore(name="CuriosityGaps", score=round(score, 1), evidence=evidence)

    def analyze_emotional_journey(self, transcript: Dict[str, Any], emotion_results: List[Dict[str, Any]]) -> AttributeScore:
        """Analyze emotional arc throughout content"""
        score = 5.0
        evidence: Dict[str, Any] = {}

        if not emotion_results:
            return AttributeScore(name="EmotionalJourney", score=score, evidence={"error": "No emotion data"})

        emotions = [e.get("label") for e in emotion_results if e.get("label")]
        unique_emotions = len(set(emotions))
        if unique_emotions >= 3:
            score += 2.0
            evidence["emotional_variety"] = unique_emotions

        if emotions and emotions[-1] in ["joy", "optimism", "satisfaction"]:
            score += 1.5
            evidence["positive_ending"] = True

        intensities = [float(e.get("score", 0.0)) for e in emotion_results]
        if len(intensities) > 0:
            intensity_range = max(intensities) - min(intensities)
            if intensity_range > 0.3:
                score += 1.0
                evidence["emotional_range"] = round(float(intensity_range), 2)

        evidence["emotion_sequence"] = emotions[:5]
        score = min(score, 10.0)
        return AttributeScore(name="EmotionalJourney", score=round(score, 1), evidence=evidence)

    def analyze_clear_payoff(self, transcript: Dict[str, Any], metadata: VideoMetadata) -> AttributeScore:
        """Analyze clarity and value of conclusion"""
        score = 5.0
        evidence: Dict[str, Any] = {}

        segments = transcript.get("segments") or []
        if segments:
            total_segments = len(segments)
            last_segment_idx = int(total_segments * 0.8)
            last_segments = segments[last_segment_idx:]
            ending_text = " ".join([(s.get("text") or "") for s in last_segments]).lower()

            payoff_phrases = [
                "so remember", "the key is", "in conclusion", "to sum up",
                "the bottom line", "what this means", "the lesson",
                "the takeaway", "now you know", "that's how",
            ]
            found_payoffs = [p for p in payoff_phrases if p in ending_text]
            if found_payoffs:
                score += 2.0
                evidence["payoff_phrases"] = found_payoffs

            cta_phrases = [
                "follow", "subscribe", "comment", "share", "like",
                "let me know", "try this", "click", "link in",
            ]
            found_ctas = [c for c in cta_phrases if c in ending_text]
            if found_ctas:
                score += 1.0
                evidence["call_to_action"] = found_ctas

            action_words = ["try", "do", "start", "implement", "apply", "use"]
            if any(word in ending_text for word in action_words):
                score += 1.0
                evidence["actionable_conclusion"] = True

        score = min(score, 10.0)
        return AttributeScore(name="ClearPayoff", score=round(score, 1), evidence=evidence)

    async def extract_all_attributes(self, video_path: str) -> Tuple[List[AttributeScore], Dict[str, Any]]:
        """Extract all nine attributes from video"""
        start_time = time.time()

        metadata = await self.extract_video_metadata(video_path)
        scene_data = await self.extract_scene_changes(video_path, metadata)
        audio_features = await self.extract_audio_features(video_path)
        transcript = await self.transcribe_audio(video_path)

        # Emotion analysis (best-effort)
        emotion_results: List[Dict[str, Any]] = []
        classifier = _get_emotion_classifier()
        if classifier and transcript.get("text"):
            text_chunks = [transcript["text"][i:i + 500] for i in range(0, len(transcript["text"]), 500)]
            for chunk in text_chunks[:5]:
                try:
                    emotions = classifier(chunk)
                    if isinstance(emotions, list):
                        emotion_results.extend(emotions)
                except Exception:
                    break

        attributes = [
            self.analyze_tam_resonance(transcript, metadata),
            self.analyze_sharability(transcript, emotion_results),
            self.analyze_hook_strength(transcript, scene_data),
            self.analyze_format_innovation(scene_data, audio_features),
            self.analyze_value_density(transcript, metadata),
            self.analyze_pacing_rhythm(audio_features, scene_data),
            self.analyze_curiosity_gaps(transcript),
            self.analyze_emotional_journey(transcript, emotion_results),
            self.analyze_clear_payoff(transcript, metadata),
        ]

        evidence = {
            "metadata": asdict(metadata),
            "scene_analysis": scene_data,
            "transcript_length": len(transcript.get("text", "")),
            "processing_time_ms": int((time.time() - start_time) * 1000),
        }
        return attributes, evidence


extractor = NineAttributesExtractor()


async def emit_event(event_type: str, data: Dict[str, Any]):
    """Emit event to event bus (placeholder)"""
    logger.info(f"Event {event_type}: {data}")


@app.post("/api/content/analyze", response_model=AnalysisResponse)
async def analyze_content(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Analyze content and extract nine attributes"""
    start_time = time.time()
    audit_id = str(uuid4())

    # Cache key (request dict must be JSON-serializable)
    try:
        request_payload = request.dict()
        cache_key = f"analysis:{hashlib.md5(json.dumps(request_payload, sort_keys=True).encode()).hexdigest()}"
    except Exception:
        cache_key = f"analysis:{audit_id}"

    try:
        cached = _redis_get(cache_key)
        if cached:
            return AnalysisResponse(**json.loads(cached))

        # Resolve video path
        video_path = request.file_path
        if request.video_url and not video_path:
            # TODO: download by platform; for now require local file
            raise HTTPException(status_code=400, detail="video_url download not implemented; provide file_path")

        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=400, detail="file_path not found")

        attributes, evidence = await extractor.extract_all_attributes(video_path)
        total_score = float(sum(attr.score for attr in attributes))

        violations: List[str] = []
        if total_score < 63:
            violations.append(f"Total score {total_score} below minimum 63")
        low_attrs = [attr for attr in attributes if attr.score < 5]
        if low_attrs:
            violations.extend([f"{attr.name} score {attr.score} below minimum 5" for attr in low_attrs])
        high_attrs = [attr for attr in attributes if attr.score >= 8]
        if len(high_attrs) < 3:
            violations.append(f"Only {len(high_attrs)} attributes ≥8 (minimum 3 required)")

        # Metrics
        extraction_counter.labels(status="success" if not violations else "violation").inc()
        extraction_duration.observe(time.time() - start_time)
        for attr in attributes:
            attribute_scores.labels(attribute=attr.name).observe(attr.score)

        response = AnalysisResponse(
            audit_id=audit_id,
            attributes=attributes,
            total_score=total_score,
            violations=violations,
            evidence=evidence,
            processing_time_ms=int((time.time() - start_time) * 1000),
        )

        _redis_setex(cache_key, extractor.cache_ttl, json.dumps(response.dict()))

        background_tasks.add_task(
            emit_event,
            "EVT.Content.Analyzed",
            {
                "audit_id": audit_id,
                "total_score": total_score,
                "violations": violations,
                "platform": request.platform,
                "creator_id": request.creator_id,
            },
        )

        return response
    except HTTPException:
        extraction_counter.labels(status="error").inc()
        raise
    except Exception as e:  # pragma: no cover
        extraction_counter.labels(status="error").inc()
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/content/gate", response_model=GateCheckResponse)
async def check_gates(request: GateCheckRequest):
    """Check if content passes quality gates"""
    total_score = float(sum(attr.score for attr in request.attributes))
    reasons: List[str] = []
    required_fixes: List[str] = []

    if total_score < 63:
        reasons.append(f"Total score {total_score} below minimum 63")
        required_fixes.append(f"Improve overall quality by {round(63 - total_score, 1)} points")

    for attr in request.attributes:
        if attr.score < 5:
            reasons.append(f"{attr.name} score {attr.score} below minimum 5")
            required_fixes.append(f"Improve {attr.name} by {round(5 - attr.score, 1)} points")

    high_performers = [attr for attr in request.attributes if attr.score >= 8]
    if len(high_performers) < 3:
        reasons.append(f"Only {len(high_performers)} attributes ≥8 (need 3)")
        required_fixes.append("Excel in at least 3 attributes (score ≥8)")

    pass_gate = len(reasons) == 0
    if not pass_gate:
        for reason in reasons:
            try:
                gate_failures.labels(reason=reason.split()[0]).inc()
            except Exception:
                pass

    return GateCheckResponse(
        pass_gate=pass_gate,
        reasons=reasons,
        required_fixes=required_fixes,
        total_score=total_score,
    )


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":  # pragma: no cover
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))


