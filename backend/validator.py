from datetime import datetime, timedelta
from supabase import create_client
from market_prices import get_current_price
import os

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

def validate_predictions():
    rows = supabase.table("predictions") \
        .select("*") \
        .eq("checked", False) \
        .execute().data

    now = datetime.utcnow()

    for row in rows:
        target_date = row["saved_at"] + timedelta(days=row["validation_horizon_days"])

        if now < target_date:
            continue

        current_price = get_current_price(row["ticker"])
        if current_price is None:
            continue

        target = float(row["price_target"])
        hit = current_price >= target

        supabase.table("predictions") \
            .update({
                "actual_price": current_price,
                "hit": hit,
                "validated_at": now,
                "checked": True
            }) \
            .eq("id", row["id"]) \
            .execute()

    print("Validation complete")