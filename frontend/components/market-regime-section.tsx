"use client"

import { Card } from "@/components/ui/card"
import { MarketAnalysis } from "@/lib/api"

interface MarketRegimeSectionProps {
  regime: MarketAnalysis["market_regime"]
  riskIndicators: MarketAnalysis["risk_indicators"]
}

export function MarketRegimeSection({ regime, riskIndicators }: MarketRegimeSectionProps) {
  const getRegimeColor = (label: string) => {
    if (label.includes("Risk-On")) return "rgb(34 197 94)"
    if (label.includes("Risk-Off")) return "rgb(239 68 68)"
    return "rgb(234 179 8)"
  }

  const heatmapData = [
    { metric: "Bubble Risk", value: riskIndicators.bubble_risk, color: "rgb(239 68 68)" },
    { metric: "Market Fragility", value: riskIndicators.market_fragility, color: "rgb(249 115 22)" },
    { metric: "Upside Probability", value: riskIndicators.upside_probability, color: "rgb(34 197 94)" },
  ]

  const volatilityData = [
    { date: "Week 1", value: 18 },
    { date: "Week 2", value: 22 },
    { date: "Week 3", value: 19 },
    { date: "Week 4", value: 25 },
    { date: "Week 5", value: 21 },
    { date: "Week 6", value: 23 },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Market Regime Analysis</h2>

      <div className="space-y-4">
        {/* Regime Status */}
        <Card className="p-6 bg-gradient-to-r from-secondary to-secondary/50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Risk Regime</p>
              <p className="text-2xl font-bold" style={{ color: getRegimeColor(regime.risk) }}>
                {regime.risk}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Liquidity</p>
              <p className="text-lg font-semibold">{regime.liquidity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Volatility</p>
              <p className="text-lg font-semibold">{regime.volatility}</p>
            </div>
          </div>
        </Card>

        {/* Risk Indicators Heatmap */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Risk Indicators</h3>
          <div className="space-y-3">
            {heatmapData.map((item) => (
              <div key={item.metric}>
                <div className="flex justify-between mb-1 text-sm">
                  <span>{item.metric}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
                <div className="h-8 bg-secondary rounded-md overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
