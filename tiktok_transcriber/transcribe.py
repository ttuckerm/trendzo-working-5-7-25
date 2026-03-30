from __future__ import annotations
import os, tempfile, yt_dlp
from openai import OpenAI
from util import content_hash, retry_net

client = OpenAI()  # reads OPENAI_API_KEY

@retry_net
def download_media_no_ffmpeg(video_url: str, out_dir: str) -> str:
    """
    Download a single-file format (mp4) that already includes audio.
    Avoids ffmpeg by not post-processing or merging streams.
    """
    out_path = os.path.join(out_dir, "%(id)s.%(ext)s")
    ydl_opts = {
        "quiet": True,
        # Prefer mp4 with audio; fall back to best single file
        "format": "mp4/best",
        "outtmpl": out_path,
        # IMPORTANT: no postprocessors here (so no ffmpeg needed)
        "merge_output_format": "mp4",  # harmless if already single file
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        # Try mp4 first
        candidates = [
            os.path.join(out_dir, f"{info['id']}.mp4"),
            os.path.join(out_dir, f"{info['id']}.mkv"),
            os.path.join(out_dir, f"{info['id']}.webm"),
            os.path.join(out_dir, f"{info['id']}.m4a"),  # very rare without ffmpeg, but check anyway
        ]
        for p in candidates:
            if os.path.exists(p):
                return p
        # As a last resort, return any file that starts with the ID
        for f in os.listdir(out_dir):
            if f.startswith(info["id"]):
                return os.path.join(out_dir, f)
        raise RuntimeError("Downloaded file not found")

@retry_net
def transcribe_media(file_path: str, model: str = "gpt-4o-mini-transcribe") -> str:
    # OpenAI accepts video/audio directly (mp4, webm, m4a, etc.)
    with open(file_path, "rb") as f:
        r = client.audio.transcriptions.create(
            model=model,  # or "gpt-4o-transcribe" / "whisper-1"
            file=f,
            response_format="json",
            temperature=0
        )
    return getattr(r, "text", "") or ""

def transcribe_video(video_url: str, video_id: str) -> dict:
    with tempfile.TemporaryDirectory() as d:
        media = download_media_no_ffmpeg(video_url, d)
        text = transcribe_media(media)
        return {
            "video_id": video_id,
            "transcript": text,
            "transcript_length": len(text),
            "content_hash": content_hash(video_id, text),
        }
