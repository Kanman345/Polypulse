from datetime import datetime
from db import supabase
from market_prices import get_current_price
from price_validator import validate_price_target
from prediction_cycle import (
    get_current_week_window,
    create_new_batch_id,
    get_existing_weekly_predictions
)

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

    if not analysis or "top_stocks" not in analysis:
        return

    # 🔒 HARD LOCK — stop regeneration
    existing = get_existing_weekly_predictions()
    if existing:
        print("Weekly predictions already exist — skipping insert")
        return existing

    batch_id = create_new_batch_id()
    start, end = get_current_week_window()

    supabase.table("predictions") \
        .update({"is_active": False}) \
        .eq("is_active", True) \
        .execute()

    for stock in analysis["top_stocks"]:

        ticker = stock["ticker"]
        predicted_target = stock.get("price_target")

        # 1️⃣ Get real market price
        current_price = get_current_price(ticker)
        if current_price is None:
            print(f"Skipping {ticker} — price unavailable")
            continue

        # 2️⃣ Validate / adjust target
        safe_target = validate_price_target(
            ticker=ticker,
            current_price=current_price,
            predicted_price=predicted_target,
            horizon="3m"
        )

        print(f"{ticker}: current={current_price} predicted={predicted_target} saved={safe_target}")

        # 3️⃣ Save ONLY ONCE PER WEEK
        supabase.table("predictions").insert({
            "ticker": ticker,
            "price_target": safe_target,
            "start_price": current_price,
            "target_period": "3 months",
            "confidence": extract_stock_confidence(stock, analysis),
            "reasoning": stock.get("reasoning", "Macro AI inference"),
            "saved_at": datetime.utcnow().isoformat(),
            "generated_at": datetime.utcnow().isoformat(),
            "cycle_start": str(start),
            "cycle_end": str(end),
            "batch_id": batch_id,
            "is_active": True
        }).execute()

    print("Saved weekly predictions:", batch_id)


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