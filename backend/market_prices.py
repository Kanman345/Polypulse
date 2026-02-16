import requests
import os

FINNHUB = os.getenv("FINNHUB_API_KEY")


def get_current_price(ticker: str):
    """
    Fetch latest market price from Finnhub
    Returns float or None
    """

    if not FINNHUB:
        print("FINNHUB_API_KEY missing")
        return None

    try:
        url = "https://finnhub.io/api/v1/quote"
        r = requests.get(url, params={"symbol": ticker, "token": FINNHUB}, timeout=4)

        if r.status_code != 200:
            print(f"Finnhub error for {ticker}: {r.status_code}")
            return None

        data = r.json()
        price = data.get("c")

        if not price or price == 0:
            return None

        return float(price)

    except Exception as e:
        print(f"Price fetch failed for {ticker}: {e}")
        return None