from flask import Flask, jsonify
from flask_cors import CORS
import json
import sys
import traceback
from Polymarket_Updated import fetch_all_market_data, run_llm_analysis, extract_json

app = Flask(__name__)
CORS(app)

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
    app.run(debug=True, port=5001)
