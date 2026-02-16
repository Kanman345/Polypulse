from flask import Flask, jsonify
from flask_cors import CORS
import traceback
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

app = Flask(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
CORS(app, resources={r"/api/*": {"origins": [FRONTEND_URL]}}, supports_credentials=True)


# -------- Lazy Analysis Pipeline --------
def run_analysis_pipeline():
    from Polymarket_Updated import fetch_all_market_data, run_llm_analysis, extract_json

    market_data = fetch_all_market_data()
    llm_output = run_llm_analysis(market_data)
    analysis = extract_json(llm_output)

    # Lazy import storage (VERY IMPORTANT)
    from storage import save_predictions_to_storage
    save_predictions_to_storage(analysis)

    return market_data, analysis


@app.route('/')
def home():
    return {"status": "success", "message": "Polypulse Backend is live!"}, 200


@app.route('/api/market-analysis', methods=['GET'])
def get_market_analysis():
    try:
        market_data, analysis = run_analysis_pipeline()

        return jsonify({
            "success": True,
            "market_data": market_data,
            "analysis": analysis,
            "timestamp": None
        })

    except Exception as e:
        print(f"Error: {e}")
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


if __name__ == '__main__':
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=port, debug=debug)