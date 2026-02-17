export function getInvestmentDecision(analysis: any) {
  const sentiment = analysis.market_sentiment?.label
  const risk = analysis.market_regime?.risk
  const liquidity = analysis.market_regime?.liquidity
  const recession = analysis.crowd_signals?.recession_probability ?? 0

  if (recession > 0.65)
    return {
      action: "Reduce Risk",
      color: "red",
      description: "High recession probability — prioritize capital protection."
    }

  if (sentiment === "Bullish" && risk === "Risk-On" && liquidity === "Easing")
    return {
      action: "Invest Aggressively",
      color: "green",
      description: "Strong macro conditions — favorable for equities."
    }

  if (sentiment === "Bullish")
    return {
      action: "Invest",
      color: "green",
      description: "Positive outlook — gradual allocation recommended."
    }

  if (sentiment === "Neutral")
    return {
      action: "Hold / SIP Only",
      color: "yellow",
      description: "Uncertain environment — avoid lump sum entries."
    }

  return {
    action: "Avoid New Positions",
    color: "red",
    description: "Macro unfavorable — wait for better conditions."
  }
}