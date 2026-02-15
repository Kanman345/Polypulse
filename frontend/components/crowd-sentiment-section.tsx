"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { MarketData, MarketAnalysis } from "@/lib/api"

interface CrowdSentimentSectionProps {
  marketData: MarketData[]
  crowdSignals: MarketAnalysis["crowd_signals"]
}

export function CrowdSentimentSection({ marketData, crowdSignals }: CrowdSentimentSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Get unique market questions
  const uniqueMarkets = Array.from(
    new Map(marketData.map((m) => [m.market_question, m])).values()
  ).slice(0, 3) // Show first 3 unique markets

  const selectedMarket = uniqueMarkets[selectedIndex]

  if (!selectedMarket) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Crowd Sentiment (Prediction Markets)</h2>
        <Card className="p-6">
          <p className="text-muted-foreground">No market data available</p>
        </Card>
      </div>
    )
  }

  const probabilityData = Object.entries(selectedMarket.outcomes).map(([outcome, prob]) => ({
    outcome,
    probability: Math.round(prob * 100),
    fill: prob > 0.5 ? "rgb(34 197 94)" : "rgb(239 68 68)",
  }))

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Crowd Sentiment (Prediction Markets)</h2>

      <Card className="p-6">
        <Tabs value={selectedIndex.toString()} onValueChange={(v) => setSelectedIndex(parseInt(v))}>
          <TabsList className="mb-6 flex-wrap">
            {uniqueMarkets.map((market, idx) => (
              <TabsTrigger key={idx} value={idx.toString()} className="text-xs">
                {market.market_question.slice(0, 30)}...
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{selectedMarket.market_question}</h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Probability Split */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Current Probability</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={probabilityData} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} stroke="currentColor" className="text-muted-foreground" />
                      <YAxis
                        type="category"
                        dataKey="outcome"
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                        formatter={(value) => `${value}%`}
                      />
                      <Bar dataKey="probability" fill="rgb(59 130 246)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Market Info */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Market Information</h4>
                  <div className="space-y-3">
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Event</div>
                      <div className="font-semibold text-sm">{selectedMarket.event_title}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Volume</div>
                      <div className="font-semibold text-sm">${selectedMarket.volume.toLocaleString()}</div>
                    </div>
                    {selectedMarket.end_date && (
                      <div className="bg-secondary rounded-lg p-3">
                        <div className="text-xs text-muted-foreground">Resolution Date</div>
                        <div className="font-semibold text-sm">{new Date(selectedMarket.end_date).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Crowd Signals Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Fed Policy</div>
                <div className="font-semibold text-sm mt-1">{crowdSignals.fed_policy_bias}</div>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Recession Odds</div>
                <div className={`font-semibold text-sm mt-1 ${crowdSignals.recession_probability > 0.5 ? "text-chart-1" : "text-chart-3"}`}>
                  {Math.round(crowdSignals.recession_probability * 100)}%
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Rate Cut Bias</div>
                <div className="font-semibold text-sm mt-1">{crowdSignals.rate_cut_bias}</div>
              </div>
            </div>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
