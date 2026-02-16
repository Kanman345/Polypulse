"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { TopStock } from "@/lib/api"

interface WeeklyRecommendationsProps {
  topStocks?: TopStock[]
}

export function WeeklyRecommendations({ topStocks = [] }: WeeklyRecommendationsProps) {
  if (!topStocks || topStocks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No recommendations available at this time.</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {topStocks.map((stock, idx) => {
        // Determine direction based on expected_outperformance
        const direction: "long" | "short" =
          stock.expected_outperformance === "High" ? "long" : "short"
        // Extract confidence from expected_outperformance
        const confidence = Math.round((stock.confidence ?? 0.65) * 100)
        
        return (
          <Card key={idx} className="p-6 border-border hover:border-accent transition-colors">
            <div className="grid lg:grid-cols-[1fr_auto] gap-6">
              {/* Left Side - Content */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold">{stock.name}</h3>
                      <Badge variant="outline" className="text-xs">{stock.ticker}</Badge>
                      <Badge 
                        className={`${
                          direction === "long" 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {direction === "long" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {direction.toUpperCase()}
                        </span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Sector: {stock.sector}</p>
                  </div>
                </div>

              <p className="text-foreground leading-relaxed">{stock.reasoning}</p>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Expected Performance</p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {stock.expected_outperformance} Outperformance Expected
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right Side - Metrics */}
            <div className="lg:border-l border-border lg:pl-6 space-y-4">
              {/* Confidence Meter */}
              <div className="space-y-2 min-w-[200px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Confidence</span>
                  <span className="text-sm font-bold text-accent">{confidence}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`rounded-full h-2 transition-all ${
                      confidence > 70
                        ? "bg-green-500"
                        : confidence > 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                </div>
              </div>

              {/* Info Section */}
              <div className="space-y-3 pt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ticker</p>
                  <p className="text-lg font-bold">{stock.ticker}</p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-1">Sector</p>
                  <p className="text-lg font-bold text-accent">{stock.sector}</p>
                </div>
                {stock.price_target && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Price Target</p>
                    <p className="text-lg font-bold text-green-400">${stock.price_target.toFixed(2)}</p>
                  </div>
                )}
                {stock.target_period && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Time Horizon</p>
                    <p className="text-lg font-bold">{stock.target_period}</p>
                  </div>
                )}
                <div className={`rounded-lg p-3 ${
                  direction === "long" 
                    ? "bg-green-500/10 border border-green-500/30" 
                    : "bg-red-500/10 border border-red-500/30"
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                  <p className={`text-xl font-bold ${direction === "long" ? "text-green-400" : "text-red-400"}`}>
                    {direction === "long" ? "BUY" : "SELL"}
                  </p>
                </div>
              </div>
            </div>
            </div>
        </Card>
        )
      })}
    </div>
  )
}
