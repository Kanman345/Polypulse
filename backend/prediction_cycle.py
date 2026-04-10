from datetime import datetime, date, timedelta
import uuid
from db import supabase

# ---------------------------------------------------
# 3-Week cycle window
# ---------------------------------------------------
def get_current_cycle_window():
    today = date.today()
    
    # Calculate which 3-week cycle we're in
    # Cycle starts on Monday of week 1, 14, 27, 40, 53 (roughly every 3 weeks)
    year, week, _ = today.isocalendar()
    
    # Determine which 3-week cycle this week belongs to
    cycle_number = (week - 1) // 3
    start_week = cycle_number * 3 + 1
    
    # Get the Monday of the start week
    start_date = datetime.strptime(f"{year}-W{start_week:02d}-1", "%Y-W%W-%w").date()
    end_date = start_date + timedelta(days=20)  # 3 weeks = 21 days
    
    return start_date, end_date


# ---------------------------------------------------
# Unique batch id per 3-week cycle
# ---------------------------------------------------

def create_new_batch_id():
    now = datetime.utcnow()
    year, week, _ = now.isocalendar()
    cycle_number = (week - 1) // 3
    return f"cycle_{year}_{cycle_number}"


# ---------------------------------------------------
# Fetch existing predictions for THIS 3-week cycle
# ---------------------------------------------------
def get_existing_cycle_predictions():
    now = datetime.utcnow()
    year, week, _ = now.isocalendar()
    cycle_number = (week - 1) // 3
    batch_id = f"cycle_{year}_{cycle_number}"

    res = supabase.table("predictions") \
        .select("*") \
        .eq("batch_id", batch_id) \
        .execute()

    return res.data if res.data else None


# ---------------------------------------------------
# Archive predictions older than 3 weeks
# ---------------------------------------------------
def archive_old_predictions():
    """Mark predictions older than 3 weeks as inactive"""
    three_weeks_ago = datetime.utcnow() - timedelta(days=21)
    
    rows = supabase.table("predictions") \
        .select("*") \
        .eq("is_active", True) \
        .lt("created_at", three_weeks_ago.isoformat()) \
        .execute().data
    
    for row in rows:
        supabase.table("predictions") \
            .update({"is_active": False, "archived_at": datetime.utcnow().isoformat()}) \
            .eq("id", row["id"]) \
            .execute()
    
    print(f"Archived {len(rows) if rows else 0} predictions older than 3 weeks.")


# ---------------------------------------------------
# Backward compatibility aliases
# ---------------------------------------------------
def get_current_week_window():
    """Deprecated: Use get_current_cycle_window() instead"""
    return get_current_cycle_window()


def get_existing_weekly_predictions():
    """Deprecated: Use get_existing_cycle_predictions() instead"""
    return get_existing_cycle_predictions()