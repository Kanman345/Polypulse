import requests
import time
from market_prices import get_current_price


def get_prices_batch(asset_names):
    """
    Fetch prices for multiple assets from Finnhub with small delays between calls.
    
    Args:
        asset_names: dict like {"nvidia": "NVDA", "bitcoin": "BINANCE:BTCUSDT", "gold": "GLD"}
    
    Returns:
        dict: {asset_name: price} with None for failed assets
        
    Note: GLD price is converted to gold spot price (per oz)
          1 GLD share ≈ 0.093 oz of gold, so gold_oz = GLD_price / 0.093
    """
    prices = {}
    GLD_OZ_PER_SHARE = 0.093  # 1 GLD share represents ~0.093 oz of gold
    
    for asset_name, ticker in asset_names.items():
        raw_price = get_current_price(ticker)
        
        if raw_price is None:
            prices[asset_name] = None
            print(f"✗ {asset_name} ({ticker}): API failed")
        elif asset_name == "gold" and ticker == "GLD":
            # Convert GLD share price to gold spot price (per oz)
            gold_price = raw_price / GLD_OZ_PER_SHARE
            prices[asset_name] = gold_price
            print(f"✓ {asset_name}: ${gold_price:.2f}/oz (from GLD ${raw_price})")
        else:
            prices[asset_name] = raw_price
            print(f"✓ {asset_name}: ${raw_price}")
        
        time.sleep(0.3)  # Delay between calls to avoid rate limits
    
    return prices


def get_stock_price(ticker):
    """Legacy single-ticker function for backward compatibility."""
    prices = get_prices_batch([ticker])
    return prices.get(ticker)