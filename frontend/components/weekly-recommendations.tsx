"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
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
        Weekly stock recommendations — updated every Monday
        {isCached && " • Locked for this week"}
      </p>
    </div>

    {/* Cards */}
    <div className="grid gap-4">
      {topStocks.map((stock, idx) => {
      const isBullish = Number(stock.price_target) > Number(stock.current_price)
      const direction: "long" | "short" = isBullish ? "long" : "short"

        const confidence = Math.round((stock.confidence ?? 0.65) * 100)

        return (
          <Card key={idx} className="p-6 border-border hover:border-accent transition-colors">
            <div className="grid lg:grid-cols-[1fr_auto] gap-6">

              {/* LEFT SIDE */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold">
                        {COMPANY_NAMES[stock.ticker] ?? stock.ticker}
                      </h3>
                      <Badge variant="outline" className="text-xs">{stock.ticker}</Badge>

                      <Badge className={`${
                        direction === "long"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}>
                        {direction === "long" ? "BUY" : "SELL"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mt-2">
                      Sector: {stock.sector}
                    </p>
                  </div>
                </div>

                <p className="text-foreground leading-relaxed">
                  {stock.reasoning}
                </p>
              </div>

              {/* RIGHT SIDE */}
              <div className="lg:border-l border-border lg:pl-6 space-y-4">

                {/* Confidence */}
                <div>
                  <div className="flex justify-between text-xs">
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
                {/* Price target */}
                {stock.price_target && (
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Price Reach</p>
                    <p className="text-lg font-bold text-green-400">
                      ${stock.price_target.toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Projection Graph */}
                {stock.price_target && stock.current_price && (
                  <div className="pt-2">
                    <PriceProjection
                      startPrice={Number(stock.current_price)}
                      targetPrice={Number(stock.price_target)}
                    />
                  </div>
                )}

                {/* Horizon */}
                {stock.target_period && (
                  <div>
                    <p className="text-xs text-muted-foreground">Time Horizon</p>
                    <p className="text-lg font-bold">{stock.target_period}</p>
                  </div>
                )}

              </div>
            </div>
          </Card>
        )
      })}
    </div>
  </div>
)
}
