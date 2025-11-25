import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import random

app = FastAPI(title="Fraud Detection Mock API", version="1.0.0")

# Mock function to simulate fraud detection
def mock_fraud_detection(features: Dict) -> Dict:
    # Simple rule: high amount or unusual time increases fraud probability
    amount = features.get("Amount", 0)
    time = features.get("Time", 0)
    
    # Simple heuristic
    risk = 0.1  # base risk
    if amount > 1000:
        risk += 0.4
    if time > 100000:  # Late night transactions
        risk += 0.3
    
    # Add some randomness
    risk = min(0.95, risk + random.uniform(-0.1, 0.1))
    risk = max(0.01, risk)  # Ensure risk is between 1% and 95%
    
    return {
        "fraud_probability": round(risk, 4),
        "fraud_label": 1 if risk > 0.5 else 0,
        "model_type": "mock-heuristic"
    }

@app.get("/health")
def health():
    return {"status": "ok", "model": "mock-heuristic"}

@app.post("/predict")
def predict(features: Dict):
    try:
        return mock_fraud_detection(features)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)