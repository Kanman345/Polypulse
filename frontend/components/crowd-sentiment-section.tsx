"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarketData } from "@/lib/api"

interface CrowdSentimentSectionProps {
  marketData: MarketData[]
  crowdSignals: {
    fed_policy_bias: string
    recession_probability: number
    rate_cut_bias: string
  }
}

export function CrowdSentimentSection({
    marketData,
    crowdSignals
  }: CrowdSentimentSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const uniqueMarkets = Array.from(
    new Map(marketData.map((m) => [m.market_question, m])).values()
  ).slice(0, 3)

  const selectedMarket = uniqueMarkets[selectedIndex]

  if (!selectedMarket) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Crowd Sentiment</h2>
        <Card className="p-6">
          <p className="text-muted-foreground">No market data available</p>
        </Card>
      </div>
    )
  }

  const outcomes = Object.entries(selectedMarket.outcomes).map(([label, prob]) => ({
    label,
    percentage: Math.round(prob * 100),
  }))

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Crowd Sentiment</h2>

      <Card className="p-6 space-y-6">
        {/* Tabs */}
        <Tabs
          value={selectedIndex.toString()}
          onValueChange={(v) => setSelectedIndex(parseInt(v))}
        >
          <TabsList className="mb-4">
            {uniqueMarkets.map((market, idx) => (
              <TabsTrigger key={idx} value={idx.toString()} className="text-xs">
                {market.market_question.slice(0, 28)}…
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Question */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {selectedMarket.market_question}
          </h3>

          {/* Probability Bars */}
          <div className="space-y-4">
            {outcomes.map((o, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{o.label}</span>
                  <span className="font-semibold">{o.percentage}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      o.percentage > 50 ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{ width: `${o.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Meta (Compressed) */}
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-4 border-t border-border">
          <div>
            <span className="block text-xs">Volume</span>
            <span className="font-semibold text-foreground">
              ${Number(selectedMarket.volume).toLocaleString()}
            </span>
          </div>

          {selectedMarket.end_date && (
            <div>
              <span className="block text-xs">Resolves</span>
              <span className="font-semibold text-foreground">
                {new Date(selectedMarket.end_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}