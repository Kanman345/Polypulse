from flask import Flask, jsonify
from flask_cors import CORS
import traceback
import os
from dotenv import load_dotenv
load_dotenv()
from prediction_cycle import get_existing_weekly_predictions, create_new_batch_id, get_current_week_window
from db import supabase

from price_validator import validate_price_target
from storage import save_predictions_to_storage


# Load environment


app = Flask(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
CORS(app, resources={r"/api/*": {"origins": [FRONTEND_URL]}}, supports_credentials=True)


# -------- Lazy Analysis Pipeline --------
def run_analysis_pipeline():
    from Polymarket_Updated import fetch_all_market_data, run_llm_analysis, extract_json

    market_data = fetch_all_market_data()
    llm_output = run_llm_analysis(market_data)
    analysis = extract_json(llm_output)


    return market_data, analysis


@app.route('/')
def home():
    return {"status": "success", "message": "Polypulse Backend is live!"}, 200


@app.route('/api/market-analysis', methods=['GET'])
def get_market_analysis():
    try:
        # 1️⃣ Fetch active predictions as recommendations
        predictions_res = supabase.table("predictions") \
            .select("*") \
            .eq("is_active", True) \
            .order("created_at", desc=True) \
            .execute()

        top_stocks = []
        if predictions_res.data:
            for row in predictions_res.data:
                top_stocks.append({
                    "ticker": row["ticker"],
                    "name": row.get("asset_name", row["ticker"]),
                    "sector": "Market Analysis",
                    "reasoning": row.get("reasoning", ""),
                    "price_target": float(row["price_target"]),
                    "current_price": float(row["current_price"]),
                    "confidence": float(row["confidence"]),
                    "target_period": row.get("target_period", "3 months"),
                    "expected_outperformance": (
                        "High"
                        if float(row["price_target"]) > float(row["current_price"])
                        else "Moderate"
                    )
                })

        # 2️⃣ Try to fetch cached macro analysis if available
        cache_res = supabase.table("market_analysis_cache") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()

        if cache_res.data:
            latest = cache_res.data[0]
            analysis = latest.get("analysis", {})
            market_data = latest.get("market_data", [])
        else:
            # Fallback if no cache available
            analysis = {
                "market_sentiment": {"label": "Neutral", "score": 0.5},
                "market_regime": {
                    "risk": "Transitional",
                    "liquidity": "Neutral",
                    "volatility": "Normal"
                },
                "crowd_signals": {},
                "asset_outlook": {},
                "sector_performance": [],
                "risk_indicators": {}
            }
            market_data = []

        # Include active predictions as top_stocks
        analysis["top_stocks"] = top_stocks

        return jsonify({
            "success": True,
            "analysis": analysis,
            "market_data": market_data,
            "cached_recommendations": bool(cache_res.data)
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/raw-market-data', methods=['GET'])
def get_raw_market_data():
    try:
        from Polymarket_Updated import fetch_all_market_data
        market_data = fetch_all_market_data()

        if not market_data:
            return jsonify({"error": "No market data available"}), 500

        return jsonify({
            "success": True,
            "data": market_data
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200


@app.route('/api/run-scheduled-analysis', methods=['GET'])
def run_scheduled_analysis():
    try:
        from analysis_job import run_full_analysis
        run_full_analysis()
        return {"status": "analysis updated"}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}, 500
    
@app.route('/api/prediction-tracker', methods=['GET'])
def prediction_tracker():
    try:
        # Fetch archived/completed predictions from tracker table
        rows = supabase.table("prediction_tracker") \
            .select("*") \
            .order("archived_at", desc=True) \
            .execute()

        return jsonify({
            "success": True,
            "predictions": rows.data if rows.data else []
        })
    except Exception as e:
        print(f"Error fetching prediction tracker: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    
if __name__ == '__main__':
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=port, debug=debug)
