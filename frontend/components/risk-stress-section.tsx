"use client"

import { Card } from "@/components/ui/card"
import { AlertTriangle, Activity, TrendingDown, TrendingUp } from "lucide-react"
import { MarketAnalysis } from "@/lib/api"

interface RiskStressSectionProps {
  riskIndicators: MarketAnalysis["risk_indicators"]
}

export function RiskStressSection({ riskIndicators }: RiskStressSectionProps) {
  const bubbleRisk = riskIndicators.bubble_risk
  const fragility = riskIndicators.market_fragility
  const upsideRisk = riskIndicators.upside_probability

  const getRiskColor = (value: number) => {
    if (value < 30) return "text-chart-3"
    if (value < 60) return "text-chart-2"
    return "text-chart-1"
  }

  const getRiskLabel = (value: number) => {
    if (value < 30) return "Low"
    if (value < 60) return "Moderate"
    return "High"
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Risk & Stress Indicators</h2>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Bubble Risk Meter */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-chart-5" />
            <h3 className="font-semibold">Bubble Risk Meter</h3>
          </div>

          <div className="flex items-center justify-center py-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-secondary"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={bubbleRisk > 60 ? "rgb(239 68 68)" : bubbleRisk > 30 ? "rgb(234 179 8)" : "rgb(34 197 94)"}
                  strokeWidth="8"
                  strokeDasharray={`${(bubbleRisk / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className={`text-3xl font-bold ${getRiskColor(bubbleRisk)}`}>{bubbleRisk}%</div>
                <div className="text-xs text-muted-foreground">{getRiskLabel(bubbleRisk)}</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Current valuation suggests {getRiskLabel(bubbleRisk).toLowerCase()} bubble risk
          </p>
        </Card>

        {/* Market Fragility Index */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-chart-4" />
            <h3 className="font-semibold">Market Fragility</h3>
          </div>

          <div className="flex items-center justify-center py-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-secondary"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={fragility > 60 ? "rgb(239 68 68)" : fragility > 30 ? "rgb(234 179 8)" : "rgb(34 197 94)"}
                  strokeWidth="8"
                  strokeDasharray={`${(fragility / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className={`text-3xl font-bold ${getRiskColor(fragility)}`}>{fragility}%</div>
                <div className="text-xs text-muted-foreground">{getRiskLabel(fragility)}</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Structural risk level of market
          </p>
        </Card>

        {/* Upside Probability */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-chart-3" />
            <h3 className="font-semibold">Upside Probability</h3>
          </div>

          <div className="flex items-center justify-center py-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-secondary"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={upsideRisk > 60 ? "rgb(34 197 94)" : upsideRisk > 30 ? "rgb(234 179 8)" : "rgb(239 68 68)"}
                  strokeWidth="8"
                  strokeDasharray={`${(upsideRisk / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className={`text-3xl font-bold text-chart-3`}>{upsideRisk}%</div>
                <div className="text-xs text-muted-foreground">Probability</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Likelihood of positive market returns
          </p>
        </Card>
      </div>
    </div>
  )
}
