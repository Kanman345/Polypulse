"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface Prediction {
  id: number
  ticker: string
  asset_name?: string
  current_price: number
  price_target: number
  confidence: number
  reasoning: string
  created_at?: string
  archived_at?: string
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
          Predictions will appear here after they are archived (typically after 3 weeks).
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {predictions.map((p) => {
        const percentChange = p.current_price && p.price_target 
          ? ((p.price_target - p.current_price) / p.current_price) * 100 
          : 0
        
        const hitTarget = p.current_price && p.price_target 
          ? p.price_target >= p.current_price 
          : false

        const confidence = Math.round((p.confidence ?? 0.65) * 100)

        return (
          <Card key={p.id} className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{p.ticker}</h3>
                {p.asset_name && <p className="text-sm text-muted-foreground">{p.asset_name}</p>}
              </div>
              <span className={`text-sm font-semibold px-3 py-1 rounded ${
                hitTarget
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {hitTarget ? "Target Hit" : "Tracking"}
              </span>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <div>Entry: ${p.current_price.toFixed(2)} | Target: ${p.price_target.toFixed(2)}</div>
              {p.archived_at && (
                <div>Archived: {new Date(p.archived_at).toLocaleDateString()}</div>
              )}
            </div>

            {p.reasoning && <p className="text-sm text-foreground">{p.reasoning}</p>}

            {/* Performance metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Change</span>
                  <span className={percentChange >= 0 ? "text-green-400" : "text-red-400"}>
                    {percentChange >= 0 ? "+" : ""}{percentChange.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      percentChange >= 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(Math.abs(percentChange), 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Confidence</span>
                  <span className="font-semibold">{confidence}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
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
            </div>
          </Card>
        )
      })}
    </div>
  )
}
