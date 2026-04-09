from dotenv import load_dotenv
import os

# Load environment variables FIRST before any other imports
load_dotenv()

import requests
import json
import time
from langchain_groq import ChatGroq
from prices import get_prices_batch

# ===============================
# CONFIG
# ===============================

GAMMA_BASE = "https://gamma-api.polymarket.com"
CLOB_BASE = "https://clob.polymarket.com"

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables. Please set it in .env file.")

# Exact (human) event titles from Polymarket
PREDEFINED_EVENT_IDS = {
    # 📈 Economy & Macro
    "fed_decision_march": 67284,
    "treasury_yield_high": 79104,
    "treasury_yield_low": 79123,
    "microstrategy_btc_sale": 16167,
    # 🤖 AI & Tech
    "ai_frontiermath_90": 79080,
    "inflation_2026": 80773,
    "us_recession_2026": 48802,
    "nvidia_february_2026": 186955
}

# ===============================
# HELPERS
# ===============================

from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def make_session():
    session = requests.Session()

    retries = Retry(
        total=5,
        backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )

    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)

    return session

SESSION = make_session()

import re

def extract_json(llm_output):
    """
    Extract the FIRST valid JSON object from an LLM response safely.
    Works even if the model adds text before/after JSON.
    """

    if hasattr(llm_output, "content"):
        llm_output = llm_output.content

    if isinstance(llm_output, dict):
        return llm_output

    if not isinstance(llm_output, str):
        raise ValueError("Unsupported LLM output format")

    # Find first '{'
    start = llm_output.find("{")
    if start == -1:
        raise ValueError("No JSON object found in LLM output")

    # Incrementally try to parse until valid
    for i in range(len(llm_output), start, -1):
        candidate = llm_output[start:i]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue

    raise ValueError("Failed to extract valid JSON from LLM output")

def get_event_by_id(event_id):
    try:
        resp = SESSION.get(
            f"{GAMMA_BASE}/events/{event_id}",
            timeout=15
        )
        resp.raise_for_status()
        return resp.json()

    except requests.exceptions.RequestException as e:
        print(f"⚠️ Failed to fetch event {event_id}: {e}")
        return None

# ===============================
# CLOB → PRICE (PUBLIC ENDPOINT)
# ===============================
import statistics

def compute_nvidia_confidence(market_data):
    """Calculate NVIDIA confidence from price target distribution.
    
    Handles edge cases:
    - When all probs are 100%, distribute confidence proportionally
    - When std=0, cap at 0.85 to avoid overconfidence
    - Use spread of price levels as signal strength
    """
    probs = []

    for m in market_data:
        if m["event_key"] == "nvidia_february_2026":
            q = m["market_question"]
            p = m["outcomes"].get("Yes", 0)

            if "reach $" in q:
                try:
                    price = int(q.split("$")[1].split()[0])
                    if price >= 200:
                        probs.append(p)
                except (ValueError, IndexError):
                    continue

    if len(probs) < 2:
        return 0.5

    avg = statistics.mean(probs)
    std = statistics.pstdev(probs) if len(probs) > 1 else 0

    # Handle redundant probabilities (all same → cap confidence)
    if std == 0:
        # When all 100%, cap at 0.75; when all 0%, return 0.3
        if avg >= 0.95:
            return 0.75
        elif avg <= 0.05:
            return 0.30
        else:
            return round(avg, 2)

    # Blend avg (conviction) with disagreement metric
    # Higher disagreement (higher std) → lower confidence
    # But still weight average heavily
    confidence = avg * 0.7 + (1 - std) * 0.3
    
    return round(min(confidence, 0.90), 2)  # Cap at 0.90 for realistic bounds
def fetch_token_midpoint(token_id):
    try:
        resp = requests.get(
            f"{CLOB_BASE}/midpoint",
            params={"token_id": token_id},
            timeout=10
        )

        if resp.status_code != 200:
            return None

        data = resp.json()

        # Handle all real-world cases
        if "midpoint" in data and data["midpoint"] is not None:
            return float(data["midpoint"])

        if "price" in data and data["price"] is not None:
            return float(data["price"])

        return None

    except (requests.exceptions.RequestException, ValueError, TypeError):
        return None

# ===============================
# CORE DATA PIPELINE
# ===============================

