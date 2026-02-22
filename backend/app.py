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
        # 1️⃣ Fetch latest cached macro analysis
        cache_res = supabase.table("market_analysis_cache") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()

        if not cache_res.data:
            return jsonify({
                "success": False,
                "error": "No cached analysis available"
            }), 500

        latest = cache_res.data[0]
        analysis = latest["analysis"]
        market_data = latest["market_data"]

        # 2️⃣ Fetch weekly stock recommendations (already stored separately)
        existing = get_existing_weekly_predictions()

        if existing:
            print("Using cached weekly recommendations")

            top_stocks = []
            for row in existing:
                top_stocks.append({
                    "ticker": row["ticker"],
                    "name": row["ticker"],
                    "sector": "Macro AI Selection",
                    "reasoning": row["reasoning"],
                    "price_target": float(row["price_target"]),
                    "current_price": float(row["start_price"]),
                    "confidence": float(row["confidence"]),
                    "target_period": row["target_period"],
                    "expected_outperformance": (
                        "High"
                        if float(row["price_target"]) > float(row["start_price"])
                        else "Moderate"
                    )
                })

            analysis["top_stocks"] = top_stocks
            cached = True

        else:
            # No weekly picks found (shouldn't happen after cron runs)
            analysis["top_stocks"] = []
            cached = False

        return jsonify({
            "success": True,
            "analysis": analysis,
            "market_data": market_data,
            "cached_recommendations": cached
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
    
if __name__ == '__main__':
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=port, debug=debug)
