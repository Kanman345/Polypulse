from datetime import datetime
from db import supabase

def extract_stock_confidence(stock, analysis):
    """
    Create confidence score for each stock
    """

    ticker = stock.get("ticker")

    # Special handling for NVIDIA
    if ticker == "NVDA":
        return analysis.get("asset_outlook", {}).get("nvidia", {}).get("confidence", 0.7)

    # Map expected_outperformance → probability
    mapping = {
        "High": 0.75,
        "Moderate": 0.65,
        "Medium": 0.60,
        "Low": 0.45
    }

    return mapping.get(stock.get("expected_outperformance"), 0.5)

def save_predictions_to_storage(analysis):
    """
    Save ONLY the 3 stock recommendations from the LLM output
    """

    if not analysis or "top_stocks" not in analysis:
        return

    for stock in analysis["top_stocks"]:
        try:
            supabase.table("predictions").insert({
                "id": int(datetime.now().timestamp() * 1000),
                "ticker": stock.get("ticker"),
                "price_target": stock.get("price_target"),
                "target_period": stock.get("target_period"),
                "confidence": extract_stock_confidence(stock, analysis),
                "reasoning": stock.get("reasoning") or "AI macro inference",
                "saved_at": datetime.utcnow().isoformat(),
                "actual_price": None,
                "hit": None
            }).execute()

        except Exception as e:
            print("Failed to save prediction:", e)


def update_prediction_price(pred_id, actual_price):
    """
    After time passes, update whether prediction was correct
    """

    prediction = supabase.table("predictions") \
        .select("price_target") \
        .eq("id", pred_id) \
        .execute()

    if prediction.data:
        price_target = prediction.data[0]["price_target"]

        supabase.table("predictions") \
            .update({
                "actual_price": actual_price,
                "hit": actual_price >= price_target
            }) \
            .eq("id", pred_id) \
            .execute()