def parse_outcome_prices(outcome_prices):
    """
    outcomePrices can be:
    - list[str]
    - JSON-encoded string of list[str]
    """
    if isinstance(outcome_prices, str):
        try:
            outcome_prices = json.loads(outcome_prices)
        except json.JSONDecodeError:
            return None

    if not isinstance(outcome_prices, list):
        return None

    return [float(p) for p in outcome_prices]

def get_safe_outcome_labels(market, token_ids):
    labels = market.get("outcomes")

    if isinstance(labels, list) and len(labels) == len(token_ids):
        return labels

    # Heuristic: binary markets
    if len(token_ids) == 2:
        return ["No", "Yes"]

    return [f"Outcome_{i}" for i in range(len(token_ids))]

def fetch_all_market_data():
    results = []

    for key, event_id in PREDEFINED_EVENT_IDS.items():
        time.sleep(0.3)
        event = get_event_by_id(event_id)
        if not event:
            continue

        for market in event.get("markets", []):
            if "clobTokenIds" not in market:
                continue

            token_ids = json.loads(market["clobTokenIds"])

            raw_prices = {}

            # Try CLOB first
            for token_id in token_ids:
                price = fetch_token_midpoint(token_id)
                if price is not None:
                    raw_prices[token_id] = price

            # If CLOB is illiquid, fall back to Gamma outcomePrices
            if len(raw_prices) < 2:
                outcome_prices = market.get("outcomePrices")
                if not outcome_prices:
                    continue

                # outcomePrices are strings like ["0.32", "0.68"]
                parsed_prices = parse_outcome_prices(market.get("outcomePrices"))
                if not parsed_prices or len(parsed_prices) != len(token_ids):
                    continue

                raw_prices = {
                    token_id: price
                    for token_id, price in zip(token_ids, parsed_prices)
                }

            total = sum(raw_prices.values())
            if total == 0:
                continue

            labels = get_safe_outcome_labels(market, token_ids)

            outcomes = {
                label: round(raw_prices[token_id] / total, 4)
                for label, token_id in zip(labels, token_ids)
            }

            results.append({
                "event_key": key,
                "event_id": event_id,
                "event_title": event["title"],
                "market_id": market["id"],
                "market_question": market["question"],
                "outcomes": outcomes,
                "volume": market.get("volume", 0),
                "end_date": market.get("endDate")
            })

    return results

# ===============================
# LLM INTERPRETATION
# ===============================

