from datetime import datetime
from db import supabase
from market_prices import get_current_price


def update_all_prediction_progress():

    rows = supabase.table("predictions") \
        .select("*") \
        .eq("is_active", False) \
        .execute().data

    for row in rows:

        current_price = get_current_price(row["ticker"])
        if not current_price:
            continue

        start = float(row["start_price"])
        target = float(row["price_target"])

        if target == start:
            continue

        # % progress toward target
        progress = ((current_price - start) / (target - start)) * 100

        # clamp between -100 and 100
        progress = max(min(progress, 100), -100)

        hit = None
        status = "Tracking"

        if row["direction"] == "UP":
            if current_price >= target:
                hit = True
                status = "Hit"
        else:
            if current_price <= target:
                hit = True
                status = "Hit"

        # check expiry
        if row["expires_at"]:
            expiry = datetime.fromisoformat(row["expires_at"])
            if datetime.utcnow() > expiry and not hit:
                status = "Expired"

        supabase.table("predictions") \
            .update({
                "last_price": current_price,
                "progress": round(progress, 2),
                "hit": hit,
                "status": status
            }) \
            .eq("id", row["id"]) \
            .execute()

    print("Prediction tracker updated.")