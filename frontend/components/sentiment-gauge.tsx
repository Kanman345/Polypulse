"use client"

interface SentimentGaugeProps {
  value: number // 0-100, where 0 is bearish, 50 is neutral, 100 is bullish
}

export function SentimentGauge({ value }: SentimentGaugeProps) {
  const rotation = (value / 100) * 180 - 90 // -90 to 90 degrees

  const getSentimentLabel = (val: number) => {
    if (val < 35) return "Bearish"
    if (val < 65) return "Neutral"
    return "Bullish"
  }

  const getSentimentColor = (val: number) => {
    if (val < 35) return "text-chart-1"
    if (val < 65) return "text-chart-2"
    return "text-chart-3"
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-lg font-semibold text-muted-foreground">Market Sentiment</h2>

      <div className="relative w-64 h-32">
        {/* Gauge Background Arc */}
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(239 68 68)" />
              <stop offset="50%" stopColor="rgb(234 179 8)" />
              <stop offset="100%" stopColor="rgb(34 197 94)" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-border"
          />

          {/* Colored arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Needle */}
          <g transform={`rotate(${rotation} 100 90)`}>
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="30"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-foreground"
            />
            <circle cx="100" cy="90" r="6" fill="currentColor" className="text-foreground" />
          </g>
        </svg>

        {/* Labels */}
        <div className="absolute left-0 bottom-0 text-xs text-muted-foreground">Bearish</div>
        <div className="absolute right-0 bottom-0 text-xs text-muted-foreground">Bullish</div>
      </div>

      <div className="text-center">
        <div className={`text-3xl font-bold ${getSentimentColor(value)}`}>{getSentimentLabel(value)}</div>
        <div className="text-sm text-muted-foreground mt-1">Current Score: {value}/100</div>
      </div>
    </div>
  )
}
