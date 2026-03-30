"""
CleanCopy ML Training Service
FastAPI service for training XGBoost models on viral video prediction
"""
import os
from pathlib import Path
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Load environment from parent's .env.local (same as Next.js)
env_path = Path(__file__).parent.parent / '.env.local'
if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

from training_service import TrainingService

app = FastAPI(
    title="CleanCopy ML Training Service",
    description="XGBoost model training for viral video prediction",
    version="1.0.0"
)

# CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3004"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize training service
training_service = TrainingService()

class TrainRequest(BaseModel):
    job_id: str
    config: Optional[Dict[str, Any]] = None

class PredictRequest(BaseModel):
    features: Dict[str, float]

@app.get("/")
async def root():
    return {"status": "healthy", "service": "CleanCopy ML Training"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/train")
async def start_training(request: TrainRequest, background_tasks: BackgroundTasks):
    """Start a training job in the background"""
    try:
        background_tasks.add_task(
            training_service.run_training,
            request.job_id,
            request.config or {}
        )
        return {
            "status": "started",
            "job_id": request.job_id,
            "message": "Training job started in background"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/train/{job_id}/status")
async def get_training_status(job_id: str):
    """Get the status of a training job"""
    try:
        status = await training_service.get_job_status(job_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict(request: PredictRequest):
    """Make a prediction using the active model"""
    try:
        result = training_service.predict(request.features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def list_models():
    """List all trained models"""
    try:
        models = await training_service.list_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)