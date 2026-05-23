"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface Prediction {
  id: number
  ticker: string
  asset_name?: string
  entry_price: number
  live_price?: number | null
  price_target: number
  confidence: number
  reasoning: string
  is_active?: boolean
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
          No predictions to track right now
        </p>
        <p className="text-muted-foreground text-sm">
          Will update in 3 weeks.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {predictions.map((p) => {
        const entry    = p.entry_price
        const live     = p.live_price ?? null
        const target   = p.price_target
        const confidence = Math.round((p.confidence ?? 0.65) * 100)

        // Progress toward target based on live price (falls back to entry if unavailable)
        const comparePrice = live ?? entry
        const progressToTarget = entry && target && entry !== target
          ? Math.min(Math.max(((comparePrice - entry) / (target - entry)) * 100, -100), 100)
          : 0

        // How much live price has moved from entry
        const liveChange = live && entry
          ? ((live - entry) / entry) * 100
          : null

        // Badge logic
        const hitTarget = live != null
          ? (target >= entry ? live >= target : live <= target)
          : false

        const TrendIcon = liveChange == null
          ? Minus
          : liveChange > 0 ? TrendingUp : liveChange < 0 ? TrendingDown : Minus

        return (
          <Card key={p.id} className="p-6 space-y-4">
            {/* Header row */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{p.ticker}</h3>
                {p.asset_name && (
                  <p className="text-sm text-muted-foreground capitalize">{p.asset_name}</p>
                )}
                {p.created_at && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Predicted {new Date(p.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
              <span className={`text-sm font-semibold px-3 py-1 rounded ${
                p.is_active
                  ? "bg-blue-500/20 text-blue-400"
                  : hitTarget
                  ? "bg-green-500/20 text-green-400"
                  : "bg-zinc-500/20 text-zinc-400"
              }`}>
                {p.is_active ? "Active" : hitTarget ? "Target Hit" : "Archived"}
              </span>
            </div>

            {/* Three price pills */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {/* Entry */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Entry</p>
                <p className="text-base font-bold">${entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">at prediction</p>
              </div>

              {/* Live / Current */}
              <div className={`rounded-lg p-3 space-y-1 border ${
                liveChange == null
                  ? "bg-muted/30 border-border"
                  : liveChange > 0
                  ? "bg-green-500/10 border-green-500/30"
                  : liveChange < 0
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-muted/30 border-border"
              }`}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Current</p>
                {live != null ? (
                  <>
                    <p className={`text-base font-bold ${
                      liveChange! > 0 ? "text-green-400" : liveChange! < 0 ? "text-red-400" : ""
                    }`}>
                      ${live.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs font-medium flex items-center justify-center gap-1 ${
                      liveChange! > 0 ? "text-green-400" : liveChange! < 0 ? "text-red-400" : "text-muted-foreground"
                    }`}>
                      <TrendIcon className="h-3 w-3" />
                      {liveChange! >= 0 ? "+" : ""}{liveChange!.toFixed(2)}%
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-muted-foreground">—</p>
                    <p className="text-xs text-muted-foreground">unavailable</p>
                  </>
                )}
              </div>

              {/* Target */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Target</p>
                <p className="text-base font-bold text-foreground">
                  ${target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-xs font-medium ${
                  target > entry ? "text-green-400" : "text-red-400"
                }`}>
                  {target > entry ? "▲" : "▼"} {Math.abs(((target - entry) / entry) * 100).toFixed(1)}% from entry
                </p>
              </div>
            </div>

            {/* Reasoning */}
            {p.reasoning && (
              <p className="text-sm text-muted-foreground text-center italic">"{p.reasoning}"</p>
            )}

            {/* Progress bars */}
            <div className="grid grid-cols-2 gap-4">
              {/* Progress toward target */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress to target</span>
                  <span className={progressToTarget >= 100 ? "text-green-400 font-semibold" : "font-semibold"}>
                    {progressToTarget.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progressToTarget >= 100
                        ? "bg-green-500"
                        : progressToTarget >= 0
                        ? "bg-blue-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(Math.abs(progressToTarget), 100)}%` }}
                  />
                </div>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">AI Confidence</span>
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

            {/* Footer meta — only show archived date if present */}
            {p.archived_at && (
              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                <span>Archived: {new Date(p.archived_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
