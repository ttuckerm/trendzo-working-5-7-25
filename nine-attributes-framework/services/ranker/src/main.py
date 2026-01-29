"""
Ranker Integration Service
Integrates Nine Attributes into recommendation ranking
"""

import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import redis
from dataclasses import dataclass
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from prometheus_client import Counter, Histogram, Gauge, make_asgi_app
from sklearn.isotonic import IsotonicRegression

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Nine Attributes Ranker Service", version="1.0.0")
app.mount("/metrics", make_asgi_app())

# Metrics
calibration_error = Gauge('nine_attrs_calibration_error', 'Calibration error', ['model', 'cohort'])
ranking_requests = Counter('nine_attrs_ranking_requests_total', 'Total ranking requests')
prior_computation_time = Histogram('nine_attrs_prior_computation_seconds', 'Prior computation time')


class PriorRequest(BaseModel):
    """Prior probability request"""
    attributes: List[Dict]
    creator_id: Optional[str] = None
    platform: str = "instagram"
    cohort: Optional[Dict] = None


class PriorResponse(BaseModel):
    """Prior probability response"""
    prior_watch_time: float = Field(ge=0, le=1)
    prior_share_prob: float = Field(ge=0, le=1)
    prior_regret_prob: float = Field(ge=0, le=1)
    confidence_intervals: Dict[str, List[float]]
    version: str = "priors-v1"
    calibration_version: str
    cohort_key: str


class RankRequest(BaseModel):
    """Ranking request"""
    items: List[Dict]
    user_features: Dict
    context: Dict


class RankResponse(BaseModel):
    """Ranking response"""
    ranked_items: List[Dict]
    scores: List[float]
    exploration_bonus: List[float]


@dataclass
class CohortCalibration:
    """Calibration model for a specific cohort"""
    cohort_key: str
    watch_time_model: IsotonicRegression
    share_model: IsotonicRegression
    regret_model: IsotonicRegression
    last_updated: datetime
    sample_count: int
    mape: float
    ece: float


