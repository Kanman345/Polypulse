"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
} from "recharts"

interface Props {
  startPrice: number
  targetPrice: number
}

export function PriceProjection({ startPrice, targetPrice }: Props) {
  const percentChange =
    ((targetPrice - startPrice) / startPrice) * 100

  const isUp = percentChange >= 0

  const padding = Math.abs(targetPrice - startPrice) * 0.6

  const minY = Math.min(startPrice, targetPrice) - padding
  const maxY = Math.max(startPrice, targetPrice) + padding

  const data = [
    { month: "Now", price: startPrice },
    { month: "3M", price: targetPrice },
  ]

  return (
    <div className="relative w-full h-[100px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" hide />
          <YAxis hide domain={[minY, maxY]} />

          {/* Area Fill */}
          <Area
            type="monotone"
            dataKey="price"
            stroke="none"
            fill={isUp ? "#22c55e33" : "#ef444433"}
          />

          {/* Projection Line */}
          <Line
            type="monotone"
            dataKey="price"
            stroke={isUp ? "#22c55e" : "#ef4444"}
            strokeWidth={3}
            dot={{
              r: 4,
              strokeWidth: 2,
              fill: isUp ? "#22c55e" : "#ef4444",
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Percentage label */}
      <div
        className={`absolute top-0 right-0 text-xs font-semibold ${
          isUp ? "text-green-400" : "text-red-400"
        }`}
      >
        {isUp ? "+" : ""}
        {percentChange.toFixed(1)}%
      </div>
    </div>
  )
}