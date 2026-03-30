"""
API Gateway for Nine Attributes Framework
"""

import hashlib
import json
import os
import time
from typing import Any, Dict

import httpx
import redis
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, make_asgi_app

app = FastAPI(title="Nine Attributes API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/metrics", make_asgi_app())

# Metrics
request_counter = Counter('gateway_requests_total', 'Total requests', ['endpoint', 'status'])
request_duration = Histogram('gateway_request_duration_seconds', 'Request duration', ['endpoint'])

# Service URLs
EXTRACTION_SERVICE = os.getenv("EXTRACTION_SERVICE", "http://nine-attrs-extraction-service:8000")
RANKER_SERVICE = os.getenv("RANKER_SERVICE", "http://nine-attrs-ranker-service:8001")

# Redis for rate limiting
def _create_redis():
    try:
        host = os.getenv('REDIS_HOST', 'redis')
        port = int(os.getenv('REDIS_PORT', '6379'))
        return redis.Redis(host=host, port=port, decode_responses=True)
    except Exception:
        return None


redis_client = _create_redis()


class RateLimiter:
    """Rate limiter for API endpoints"""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute

    async def check_rate_limit(self, client_id: str) -> bool:
        key = f"rate_limit:{client_id}"
        if redis_client is None:
            return True
        try:
            current = redis_client.get(key)
            if current is None:
                redis_client.setex(key, 60, 1)
                return True
            current_count = int(current)
            if current_count >= self.requests_per_minute:
                return False
            redis_client.incr(key)
            return True
        except Exception:
            return True


rate_limiter = RateLimiter()


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    client_id = request.client.host
    if not await rate_limiter.check_rate_limit(client_id):
        return JSONResponse(status_code=429, content={"error": "Rate limit exceeded"})

    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    endpoint = request.url.path
    try:
        request_counter.labels(endpoint=endpoint, status=response.status_code).inc()
        request_duration.labels(endpoint=endpoint).observe(process_time)
    except Exception:
        pass
    return response


@app.post("/api/v1/analyze")
async def analyze_content(request: Dict[str, Any]):
    async with httpx.AsyncClient() as client:
        try:
            extraction_response = await client.post(
                f"{EXTRACTION_SERVICE}/api/content/analyze",
                json=request,
                timeout=30.0,
            )
            extraction_data = extraction_response.json()

            gate_response = await client.post(
                f"{EXTRACTION_SERVICE}/api/content/gate",
                json={"attributes": extraction_data["attributes"]},
                timeout=10.0,
            )
            gate_data = gate_response.json()

            if request.get("include_priors", False):
                prior_response = await client.post(
                    f"{RANKER_SERVICE}/api/rank/priors",
                    json={
                        "attributes": extraction_data["attributes"],
                        "platform": request.get("platform", "instagram"),
                    },
                    timeout=10.0,
                )
                prior_data = prior_response.json()
                extraction_data["priors"] = prior_data

            return {
                "analysis": extraction_data,
                "gate_check": gate_data,
                "timestamp": time.time(),
            }
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Service timeout")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/rank")
async def rank_content(request: Dict[str, Any]):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{RANKER_SERVICE}/api/rank/items",
                json=request,
                timeout=10.0,
            )
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/health")
async def health_check():
    health_status: Dict[str, Any] = {}
    async with httpx.AsyncClient() as client:
        try:
            extraction_health = await client.get(f"{EXTRACTION_SERVICE}/health", timeout=2.0)
            health_status["extraction"] = extraction_health.json()
        except Exception:
            health_status["extraction"] = {"status": "unhealthy"}
        try:
            ranker_health = await client.get(f"{RANKER_SERVICE}/health", timeout=2.0)
            health_status["ranker"] = ranker_health.json()
        except Exception:
            health_status["ranker"] = {"status": "unhealthy"}

    overall_healthy = all(service.get("status") == "healthy" for service in health_status.values())
    return {
        "overall": "healthy" if overall_healthy else "degraded",
        "services": health_status,
        "timestamp": time.time(),
    }


if __name__ == "__main__":  # pragma: no cover
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")))


