"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { COMPANY_NAMES } from "@/lib/companyNames"
import { TopStock } from "@/lib/api"
import { PriceProjection } from "@/components/price-projection"

interface WeeklyRecommendationsProps {
  topStocks?: TopStock[]
  isCached?: boolean
}

export function WeeklyRecommendations({ topStocks = [], isCached = false }: WeeklyRecommendationsProps) {
  if (!topStocks || topStocks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No recommendations available at this time.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Weekly banner */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">
          Stock recommendations — updated every 3 weeks
          {isCached && " • Locked for this cycle"}
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4">
        {topStocks.map((stock, idx) => {
          const isBullish = Number(stock.price_target || 0) > Number(stock.current_price || 0)
          const direction: "long" | "short" = isBullish ? "long" : "short"
          const confidence = Math.round((stock.confidence ?? 0.65) * 100)
          const displayName = COMPANY_NAMES[stock.ticker] ?? stock.name ?? stock.ticker
          const sector = stock.sector ?? "Market Analysis"

          return (
            <Card key={idx} className="p-6 border-border hover:border-accent transition-colors">
              <div className="space-y-6">
                {/* LEFT SIDE */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold">{displayName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {stock.ticker}
                        </Badge>

                        <Badge
                          className={`${
                            direction === "long"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {direction === "long" ? "BUY" : "SELL"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2">Sector: {sector}</p>
                    </div>
                  </div>

                  <p className="text-foreground leading-relaxed">{stock.reasoning}</p>
                </div>

                {/* CENTER SIDE - METRICS */}
                <div className="flex justify-center">
                  <div className="w-full max-w-3xl">
                    {/* Row 1: Confidence, Time Horizon, and Expected Move */}
                    <div className="grid grid-cols-3 gap-16 mb-6">
                      {/* Confidence */}
                      <div>
                        <div className="flex justify-between text-xs mb-3">
                          <span>Confidence</span>
                          <span className="font-bold">{confidence}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${
                              confidence >= 75
                                ? "bg-emerald-500"
                                : confidence >= 60
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                      </div>

                      {/* Time Horizon */}
                      {stock.target_period && (
                        <div>
                          <p className="text-xs text-muted-foreground">Time Horizon</p>
                          <p className="text-lg font-bold">{stock.target_period}</p>
                        </div>
                      )}

                      {/* Expected Move */}
                      {stock.expected_outperformance && (
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Move</p>
                          <p className="text-lg font-bold">{stock.expected_outperformance}</p>
                        </div>
                      )}
                    </div>

                    {/* Row 2: Expected Price Reach */}
                    <div className="mb-6">
                      {/* Price target */}
                      {stock.price_target && (
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Price Reach</p>
                          <p className="text-lg font-bold text-green-400">
                            ${Number(stock.price_target).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Row 3: Projection Graph */}
                    {stock.price_target && stock.current_price && (
                      <div>
                        <PriceProjection
                          startPrice={Number(stock.current_price)}
                          targetPrice={Number(stock.price_target)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
