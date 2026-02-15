import json
import os
from datetime import datetime

PREDICTIONS_FILE = "predictions.json"

def save_predictions_to_storage(llm_output):
    """Save LLM stock recommendations to local storage"""
    predictions = load_predictions()
    
    for stock in llm_output.get("top_stocks", []):
        entry = {
            "id": int(datetime.now().timestamp() * 1000),
            "ticker": stock.get("ticker"),
            "priceTarget": stock.get("price_target"),
            "targetPeriod": stock.get("target_period"),
            "confidence": stock.get("confidence"),
            "reasoning": stock.get("reasoning"),
            "savedAt": datetime.now().isoformat(),
            "actualPrice": None,
            "hit": None
        }
        predictions.append(entry)
    
    with open(PREDICTIONS_FILE, "w") as f:
        json.dump(predictions, f, indent=2)

def load_predictions():
    """Load all predictions from storage"""
    if not os.path.exists(PREDICTIONS_FILE):
        return []
    try:
        with open(PREDICTIONS_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def update_prediction_price(pred_id, actual_price):
    """Update prediction with actual price and hit status"""
    predictions = load_predictions()
    
    for pred in predictions:
        if pred["id"] == pred_id:
            pred["actualPrice"] = actual_price
            pred["hit"] = actual_price >= pred["priceTarget"]
    
    with open(PREDICTIONS_FILE, "w") as f:
        json.dump(predictions, f, indent=2)