def validate_price_target(ticker: str, current_price: float, predicted_price: float, horizon="3m"):
    """
    Ensures AI price targets remain realistic.

    Rules for 3 months:
    +40% max upside
    -25% max downside
    """

    if not predicted_price or predicted_price <= 0:
        return round(current_price, 2)

    predicted_price = float(predicted_price)

    # 3-month volatility bounds
    max_up = current_price * 1.40
    max_down = current_price * 0.75

    adjusted = max(min(predicted_price, max_up), max_down)

    return round(adjusted, 2)