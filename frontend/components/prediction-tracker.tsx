"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"

export function PredictionTracker() {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem("polymarket_predictions")
    if (stored) {
      setPredictions(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  if (loading) return <div>Loading...</div>

  if (predictions.length === 0) {
    return (
      <Card className="p-12 border-border text-center">
        <p className="text-muted-foreground">No predictions tracked yet</p>
      </Card>
    )
  }

  const hitCount = predictions.filter(p => p.hit).length
  const accuracy = predictions.length > 0 ? (hitCount / predictions.length * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-accent/10 to-accent/5">
        <h3 className="text-xl font-bold mb-4">Overall Accuracy</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-accent">{accuracy}%</div>
          <div className="text-sm text-muted-foreground">{hitCount} hits out of {predictions.length} predictions</div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Prediction History</h3>
        <div className="space-y-3">
          {predictions.map((pred) => (
            <div key={pred.id} className="p-4 border rounded-lg hover:bg-accent/5 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-lg">{pred.ticker}</p>
                  <p className="text-sm text-muted-foreground">{new Date(pred.savedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  {pred.hit !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${pred.hit ? "text-green-600" : "text-red-600"}`}>
                      {pred.hit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {pred.hit ? "Hit" : "Missed"}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Target</p>
                  <p className="font-semibold">${pred.priceTarget}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actual</p>
                  <p className="font-semibold">{pred.actualPrice ? `$${pred.actualPrice}` : "Pending"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Period</p>
                  <p className="font-semibold">{pred.targetPeriod}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
