import requests

def get_stock_price(ticker):
    try:
        url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={ticker}"
        r = requests.get(url, timeout=5).json()
        return r["quoteResponse"]["result"][0]["regularMarketPrice"]
    except:
        return None