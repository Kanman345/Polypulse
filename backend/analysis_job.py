from datetime import datetime
from db import supabase
from Polymarket_Updated import fetch_all_market_data, run_llm_analysis, extract_json
from prediction_tracker import update_all_prediction_progress
from prediction_cycle import archive_old_predictions

def run_full_analysis():
    print("Running scheduled 6-hour analysis...")

    market_data = fetch_all_market_data()
    llm_output = run_llm_analysis(market_data)
    analysis = extract_json(llm_output)

    supabase.table("market_analysis_cache").insert({
        "analysis": analysis,
        "market_data": market_data,
        "created_at": datetime.utcnow().isoformat()
    }).execute()

    from storage import save_predictions_to_storage
    save_predictions_to_storage(analysis)
    
    # Archive predictions older than 3 weeks
    try:
        archive_old_predictions()
    except Exception as e:
        print("Archive old predictions failed:", e)
    
    # Update tracker with current progress
    try:
        update_all_prediction_progress()
    except Exception as e:
        print("Tracker update failed:", e)

    print("Analysis saved successfully.")

if __name__ == "__main__":
    run_full_analysis()