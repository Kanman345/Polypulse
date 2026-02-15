import requests
import json
import os
import time
from langchain_groq import ChatGroq

# ===============================
# CONFIG
# ===============================

GAMMA_BASE = "https://gamma-api.polymarket.com"
CLOB_BASE = "https://clob.polymarket.com"

from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

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

def extract_json(text):
    text = text.strip()

    # Remove fenced code blocks safely
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No JSON object found")

    return json.loads(match.group(0))

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
    probs = []

    for m in market_data:
        if m["event_key"] == "nvidia_february_2026":
            q = m["market_question"]
            p = m["outcomes"].get("Yes", 0)

            if "reach $" in q:
                price = int(q.split("$")[1].split()[0])
                if price >= 200:
                    probs.append(p)

    if len(probs) < 2:
        return 0.5

    avg = statistics.mean(probs)
    std = statistics.pstdev(probs)

    # Confidence increases with conviction AND agreement
    confidence = avg * (1 - std)

    return round(confidence, 2)
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

    prompt = f"""
    You are a macro market intelligence engine.

    You are given real-money probabilities from prediction markets.
    Your job is to infer the current macro regime and market outlook.

    INPUT DATA:
    {json.dumps(filtered_data, indent=2)}
    DERIVED SIGNALS:
    NVIDIA_CONFIDENCE_OVERRIDE = {nvidia_confidence}

    OUTPUT REQUIREMENTS:
    Return ONE valid JSON object with the following structure:

    {{
    "market_sentiment": {{
        "label": "Bullish | Neutral | Bearish",
        "score": integer between 0 and 100
    }},
    "market_regime": {{
        "risk": "Risk-On | Risk-Off | Transitional",
        "liquidity": "Easing | Neutral | Tightening",
        "volatility": "Low | Normal | Elevated"
    }},
    "crowd_signals": {{
        "fed_policy_bias": "",
        "recession_probability": number between 0 and 1,
        "rate_cut_bias": ""
    }},
    "asset_outlook": {{
        "nvidia": {{
        "bias": "Positive | Neutral | Negative",
        "confidence": number between 0 and 1,
        "reasoning": ""
        }},
        "bitcoin": {{
        "bias": "",
        "confidence": number between 0 and 1
        }},
        "us_economy": {{
        "bias": "",
        "confidence": number between 0 and 1
        }}
    }},
    "top_stocks": [
        {{
        "name": "",
        "ticker": "",
        "sector": "",
        "reasoning": "",
        "expected_outperformance": "Moderate | High",
        "price_target": number (estimated target price in USD),
        "target_period": "string (e.g., '3-6 months', '6-12 months', '12+ months')"
        }}
    ],
    "sector_performance": [
        {{
        "name": "sector_name",
        "performance": number (YTD return as decimal: e.g., 12.5 for +12.5%),
        "change": "string (e.g., '+2.1%' or '-0.8%')"
        }}
    ],
    "risk_indicators": {{
        "bubble_risk": integer between 0 and 100,
        "market_fragility": integer between 0 and 100,
        "upside_probability": integer between 0 and 100
    }}
    }}

    RULES:
    - Base conclusions ONLY on the input probabilities
    - Prioritize rates, yields, inflation, and recession risk over narratives
    - Do NOT mention prediction markets
    - Do NOT add text outside JSON
    - Stocks MUST be individual operating companies
    - ETFs, indices, sector funds, and baskets are STRICTLY forbidden
    - Return EXACTLY 3 stocks in "top_stocks"
    - Bitcoin outlook refers to the asset itself
    - A specific NVIDIA-related prediction market is present
    - NVIDIA outlook MUST be derived from the distribution of its price target probabilities
    - You MUST use NVIDIA_CONFIDENCE_OVERRIDE as the confidence value for NVIDIA.
    - Do NOT copy a single price-level probability as confidence.
    - Consider both upside levels and downside protection
    - Do NOT include a generic equities outlook
    - For each stock recommendation, provide a realistic price_target based on the stock's sector outlook and market conditions
    - price_target should be realistic (typically 10-50% upside for "Moderate" and 30-100%+ for "High" expected outperformance)
    - target_period must be one of: "1-3 months", "3-6 months", "6-12 months", "12+ months"
    - sector_performance MUST include 5 sectors: Technology, Healthcare, Financials, Industrials, Energy
    - Sector performance values should reflect the market outlook and recession/rate probabilities
    - Use realistic YTD performance ranges (-15% to +20% range)
    - Higher recession probability should lead to lower energy and industrial performance
    - Fed policy and rate expectations should influence financial sector performance

    CONSISTENCY RULES (MANDATORY):
    - If recession_probability > 0.6:
    - market_sentiment MUST NOT be "Bullish"
    - market_regime.risk MUST be "Risk-Off" or "Transitional"
    - Energy and Industrials performance MUST be negative or near-zero
    - If NVIDIA has ≥ 2 price targets ≥ $200 with probability ≥ 0.8:
        nvidia.bias MUST be "Positive"
    - If fed_policy_bias is "Hawkish" and rate_cut_bias is "Unlikely":
    - liquidity MUST NOT be "Easing"
    - Financials performance MUST reflect rate environment
    - If volatility is "Elevated":
    - market_sentiment score MUST be ≤ 60

    Sentiment scoring guidance:
    - 0–30 = Bearish
    - 31–60 = Neutral
    - 61–100 = Bullish

    Return ONLY valid JSON.
    """

    response = llm.invoke(prompt)
    return response.content

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
    llm_output = run_llm_analysis(market_data)

    print("=== LLM OUTPUT ===")
    print(llm_output)

    try:
        parsed = extract_json(llm_output)
        print("\n=== PARSED OUTPUT ===")
        print(json.dumps(parsed, indent=2))
    except json.JSONDecodeError:
        print("\n⚠️ LLM output was not valid JSON")