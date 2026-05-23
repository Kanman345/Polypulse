from datetime import datetime, timedelta
from db import supabase
import json

REFRESH_INTERVAL_DAYS = 21  # 3 weeks


def should_refresh_predictions():
    """
    Check if we should generate new predictions (every 3 weeks).
    Only refreshes if no active prediction batch exists or 3+ weeks have passed.
    """
    try:
        # Get the most recent active prediction batch
        result = supabase.table("predictions") \
            .select("created_at") \
            .eq("is_active", True) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        
        if not result.data:
            return True  # No active predictions exist yet
        
        # Parse the timestamp and compare with current UTC time
        last_created_str = result.data[0]["created_at"]
        # Handle both ISO format with and without 'Z'
        if last_created_str.endswith('Z'):
            last_created = datetime.fromisoformat(last_created_str.replace('Z', '+00:00'))
        else:
            last_created = datetime.fromisoformat(last_created_str)
        
        # Get current UTC time (naive for comparison)
        now_utc = datetime.utcnow().replace(tzinfo=None) if last_created.tzinfo else datetime.utcnow()
        last_created_naive = last_created.replace(tzinfo=None) if last_created.tzinfo else last_created
        
        days_since = (now_utc - last_created_naive).days
        
        should_refresh = days_since >= REFRESH_INTERVAL_DAYS
        print(f"🔍 Last prediction: {days_since} days ago. Refresh needed: {should_refresh}")
        
        return should_refresh
    
    except Exception as e:
        print(f"⚠️ Error checking refresh interval: {e}")
        return False  # Conservative: don't refresh if there's an error


def archive_old_predictions():
    """
    Move predictions to prediction_tracker after 3 weeks.
    Only archives if they haven't already been archived.
    """
    try:
        cutoff_date = (datetime.utcnow() - timedelta(days=REFRESH_INTERVAL_DAYS)).isoformat()
        
        # Get old active predictions
        old_preds = supabase.table("predictions") \
            .select("*") \
            .lt("created_at", cutoff_date) \
            .eq("is_active", True) \
            .execute()
        
        if not old_preds.data:
            return 0
        
        archived_count = 0
        for pred in old_preds.data:
            try:
                # Save to tracker
                supabase.table("prediction_tracker").insert({
                    "ticker": pred["ticker"],
                    "price_target": pred["price_target"],
                    "current_price": pred["entry_price"],
                    "confidence": pred["confidence"],
                    "reasoning": pred["reasoning"],
                    "prediction_created_at": pred["created_at"],
                    "archived_at": datetime.utcnow().isoformat(),
                    "meta": json.dumps(pred)
                }).execute()
                
                # Mark as inactive
                supabase.table("predictions") \
                    .update({"is_active": False}) \
                    .eq("id", pred["id"]) \
                    .execute()
                
                archived_count += 1
            except Exception as e:
                print(f"⚠️ Error archiving prediction {pred.get('id')}: {e}")
        
        if archived_count > 0:
            print(f"✓ Archived {archived_count} predictions to tracker")
        
        return archived_count
    
    except Exception as e:
        print(f"⚠️ Error in archive process: {e}")
        return 0


def save_predictions_to_storage(analysis):
    """
    Save asset predictions (NVIDIA, Bitcoin, Gold) to Supabase.
    PROTECTED: Only refreshes every 3 weeks minimum. Safe to call every 6 hours.
    
    Args:
        analysis: dict from LLM with {
            "asset_price_predictions": {
                "nvidia": {...},
                "bitcoin": {...},
                "gold": {...}
            },
            "asset_outlook": {...},
            "crowd_signals": {...}
        }
    """
    
    # 🛡️ PROTECTION: Check if we should refresh predictions
    if not should_refresh_predictions():
        print("⏳ Predictions locked for next 3 weeks. Skipping prediction update (but market data still updates).")
        return
    
    print("📊 Refreshing predictions after 3-week interval...")
    
    # Archive predictions older than 3 weeks before creating new ones
    archive_old_predictions()
    
    if not analysis or "asset_price_predictions" not in analysis:
        print("❌ No asset_price_predictions found in analysis")
        return
    
    assets_to_save = ["nvidia", "bitcoin", "gold"]
    predictions = analysis.get("asset_price_predictions", {})
    outlooks = analysis.get("asset_outlook", {})
    
    batch_id = datetime.utcnow().isoformat()
    saved_count = 0
    
    for asset in assets_to_save:
        if asset not in predictions:
            print(f"⚠️ Skipping {asset} - not in predictions")
            continue
        
        pred = predictions[asset]
        outlook = outlooks.get(asset, {})
        
        try:
            # Map asset name to ticker for display
            ticker_map = {
                "nvidia": "NVDA",
                "bitcoin": "BTC",
                "gold": "GLD"
            }
            ticker = ticker_map[asset]
            
            supabase.table("predictions").insert({
                "ticker": ticker,
                "asset_name": asset,
                "entry_price": pred.get("current_price"),
                "price_target": pred.get("price_target"),
                "target_period": pred.get("target_period", "3 months"),
                "confidence": pred.get("confidence"),
                "reasoning": pred.get("reasoning", "Macro AI inference"),
                "bias": outlook.get("bias"),
                "outlook_confidence": outlook.get("confidence"),
                "created_at": datetime.utcnow().isoformat(),
                "batch_id": batch_id,
                "is_active": True,
                "meta": json.dumps({
                    "market_sentiment": analysis.get("market_sentiment"),
                    "market_regime": analysis.get("market_regime"),
                    "crowd_signals": analysis.get("crowd_signals")
                })
            }).execute()
            
            saved_count += 1
            print(f"✓ {ticker}: ${pred.get('current_price')} → ${pred.get('price_target')} (confidence: {pred.get('confidence')})")
        
        except Exception as e:
            print(f"❌ Error saving {asset}: {e}")
    
    if saved_count > 0:
        print(f"\n✅ Saved {saved_count} predictions to Supabase (next refresh in 3 weeks)")
    else:
        print("❌ No predictions saved")