"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface Prediction {
  id: number
  ticker: string
  asset_name?: string
  start_price?: number
  current_price?: number
  last_price?: number
  price_target: number
  progress?: number
  status?: string
  hit?: boolean | null
  direction?: "UP" | "DOWN"
  confidence: number
  reasoning: string
  generated_at?: string
  expires_at?: string
  target_period?: string
}

export function PredictionTracker() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTracker() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
        const res = await fetch(
          `${backendUrl.replace(/\/$/, '')}/api/prediction-tracker`
        )
        
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`)
        }
        
        const data = await res.json()

        if (data.success && data.predictions) {
          setPredictions(data.predictions)
        }
      } catch (err) {
        console.error("Tracker fetch failed:", err)
        setError(err instanceof Error ? err.message : "Failed to load predictions")
      } finally {
        setLoading(false)
      }
    }

    fetchTracker()
  }, [])

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Loading prediction tracker...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 border-red-500/50 bg-red-950/10">
        <p className="text-red-500 text-sm">{error}</p>
      </Card>
    )
  }

  if (!predictions.length) {
    return (
      <Card className="p-12 border-border text-center">
        <p className="text-muted-foreground text-lg font-semibold mb-2">
          No Completed Predictions Yet
        </p>
        <p className="text-muted-foreground text-sm">
          Weekly predictions will appear here once a new cycle begins.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {predictions.map((p) => {
        // Determine starting price - handle both field name variants
        const startPrice = p.start_price || p.current_price || 0
        const currentPrice = p.last_price || p.current_price || 0
        const progressValue = p.progress || 0
        const progressWidth = Math.min(Math.abs(progressValue), 100)

        const statusColor =
          p.status === "Hit"
            ? "text-green-500"
            : p.status === "Expired"
            ? "text-red-500"
            : p.status === "Tracking"
            ? "text-yellow-500"
            : "text-gray-500"

        return (
          <Card key={p.id} className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{p.ticker}</h3>
                {p.asset_name && <p className="text-sm text-muted-foreground">{p.asset_name}</p>}
              </div>
              <span className={`text-sm font-semibold ${statusColor}`}>
                {p.status || "Tracking"}
              </span>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <div>Start: ${startPrice.toFixed(2)} | Current: ${currentPrice.toFixed(2)}</div>
              <div>Target: ${p.price_target.toFixed(2)}</div>
              {p.target_period && <div>Horizon: {p.target_period}</div>}
            </div>

            {p.reasoning && <p className="text-sm text-foreground">{p.reasoning}</p>}

            {p.progress !== undefined && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress Toward Target</span>
                  <span>{progressValue.toFixed(2)}%</span>
                </div>

                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full ${
                      progressValue >= 0 ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
            )}

            {p.confidence && (
              <div>
                <div className="flex justify-between text-xs">
                  <span>Confidence</span>
                  <span className="font-semibold">{Math.round(p.confidence * 100)}%</span>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
