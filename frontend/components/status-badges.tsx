import { TrendingUp, DollarSign, Activity } from "lucide-react"
import { MarketAnalysis } from "@/lib/api"

interface StatusBadgesProps {
  regime: MarketAnalysis["market_regime"]
}

export function StatusBadges({ regime }: StatusBadgesProps) {
  const badges = [
    {
      label: "Risk Regime",
      value: regime.risk,
      icon: TrendingUp,
      color: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    },
    {
      label: "Liquidity",
      value: regime.liquidity,
      icon: DollarSign,
      color: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    },
    {
      label: "Volatility",
      value: regime.volatility,
      icon: Activity,
      color: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {badges.map((badge) => (
        <div key={badge.label} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${badge.color}`}>
          <badge.icon className="h-5 w-5" />
          <div className="flex-1">
            <div className="text-xs opacity-80">{badge.label}</div>
            <div className="font-semibold">{badge.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
