"use client"

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface Props {
  startPrice: number
  targetPrice: number
}

export function PriceProjection({ startPrice, targetPrice }: Props) {
  const data = [
    { month: "Now", price: startPrice },
    { month: "3M", price: targetPrice },
  ]

  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data}>
        <XAxis dataKey="month" hide />
        <YAxis hide domain={["auto", "auto"]} />
        <Line
          type="monotone"
          dataKey="price"
          stroke={targetPrice > startPrice ? "#22c55e" : "#ef4444"}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}