from flask import Flask, jsonify
from flask_cors import CORS
import json
import sys
import traceback
import os
from dotenv import load_dotenv
from storage import save_predictions_to_storage

# Load environment from .env (if present)
load_dotenv()

from Polymarket_Updated import fetch_all_market_data, run_llm_analysis, extract_json

app = Flask(__name__)

# Frontend URL used for CORS — set FRONTEND_URL in Render/Vercel env vars
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Restrict CORS to the frontend origin for API routes
CORS(app, resources={r"/api/*": {"origins": [FRONTEND_URL]}}, supports_credentials=True)

@app.route('/')
def home():
    # Render's health checker loves a 200 OK response
    return {"status": "success", "message": "Polypulse Backend is live!"}, 200

@app.route('/api/market-analysis', methods=['GET'])
def get_market_analysis():
    """
    Main endpoint that returns complete market analysis
    """
    try:
        # Fetch market data
        market_data = fetch_all_market_data()
        
        if not market_data:
            return jsonify({"error": "No market data available"}), 500
        
        # Run LLM analysis
        llm_output = run_llm_analysis(market_data)
        
        # Parse the output
        try:
            analysis = extract_json(llm_output)
        except:
            # If extraction fails, try direct JSON parse
            analysis = json.loads(llm_output)

        save_predictions_to_storage(analysis)
        
        # Return combined data
        return jsonify({
            "success": True,
            "market_data": market_data,
            "analysis": analysis,
            "timestamp": None  # Can add timestamp if needed
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
    """
    Endpoint that returns just the raw market data without LLM analysis
    Useful for debugging or if LLM fails
    """
    try:
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
    """
    Simple health check endpoint
    """
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=port, debug=debug)
