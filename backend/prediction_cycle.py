from datetime import datetime, date, timedelta
import uuid
from db import supabase

# ---------------------------------------------------
# Weekly window (Mon → Sun)
# ---------------------------------------------------
def get_current_week_window():
    today = date.today()

    start = today - timedelta(days=today.weekday())   # Monday
    end = start + timedelta(days=6)                    # Sunday

    return start, end


# ---------------------------------------------------
# Unique batch id per weekly run
# ---------------------------------------------------

def create_new_batch_id():
    now = datetime.utcnow()
    year, week, _ = now.isocalendar()
    return f"week_{year}_{week}"


# ---------------------------------------------------
# Fetch existing predictions for THIS week
# ---------------------------------------------------
def get_existing_weekly_predictions():
    now = datetime.utcnow()
    year, week, _ = now.isocalendar()
    batch_id = f"week_{year}_{week}"

    res = supabase.table("predictions") \
        .select("*") \
        .eq("batch_id", batch_id) \
        .execute()

    return res.data if res.data else None