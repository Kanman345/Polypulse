def validate_price_target(current_price: float, predicted_price: float, horizon="3m", macro_regime=None):
    """
    Ensures AI price targets remain realistic.
    
    Regime-aware constraints for 3 months:
    - Risk-Off: Allow -30% downside (downturns are real)
    - Risk-On: Constrain to -5% downside (optimistic)
    - Neutral: Balance -10% downside
    """

    if current_price is None:
        return None

    if predicted_price is None or predicted_price <= 0:
        return round(current_price, 2)

    predicted_price = float(predicted_price)
    
    # Regime-aware constraints
    if macro_regime == "Risk-Off":
        max_up = current_price * 1.25
        max_down = current_price * 0.70  # Allow -30% in downturns
    elif macro_regime == "Risk-On":
        max_up = current_price * 1.40
        max_down = current_price * 0.95  # Conservative -5% downside
    else:  # Neutral/default
        max_up = current_price * 1.30
        max_down = current_price * 0.90  # -10% downside

    adjusted = max(min(predicted_price, max_up), max_down)

    return round(adjusted, 2)