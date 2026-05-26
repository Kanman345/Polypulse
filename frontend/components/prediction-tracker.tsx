"use client"

import { useEffect, useState, Fragment } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Activity, 
  Percent, 
  Calendar, 
  Award,
  Sparkles
} from "lucide-react"

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
  
  // Custom computed fields
  specificAccuracy?: number | null
  hitTarget?: boolean
  liveChange?: number | null
  progressToTarget?: number
}

interface GroupedCommodity {
  ticker: string
  asset_name: string
  predictions: Prediction[]
  overallAccuracy: number
  activeCount: number
  totalCount: number
  hitCount: number
}

export function PredictionTracker() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedTickers, setExpandedTickers] = useState<Record<string, boolean>>({})

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

  const toggleExpand = (ticker: string) => {
    setExpandedTickers(prev => ({
      ...prev,
      [ticker]: !prev[ticker]
    }))
  }

  if (loading) {
    return (
      <Card className="p-8 text-center bg-card/50 backdrop-blur-md border-border/50 shadow-lg">
        <div className="flex flex-col items-center gap-3 py-6">
          <Activity className="h-8 w-8 animate-pulse text-blue-500" />
          <p className="text-muted-foreground text-sm font-medium">Loading prediction performance analytics...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 border-red-500/20 bg-red-950/10 shadow-lg">
        <p className="text-red-400 text-sm font-medium flex items-center gap-2 justify-center">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Error: {error}
        </p>
      </Card>
    )
  }

  if (!predictions.length) {
    return (
      <Card className="p-12 border-border text-center bg-card/50 shadow-md">
        <p className="text-muted-foreground text-lg font-semibold mb-2">
          No predictions to track right now
        </p>
        <p className="text-muted-foreground text-sm">
          Will update in 3 weeks.
        </p>
      </Card>
    )
  }

  // --- Compute metrics and group predictions ---
  const processedPredictions: Prediction[] = predictions.map(p => {
    const entry = p.entry_price
    const live = p.live_price ?? null
    const target = p.price_target

    const hasLivePrice = live !== null

    let progressToTarget = 0
    let specificAccuracy: number | null = null
    let hitTarget = false

    if (hasLivePrice) {
      progressToTarget = entry && target && entry !== target
        ? ((live! - entry) / (target - entry)) * 100
        : 0

      hitTarget = target >= entry ? live! >= target : live! <= target
      
      // Proximity-to-Target Accuracy Formula:
      // measures absolute proximity to target. If target hit, accuracy is 100%.
      // Otherwise, accuracy = max(0, 100 - (abs(live - target) / target) * 100)
      if (hitTarget) {
        specificAccuracy = 100
      } else {
        const errorPercent = (Math.abs(live! - target) / target) * 100
        specificAccuracy = Math.max(0, 100 - errorPercent)
      }
    }

    const liveChange = live && entry
      ? ((live - entry) / entry) * 100
      : null

    return {
      ...p,
      specificAccuracy,
      hitTarget,
      liveChange,
      progressToTarget
    }
  })

  // Group by Ticker
  const groupsMap: Record<string, Prediction[]> = {}
  processedPredictions.forEach(p => {
    if (!groupsMap[p.ticker]) {
      groupsMap[p.ticker] = []
    }
    groupsMap[p.ticker].push(p)
  })

  const groupedCommodities: GroupedCommodity[] = Object.keys(groupsMap).map(ticker => {
    const groupPredictions = groupsMap[ticker]
    const totalCount = groupPredictions.length
    const activeCount = groupPredictions.filter(p => p.is_active).length
    const hitCount = groupPredictions.filter(p => p.hitTarget).length
    
    // Get asset name and capitalize title-case beautifully
    const firstWithName = groupPredictions.find(p => p.asset_name)
    let asset_name = firstWithName?.asset_name || ticker
    if (asset_name) {
      asset_name = asset_name
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    }

    // Sort predictions inside group by created_at desc
    groupPredictions.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateB - dateA
    })

    // Average specific accuracy of predictions with valid accuracy scores
    const validAccuracyPredictions = groupPredictions.filter(
      p => p.specificAccuracy !== null && p.specificAccuracy !== undefined
    )
    const overallAccuracy = validAccuracyPredictions.length > 0
      ? validAccuracyPredictions.reduce((sum, p) => sum + (p.specificAccuracy ?? 0), 0) / validAccuracyPredictions.length
      : 0

    return {
      ticker,
      asset_name,
      predictions: groupPredictions,
      overallAccuracy,
      activeCount,
      totalCount,
      hitCount
    }
  })

  // Global Statistics for Banner
  const totalAssetsTracked = groupedCommodities.length
  const totalPredictionsCount = processedPredictions.length

  // System average accuracy across all predictions with valid data
  const validSystemPredictions = processedPredictions.filter(
    p => p.specificAccuracy !== null && p.specificAccuracy !== undefined
  )
  const avgSystemAccuracy = validSystemPredictions.length > 0
    ? validSystemPredictions.reduce((sum, p) => sum + (p.specificAccuracy ?? 0), 0) / validSystemPredictions.length
    : 0

  const totalHits = processedPredictions.filter(p => p.hitTarget).length
  const targetHitRate = totalPredictionsCount > 0 ? (totalHits / totalPredictionsCount) * 100 : 0

  // Filter Grouped Commodities based on search query
  const filteredCommodities = groupedCommodities.filter(c => {
    const term = searchQuery.toLowerCase()
    return c.ticker.toLowerCase().includes(term) || c.asset_name.toLowerCase().includes(term)
  })

  // Color logic helpers
  function getAccuracyColor(accuracy: number) {
    if (accuracy >= 75) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    if (accuracy >= 50) return "text-amber-400 bg-amber-500/10 border-amber-500/20"
    return "text-rose-400 bg-rose-500/10 border-rose-500/20"
  }

  function getAccuracyBarColor(accuracy: number) {
    if (accuracy >= 75) return "bg-emerald-500"
    if (accuracy >= 50) return "bg-amber-500"
    return "bg-rose-500"
  }

  return (
    <div className="space-y-6">
      {/* 📊 Institutional Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/40 backdrop-blur-md border-border/40 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tracked Assets</span>
            <Target className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black">{totalAssetsTracked}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Unique commodities & assets</p>
          </div>
        </Card>

        <Card className="p-4 bg-card/40 backdrop-blur-md border-border/40 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Predictions</span>
            <Calendar className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black">{totalPredictionsCount}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Predictions made to date</p>
          </div>
        </Card>

        <Card className="p-4 bg-card/40 backdrop-blur-md border-border/40 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">System Accuracy</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-400">{avgSystemAccuracy.toFixed(1)}%</span>
            <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${avgSystemAccuracy}%` }} 
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/40 backdrop-blur-md border-border/40 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Hit Rate</span>
            <Percent className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-400">{targetHitRate.toFixed(1)}%</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">{totalHits} out of {totalPredictionsCount} targets met</p>
          </div>
        </Card>
      </div>

      {/* 🔍 Search Controller */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter commodities by ticker or name (e.g. BTC, Gold, Nvidia)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card/40 border border-border/50 rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-border/80 hover:border-border/70 transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* 📦 List of Grouped Commodities */}
      <div className="space-y-4">
        {filteredCommodities.length === 0 ? (
          <Card className="p-12 text-center border-border/40 bg-card/20">
            <p className="text-muted-foreground text-sm font-semibold">No assets matches "{searchQuery}"</p>
          </Card>
        ) : (
          filteredCommodities.map((commodity) => {
            const isExpanded = !!expandedTickers[commodity.ticker]
            const totalCount = commodity.totalCount
            const activeCount = commodity.activeCount
            const overallAccuracy = commodity.overallAccuracy

            const hasValidOverallAccuracy = commodity.predictions.some(
              p => p.specificAccuracy !== null && p.specificAccuracy !== undefined
            )

            return (
              <Card 
                key={commodity.ticker} 
                className={`p-5 transition-all duration-300 border-border/40 bg-card/30 hover:bg-card/50 ${
                  isExpanded ? "shadow-lg border-border/70 ring-1 ring-border/20" : "shadow-sm"
                }`}
              >
                {/* 🏷️ Header / Summary Row */}
                <div 
                  onClick={() => toggleExpand(commodity.ticker)}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-accent text-accent-foreground font-black text-sm tracking-wide shadow-inner border border-border/40">
                      {commodity.ticker}
                    </div>
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2">
                        {commodity.asset_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-medium">
                        <span>{totalCount} prediction{totalCount > 1 ? "s" : ""} total</span>
                        <span>•</span>
                        {activeCount > 0 ? (
                          <span className="text-blue-400 flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            {activeCount} active
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0 active</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accuracy Metric Visualizer */}
                  <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-border/30">
                    <div className="space-y-1.5 w-full md:w-44">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" />
                          Overall Accuracy
                        </span>
                        {hasValidOverallAccuracy ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getAccuracyColor(overallAccuracy)}`}>
                            {overallAccuracy.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-muted-foreground bg-muted/40 border border-border/40">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            hasValidOverallAccuracy ? getAccuracyBarColor(overallAccuracy) : "bg-muted-foreground/20"
                          }`}
                          style={{ width: `${hasValidOverallAccuracy ? overallAccuracy : 0}%` }}
                        />
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full shrink-0 h-8 w-8 hover:bg-muted/60"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(commodity.ticker)
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* 📋 Expandable Recommendations History Nested Table */}
                {isExpanded && (
                  <div className="mt-5 pt-4 border-t border-border/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="overflow-x-auto rounded-lg border border-border/40 bg-muted/20 shadow-inner">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-border/50 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <th className="px-4 py-3 text-center w-12">#</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Entry Price</th>
                            <th className="px-4 py-3 text-right">Current Price</th>
                            <th className="px-4 py-3 text-right">Target Price</th>
                            <th className="px-4 py-3 text-center">AI Confidence</th>
                            <th className="px-4 py-3 text-center w-36">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30 text-sm">
                          {commodity.predictions.map((p, idx) => {
                            const entry = p.entry_price
                            const live = p.live_price ?? null
                            const target = p.price_target
                            const confidence = Math.round((p.confidence ?? 0.65) * 100)
                            const specificAccuracy = p.specificAccuracy
                            const liveChange = p.liveChange

                            const TrendIcon = liveChange == null
                              ? Minus
                              : liveChange > 0 ? TrendingUp : liveChange < 0 ? TrendingDown : Minus

                            return (
                              <Fragment key={p.id}>
                                {/* Table row for statistics */}
                                <tr className="hover:bg-muted/10 transition-colors">
                                  {/* Counter */}
                                  <td className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                                    {commodity.predictions.length - idx}
                                  </td>
                                  
                                  {/* Date */}
                                  <td className="px-4 py-3 text-xs font-medium whitespace-nowrap text-foreground">
                                    {p.created_at ? (
                                      new Date(p.created_at).toLocaleDateString(undefined, { 
                                        day: "numeric", 
                                        month: "short", 
                                        year: "numeric" 
                                      })
                                    ) : (
                                      "—"
                                    )}
                                  </td>

                                  {/* Status badge */}
                                  <td className="px-4 py-3">
                                    {p.is_active ? (
                                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1 w-fit">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                        Active
                                      </Badge>
                                    ) : p.hitTarget ? (
                                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        Target Hit
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 flex items-center gap-1 w-fit">
                                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                                        Archived
                                      </Badge>
                                    )}
                                  </td>

                                  {/* Entry Price */}
                                  <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                                    ${entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>

                                  {/* Current Price */}
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    {live != null ? (
                                      <div className="inline-flex flex-col items-end">
                                        <span className={`font-semibold ${
                                          liveChange! > 0 ? "text-emerald-400" : liveChange! < 0 ? "text-rose-400" : "text-foreground"
                                        }`}>
                                          ${live.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-0.5 ${
                                          liveChange! > 0 ? "text-emerald-400" : liveChange! < 0 ? "text-rose-400" : "text-muted-foreground"
                                        }`}>
                                          <TrendIcon className="h-2.5 w-2.5" />
                                          {liveChange! >= 0 ? "+" : ""}{liveChange!.toFixed(2)}%
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground italic text-xs">Unavailable</span>
                                    )}
                                  </td>

                                  {/* Price Target */}
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <div className="inline-flex flex-col items-end">
                                      <span className="font-semibold text-foreground">
                                        ${target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className={`text-[10px] font-semibold mt-0.5 ${
                                        target > entry ? "text-emerald-400" : "text-rose-400"
                                      }`}>
                                        {target > entry ? "▲" : "▼"} {Math.abs(((target - entry) / entry) * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  </td>

                                  {/* AI Confidence */}
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${
                                      confidence >= 75 
                                        ? "text-emerald-400" 
                                        : confidence >= 60 
                                        ? "text-amber-400" 
                                        : "text-rose-400"
                                    }`}>
                                      {confidence}%
                                    </span>
                                  </td>

                                  {/* Specific Accuracy */}
                                  <td className="px-4 py-3">
                                    {specificAccuracy !== null && specificAccuracy !== undefined ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 bg-muted rounded-full h-1 overflow-hidden shrink-0">
                                          <div 
                                            className={`h-full rounded-full ${getAccuracyBarColor(specificAccuracy)}`} 
                                            style={{ width: `${specificAccuracy}%` }} 
                                          />
                                        </div>
                                        <span className={`text-xs font-bold text-right shrink-0 w-10 ${
                                          specificAccuracy >= 75 
                                            ? "text-emerald-400" 
                                            : specificAccuracy >= 50 
                                            ? "text-amber-400" 
                                            : "text-rose-400"
                                        }`}>
                                          {specificAccuracy.toFixed(0)}%
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="text-center text-xs text-muted-foreground/60 font-semibold">—</div>
                                    )}
                                  </td>
                                </tr>

                                {/* Sub-row for Thesis/Reasoning to keep the main table clean */}
                                {p.reasoning && (
                                  <tr className="bg-muted/5 border-b border-border/30">
                                    <td colSpan={8} className="px-5 py-2 text-xs text-muted-foreground/80 leading-relaxed italic">
                                      <span className="font-semibold not-italic text-foreground/70 mr-1.5 uppercase tracking-wide text-[10px]">AI Analysis Thesis:</span>
                                      "{p.reasoning}"
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer archived timestamp indicator if any archived predictions exist */}
                    {commodity.predictions.some(p => p.archived_at) && (
                      <p className="text-[10px] text-muted-foreground/60 italic pl-1">
                        * Archived targets represent predictions finalized when market conditions changed or new cycle updates rolled in.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