class NineAttributesRanker:
    """Ranker that incorporates Nine Attributes as priors"""

    def __init__(self):
        self.calibrations: Dict[str, CohortCalibration] = {}
        host = os.getenv('REDIS_HOST', 'redis')
        port = int(os.getenv('REDIS_PORT', '6379'))
        try:
            self.redis_client = redis.Redis(host=host, port=port)
        except Exception:
            self.redis_client = None
        self.load_calibrations()

    def load_calibrations(self):
        """Load calibration models from storage"""
        try:
            import pickle
            with open('/models/calibrations.pkl', 'rb') as f:
                self.calibrations = pickle.load(f)
        except FileNotFoundError:
            logger.info("No calibrations found, using defaults")
            self.initialize_default_calibrations()
        except Exception as e:
            logger.warning(f"Calibration load failed: {e}")
            self.initialize_default_calibrations()

    def initialize_default_calibrations(self):
        """Initialize default calibrations"""
        default_cohorts = [
            "global",
            "mobile_us",
            "mobile_uk",
            "desktop_us",
            "new_users",
            "power_users",
        ]
        for cohort in default_cohorts:
            self.calibrations[cohort] = CohortCalibration(
                cohort_key=cohort,
                watch_time_model=IsotonicRegression(out_of_bounds='clip'),
                share_model=IsotonicRegression(out_of_bounds='clip'),
                regret_model=IsotonicRegression(out_of_bounds='clip', increasing=False),
                last_updated=datetime.now(),
                sample_count=0,
                mape=0.1,
                ece=0.03,
            )

    def get_cohort_key(self, request: PriorRequest) -> str:
        if request.cohort:
            device = request.cohort.get("device", "mobile")
            country = request.cohort.get("country", "us")
            return f"{device}_{country}"
        return "global"

    def compute_attribute_features(self, attributes: List[Dict]) -> np.ndarray:
        scores: List[float] = []
        for attr in attributes:
            scores.append(float(attr.get("score", 5.0)))

        total_score = sum(scores)
        high_performers = sum(1 for s in scores if s >= 8)
        low_performers = sum(1 for s in scores if s < 5)
        variance = float(np.var(scores))
        hook_format = scores[2] * scores[3] if len(scores) >= 4 else 0.0
        value_pacing = scores[4] * scores[5] if len(scores) >= 6 else 0.0

        features = scores + [
            total_score / 90.0,
            high_performers / 9.0,
            low_performers / 9.0,
            variance,
            hook_format / 100.0,
            value_pacing / 100.0,
        ]
        return np.array(features)

    def compute_priors(self, request: PriorRequest) -> PriorResponse:
        cohort_key = self.get_cohort_key(request)
        calibration = self.calibrations.get(cohort_key, self.calibrations["global"])

        features = self.compute_attribute_features(request.attributes)
        _ = features  # not used explicitly; placeholder for future models

        total_score = sum(attr.get("score", 5.0) for attr in request.attributes)
        watch_indices = [4, 5, 6, 7, 8]
        share_indices = [0, 1, 2, 3]
        holding_attrs = [request.attributes[i]["score"] for i in watch_indices if i < len(request.attributes)] or [5.0]
        sharing_attrs = [request.attributes[i]["score"] for i in share_indices if i < len(request.attributes)] or [5.0]

        watch_score = float(np.mean(holding_attrs)) / 10.0
        share_score = float(np.mean(sharing_attrs)) / 10.0
        quality_score = total_score / 90.0
        regret_score = max(0.0, 1.0 - quality_score * 1.2)

        if calibration.sample_count > 100:
            watch_time_cal = float(calibration.watch_time_model.predict([watch_score])[0])
            share_cal = float(calibration.share_model.predict([share_score])[0])
            regret_cal = float(calibration.regret_model.predict([regret_score])[0])
        else:
            watch_time_cal = watch_score
            share_cal = share_score
            regret_cal = regret_score

        ci_width = 0.1 if calibration.sample_count > 1000 else 0.2
        return PriorResponse(
            prior_watch_time=watch_time_cal,
            prior_share_prob=share_cal,
            prior_regret_prob=regret_cal,
            confidence_intervals={
                "watch_time": [max(0.0, watch_time_cal - ci_width), min(1.0, watch_time_cal + ci_width)],
                "share_prob": [max(0.0, share_cal - ci_width), min(1.0, share_cal + ci_width)],
                "regret_prob": [max(0.0, regret_cal - ci_width), min(1.0, regret_cal + ci_width)],
            },
            calibration_version=f"cal_{calibration.last_updated.strftime('%Y%m%d')}",
            cohort_key=cohort_key,
        )

    def apply_exploration_policy(self, items: List[Dict], scores: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        exploration_bonuses: List[float] = []
        for i, item in enumerate(items):
            impressions = int(item.get("impressions", 0))
            if impressions < 100:
                bonus = 0.3 * np.sqrt(np.log(max(1, impressions + 1)) / max(1, impressions + 1))
            elif impressions < 1000:
                bonus = 0.1 * np.sqrt(np.log(impressions) / impressions)
            else:
                bonus = 0.0

            total_attr_score = sum(a.get("score", 0) for a in item.get("attributes", []))
            if total_attr_score >= 70:
                bonus *= 1.5
            elif total_attr_score < 50:
                bonus *= 0.5
            exploration_bonuses.append(float(bonus))

        exploration_bonuses_arr = np.array(exploration_bonuses)
        adjusted_scores = scores + exploration_bonuses_arr
        return adjusted_scores, exploration_bonuses_arr

    def apply_satisfaction_guardrails(self, items: List[Dict], scores: np.ndarray) -> np.ndarray:
        adjusted_scores = scores.copy()
        for i, item in enumerate(items):
            attributes = item.get("attributes", [])
            if not attributes:
                continue
            hook_score = next((a.get("score", 5) for a in attributes if a.get("name") == "HookStrength"), 5)
            payoff_score = next((a.get("score", 5) for a in attributes if a.get("name") == "ClearPayoff"), 5)
            if hook_score > 8 and payoff_score < 5:
                adjusted_scores[i] *= 0.7
                logger.info(f"Clickbait penalty applied to item {i}")
            regret_prob = float(item.get("prior_regret_prob", 0))
            if regret_prob > 0.3:
                adjusted_scores[i] = min(adjusted_scores[i], 0.5)
                logger.info(f"Regret cap applied to item {i}")
        return adjusted_scores

    async def update_calibration(self, cohort_key: str, observed_data: pd.DataFrame):
        calibration = self.calibrations.get(cohort_key)
        if not calibration:
            return
        X_watch = observed_data['predicted_watch'].values
        y_watch = observed_data['actual_watch'].values
        X_share = observed_data['predicted_share'].values
        y_share = observed_data['actual_share'].values
        X_regret = observed_data['predicted_regret'].values
        y_regret = observed_data['actual_regret'].values

        calibration.watch_time_model.fit(X_watch, y_watch)
        calibration.share_model.fit(X_share, y_share)
        calibration.regret_model.fit(X_regret, y_regret)

        calibration.mape = float(np.mean(np.abs(X_watch - y_watch) / np.maximum(y_watch, 0.01)))
        calibration.ece = self.calculate_ece(X_watch, y_watch)
        calibration.sample_count += len(observed_data)
        calibration.last_updated = datetime.now()
        calibration_error.labels(model='watch_time', cohort=cohort_key).set(calibration.mape)
        await self.save_calibrations()

    def calculate_ece(self, predicted: np.ndarray, actual: np.ndarray, n_bins: int = 10) -> float:
        bin_boundaries = np.linspace(0, 1, n_bins + 1)
        ece = 0.0
        for i in range(n_bins):
            mask = (predicted >= bin_boundaries[i]) & (predicted < bin_boundaries[i + 1])
            if mask.sum() > 0:
                bin_acc = float(actual[mask].mean())
                bin_conf = float(predicted[mask].mean())
                bin_size = int(mask.sum())
                ece += (bin_size / len(predicted)) * abs(bin_acc - bin_conf)
        return float(ece)

    async def save_calibrations(self):
        import pickle
        os.makedirs('/models', exist_ok=True)
        with open('/models/calibrations.pkl', 'wb') as f:
            pickle.dump(self.calibrations, f)


ranker = NineAttributesRanker()


@app.post("/api/rank/priors", response_model=PriorResponse)
async def compute_priors(request: PriorRequest):
    try:
        ranking_requests.inc()
        return ranker.compute_priors(request)
    except Exception as e:
        logger.error(f"Prior computation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rank/items", response_model=RankResponse)
async def rank_items(request: RankRequest):
    try:
        base_scores = np.array([float(item.get("base_score", 0.5)) for item in request.items])
        for i, item in enumerate(request.items):
            if "attributes" in item:
                prior_req = PriorRequest(
                    attributes=item["attributes"],
                    platform=request.context.get("platform", "instagram"),
                    cohort=request.user_features,
                )
                priors = ranker.compute_priors(prior_req)
                watch_weight = 0.5
                share_weight = 0.3
                regret_weight = -0.2
                adjustment = (
                    watch_weight * priors.prior_watch_time +
                    share_weight * priors.prior_share_prob +
                    regret_weight * priors.prior_regret_prob
                )
                base_scores[i] = base_scores[i] * 0.7 + float(adjustment) * 0.3

        adjusted_scores, exploration_bonuses = ranker.apply_exploration_policy(request.items, base_scores)
        final_scores = ranker.apply_satisfaction_guardrails(request.items, adjusted_scores)
        sorted_indices = np.argsort(final_scores)[::-1]
        ranked_items = [request.items[i] for i in sorted_indices]
        return RankResponse(
            ranked_items=ranked_items,
            scores=final_scores[sorted_indices].tolist(),
            exploration_bonus=exploration_bonuses[sorted_indices].tolist(),
        )
    except Exception as e:
        logger.error(f"Ranking error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/calibration/update")
async def update_calibration(cohort_key: str, data: Dict):
    try:
        df = pd.DataFrame(data["observations"])
        await ranker.update_calibration(cohort_key, df)
        return {"status": "success", "cohort": cohort_key, "samples": int(len(df))}
    except Exception as e:
        logger.error(f"Calibration update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "healthy", "calibrations_loaded": len(ranker.calibrations)}


if __name__ == "__main__":  # pragma: no cover
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8001")))


