"use client"

import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"

export function PredictionTracker() {
  return (
    <Card className="p-12 border-border">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-3 bg-accent/10 rounded-lg">
          <Clock className="h-8 w-8 text-accent" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Coming Soon</h3>
          <p className="text-muted-foreground max-w-md">
            Historical prediction tracking and performance analysis will be available soon. We're building a robust system to track all recommendations and their outcomes.
          </p>
        </div>
      </div>
    </Card>
  )
}
