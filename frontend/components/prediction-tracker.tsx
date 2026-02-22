"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface Prediction {
  id: number
  ticker: string
  start_price: number
  last_price: number
  price_target: number
  progress: number
  status: string
  hit: boolean | null
}

export function PredictionTracker() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTracker() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/prediction-tracker`
        )
        const data = await res.json()

        if (data.success) {
          setPredictions(data.predictions)
        }
      } catch (err) {
        console.error("Tracker fetch failed:", err)
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
        const progressWidth = Math.min(Math.abs(p.progress || 0), 100)

        const statusColor =
          p.status === "Hit"
            ? "text-emerald-500"
            : p.status === "Expired"
            ? "text-red-500"
            : "text-yellow-500"

        return (
          <Card key={p.id} className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{p.ticker}</h3>
              <span className={`text-sm font-semibold ${statusColor}`}>
                {p.status}
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              Start: ${p.start_price} | Current: ${p.last_price} | Target: $
              {p.price_target}
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Progress Toward Target</span>
                <span>{(p.progress || 0).toFixed(2)}%</span>
              </div>

              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full ${
                    p.progress >= 0 ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
