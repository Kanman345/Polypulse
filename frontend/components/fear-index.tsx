"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { SectorPerformance } from "@/lib/api"

interface FearIndexProps {
  recessionProbability: number
  sectorPerformance: SectorPerformance[]
}

const fearIndexData = [
  { month: "Jan", fear: 45, sector: "Tech" },
  { month: "Feb", fear: 42, sector: "Finance" },
  { month: "Mar", fear: 48, sector: "Energy" },
  { month: "Apr", fear: 55, sector: "Healthcare" },
  { month: "May", fear: 62, sector: "Consumer" },
  { month: "Jun", fear: 58, sector: "Industrials" },
]

export function FearIndex({ recessionProbability, sectorPerformance }: FearIndexProps) {
  // Convert recession probability to a fear index value (0-100)
  const fearValue = Math.round(recessionProbability * 100)
  const currentFear = fearValue

  const getFearLabel = (value: number) => {
    if (value < 25) return "Low Fear (Complacent)"
    if (value < 50) return "Moderate Fear"
    if (value < 75) return "High Fear"
    return "Extreme Fear"
  }

  const getFearColor = (value: number) => {
    if (value < 25) return "text-chart-3"
    if (value < 50) return "text-chart-2"
    if (value < 75) return "text-chart-1"
    return "text-red-600"
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Fear Index Chart */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Recession Probability</h3>
            <p className="text-sm text-muted-foreground mt-1">Market-implied recession probability based on prediction markets</p>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={fearIndexData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
              <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <ReferenceLine y={50} stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="fear"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: "#ef4444", r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${getFearColor(currentFear)}`}>{currentFear}%</div>
                <div className="text-xs text-muted-foreground mt-1">{getFearLabel(currentFear)}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Recession odds</div>
                <div className="text-chart-3 font-semibold">{Math.round(recessionProbability * 100)}%</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sector Performance */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Sector Performance</h3>
            <p className="text-sm text-muted-foreground mt-1">YTD returns by sector</p>
          </div>

          <div className="space-y-3">
            {sectorPerformance.map((sector) => (
              <div key={sector.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{sector.name}</span>
                  <span className={`text-sm font-semibold ${sector.performance >= 0 ? "text-chart-3" : "text-chart-1"}`}>
                    {sector.performance >= 0 ? "+" : ""}{sector.performance}%
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${sector.performance >= 0 ? "bg-chart-3" : "bg-chart-1"}`}
                    style={{
                      width: `${Math.min(Math.abs(sector.performance) / 15 * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">{sector.change}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
