"use client"

import { Card } from "@/components/ui/card"
import { MarketData } from "@/lib/api"

interface CrowdSentimentSectionProps {
  marketData: MarketData[]
  crowdSignals: {
    fed_policy_bias: string
    recession_probability: number
    rate_cut_bias: string
  }
}

function simplifyFedLabel(question: string) {
  if (question.includes("50")) return "Cut 50bps"
  if (question.includes("25 bps") && question.includes("decrease")) return "Cut 25bps"
  if (question.toLowerCase().includes("no change")) return "No Change"
  if (question.includes("increase")) return "Hike 25bps+"
  return "Other"
}

export function CrowdSentimentSection({
  marketData,
  crowdSignals,
}: CrowdSentimentSectionProps) {

  // 🔹 Group Fed March decision markets together
  const fedMarkets = marketData.filter(
    (m) => m.event_key === "fed_decision_march"
  )

  if (!fedMarkets || fedMarkets.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Crowd Sentiment</h2>
        <Card className="p-6">
          <p className="text-muted-foreground">
            No crowd market data available
          </p>
        </Card>
      </div>
    )
  }

  // 🔹 Build structured probability distribution
  const distribution = fedMarkets.map((m) => {
    const yesProbability = m.outcomes["Yes"] ?? 0
    return {
      label: simplifyFedLabel(m.market_question),
      percentage: Math.round(yesProbability * 100),
    }
  })

  // 🔹 Sort highest probability first
  distribution.sort((a, b) => b.percentage - a.percentage)

  const dominant = distribution[0]

  const totalVolume = fedMarkets.reduce(
    (sum, m) => sum + Number(m.volume),
    0
  )

  const resolutionDate = fedMarkets[0].end_date

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Crowd Sentiment</h2>

      <Card className="p-6 space-y-8">

        {/* Dominant Signal */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Fed March Decision — Market Implied Outcome
          </p>
          <h3 className="text-2xl font-bold text-foreground">
            {dominant.label}
            <span className="text-emerald-400 ml-3">
              {dominant.percentage}%
            </span>
          </h3>
        </div>

        {/* Distribution Bars */}
        <div className="space-y-5">
          {distribution.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span className="font-semibold">
                  {item.percentage}%
                </span>
              </div>

              <div className="w-full bg-muted/40 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-700 ${
                    item.percentage > 60
                      ? "bg-gradient-to-r from-green-500 to-emerald-400"
                      : item.percentage > 40
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Meta Row */}
        <div className="flex flex-wrap gap-10 text-sm text-muted-foreground pt-6 border-t border-border">
          <div>
            <span className="block text-xs">Total Volume</span>
            <span className="font-semibold text-foreground">
              ${totalVolume.toLocaleString()}
            </span>
          </div>

          {resolutionDate && (
            <div>
              <span className="block text-xs">Resolves</span>
              <span className="font-semibold text-foreground">
                {new Date(resolutionDate).toLocaleDateString()}
              </span>
            </div>
          )}

          <div>
            <span className="block text-xs">Fed Policy Bias</span>
            <span className="font-semibold text-foreground">
              {crowdSignals.fed_policy_bias}
            </span>
          </div>

          <div>
            <span className="block text-xs">Recession Odds</span>
            <span className="font-semibold text-foreground">
              {Math.round(crowdSignals.recession_probability * 100)}%
            </span>
          </div>
        </div>

      </Card>
    </div>
  )
}