def run_llm_analysis(market_data):
    llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model="llama-3.1-8b-instant"
    )
    nvidia_confidence = compute_nvidia_confidence(market_data)

    # Filter market data to reduce token count
    filtered_data = [
        {
            "event_key": m["event_key"],
            "event_title": m["event_title"],
            "market_question": m["market_question"],
            "outcomes": m["outcomes"]
        }
        for m in market_data
    ]
    from market_prices import get_current_price

    # Fetch all prices in batch with Finnhub (with delays to avoid rate limiting)
    prices = get_prices_batch({
        "nvidia": "NVDA",
        "bitcoin": "BINANCE:BTCUSDT",
        "gold": "GLD"  # Changed from OANDA:XAU_USD to GLD (SPDR Gold ETF) - works with Finnhub
    })
    
    price_map = {}
    
    # Build price map with fallbacks
    if prices.get("nvidia"):
        price_map["nvidia"] = round(prices["nvidia"], 2)
    
    if prices.get("bitcoin"):
        price_map["bitcoin"] = round(prices["bitcoin"], 2)
    
    if prices.get("gold"):
        price_map["gold"] = round(prices["gold"], 2)
    else:
        # Fallback only if Finnhub failed for gold
        price_map["gold"] = 1925.0
        print("⚠️ Gold price fetch failed. Using fallback: $1925.0")

    price_context = json.dumps(price_map, indent=2)

    prompt = f"""
    Infer macro regime and asset outlook from prediction market probabilities.
    
    CURRENT PRICES (USD): {price_context}
    NVIDIA_CONFIDENCE_OVERRIDE: {nvidia_confidence}
    
    MARKET DATA:
    {json.dumps(filtered_data, indent=2)}
    
    RETURN PURE JSON ONLY (no text, backticks, or markdown).
    
    {{
      "market_sentiment": {{"label": "Bullish|Neutral|Bearish", "score": 0-100}},
      "market_regime": {{"risk": "Risk-On|Risk-Off|Transitional", "liquidity": "Easing|Neutral|Tightening", "volatility": "Low|Normal|Elevated"}},
      "crowd_signals": {{"fed_policy_bias": "string", "recession_probability": 0-1, "rate_cut_bias": "string"}},
      "asset_outlook": {{
        "nvidia": {{"bias": "Positive|Neutral|Negative", "confidence": 0-1, "reasoning": "non-empty string"}},
        "bitcoin": {{"bias": "Positive|Neutral|Negative", "confidence": 0-1, "reasoning": "non-empty string"}},
        "us_economy": {{"bias": "Positive|Neutral|Negative", "confidence": 0-1, "reasoning": "non-empty string"}}
      }},
      "asset_price_predictions": {{
        "nvidia": {{"current_price": number, "price_target": number (±25% of current, min 2% move), "target_period": "3 months", "confidence": 0-1, "reasoning": "1-2 sentences"}},
        "bitcoin": {{"current_price": number, "price_target": number (±25% of current, min 2% move), "target_period": "3 months", "confidence": 0-1, "reasoning": "1-2 sentences"}},
        "gold": {{"current_price": number, "price_target": number (±25% of current, min 2% move), "target_period": "3 months", "confidence": 0-1, "reasoning": "1-2 sentences"}}
      }},
      "sector_performance": [
        {{"name": "Technology", "performance": number, "change": "string"}},
        {{"name": "Healthcare", "performance": number, "change": "string"}},
        {{"name": "Financials", "performance": number, "change": "string"}},
        {{"name": "Industrials", "performance": number, "change": "string"}},
        {{"name": "Energy", "performance": number, "change": "string"}}
      ],
      "risk_indicators": {{"bubble_risk": 0-100, "market_fragility": 0-100, "upside_probability": 0-100}}
    }}
    
    CRITICAL RULES:
    - NVIDIA confidence = {nvidia_confidence} (non-negotiable)
    - GOLD current_price = {price_map.get('gold', 'N/A')} (copy exactly, don't hallucinate)
    - Price targets MUST move minimum 2% from current
    - Risk-On regime: +40% max upside, -5% max downside floor
    - Risk-Off regime: +25% max upside, ALLOW -30% downside (downturns are real)
    - Neutral regime: +30% max upside, -10% max downside
    - Format sector change: if performance >= 0 use "+X%" else "X%"
    - Risk-Off regime → Bitcoin neutral/negative, Gold positive
    - Recession prob > 0.6 → no Bullish sentiment, Energy/Industrials negative
    - ALL reasoning fields must be non-empty and reference market signals
    - Accuracy over excitement. Meaningful downside OK in downturns.
    """

    response = llm.invoke(prompt)
    llm_json = extract_json(response.content)
    return llm_json

# ===============================
# MAIN
# ===============================

if __name__ == "__main__":
    print("\nFetching Polymarket data...\n")
    market_data = fetch_all_market_data()

    if not market_data:
        raise RuntimeError("No Polymarket data fetched — aborting.")

    print("=== RAW MARKET DATA ===")
    print(json.dumps(market_data, indent=2))

    print("\nRunning LLM interpretation...\n")
    parsed = run_llm_analysis(market_data)

    print("=== LLM OUTPUT (PARSED) ===")
    print(json.dumps(parsed, indent=2))

    try:
        # Extract macro regime for validator to respect downside
        macro_regime = parsed.get("market_regime", {}).get("risk", "Neutral")
        
        # Optionally apply validator to clamp targets
        # (Commented for now - let LLM predictions flow through)
        # from price_validator import validate_price_target
        # for asset in ["nvidia", "bitcoin", "gold"]:
        #     if asset in parsed.get("asset_price_predictions", {}):
        #         pred = parsed["asset_price_predictions"][asset]
        #         pred["price_target"] = validate_price_target(
        #             pred["current_price"],
        #             pred["price_target"],
        #             macro_regime=macro_regime
        #         )
        
        # Save predictions locally
        from storage import save_predictions_to_storage
        save_predictions_to_storage(parsed)
        print("\n✓ Predictions saved to local storage")
    except Exception as e:
        print(f"\n⚠️ Error processing predictions: {e}")