"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Loader } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMarketAnalysisContext } from "@/lib/context"
import { SentimentGauge } from "@/components/sentiment-gauge"
import { FearIndex } from "@/components/fear-index"
import { MarketRegimeSection } from "@/components/market-regime-section"
import { CrowdSentimentSection } from "@/components/crowd-sentiment-section"
import { AssetOutlookSection } from "@/components/asset-outlook-section"
import { RiskStressSection } from "@/components/risk-stress-section"
import { getInvestmentDecision } from "@/lib/investmentDecision"


export default function MarketPulseDashboard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const pathname = usePathname()
  const { data, loading, error, fetchData, clearCache } = useMarketAnalysisContext()

  useEffect(() => {
    // Fetch data only if not already cached
    fetchData()
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
    document.documentElement.classList.toggle("dark")
  }

  const handleRetry = () => {
    clearCache()
    fetchData()
  }

  const decision = data ? getInvestmentDecision(data.analysis) : null

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`}>
      <div className="bg-background text-foreground min-h-screen">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                  <span className="text-lg font-bold">PP</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">PolyPulse</h1>
              </Link>
              <nav className="flex items-center gap-4">
                <Link 
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/dashboard" 
                      ? "text-accent border-b-2 border-accent pb-1" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/recommendations"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/recommendations" 
                      ? "text-accent border-b-2 border-accent pb-1" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Recommendations
                </Link>
              </nav>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Loading State */}
          {loading && (
            <Card className="p-12 flex items-center justify-center text-center">
              <div className="flex flex-col items-center gap-4">
                <Loader className="h-8 w-8 animate-spin text-accent" />
                <p className="text-muted-foreground">Fetching latest market analysis...</p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="p-6 border-red-500/50 bg-red-950/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-red-500 mb-2">Error Loading Data</h3>
                  <p className="text-sm text-muted-foreground mb-3">{error}</p>
                  <div className="text-xs bg-black/20 p-3 rounded font-mono space-y-1">
                    <p className="text-yellow-400">Make sure backend is running:</p>
                    <p className="text-gray-300">1. Activate virtual environment</p>
                    <p className="text-gray-300">2. Run: <code className="bg-black/40 px-2 py-1">python3 app.py</code> in backend folder</p>
                    <p className="text-gray-300">3. Check: <code className="bg-black/40 px-2 py-1">curl http://localhost:5000/api/health</code></p>
                  </div>
                </div>
                <Button onClick={() => handleRetry()} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {/* Data Loaded State */}
          {data && !loading && (
            <>
              {/* Top Summary Panel */}
              <Card className="p-6">
                <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
                  <SentimentGauge value={data.analysis.market_sentiment.score} />

                  {decision && (
                    <div className={`rounded-xl border p-6 w-[260px] transition-all
                      ${decision.color === "green"
                        ? "bg-green-500/10 border-green-500/40"
                        : decision.color === "yellow"
                        ? "bg-yellow-500/10 border-yellow-500/40"
                        : "bg-red-500/10 border-red-500/40"
                      }`}>

                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Recommended Action
                      </p>

                      <h2 className={`text-2xl font-bold mt-2
                        ${decision.color === "green"
                          ? "text-green-400"
                          : decision.color === "yellow"
                          ? "text-yellow-400"
                          : "text-red-400"
                        }`}>
                        {decision.action}
                      </h2>

                      <p className="text-sm text-muted-foreground mt-2">
                        {decision.description}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Fear Index & Sector Performance */}
              <FearIndex recessionProbability={data.analysis.crowd_signals.recession_probability} sectorPerformance={data.analysis.sector_performance || []} />

              {/* Market Regime Section */}
              <MarketRegimeSection regime={data.analysis.market_regime} riskIndicators={data.analysis.risk_indicators} />

              {/* Crowd Sentiment Section */}
              <CrowdSentimentSection marketData={data.market_data} crowdSignals={data.analysis.crowd_signals} />

              {/* Asset Outlook Section */}
              <AssetOutlookSection assetOutlook={data.analysis.asset_outlook} />

              {/* Risk & Stress Section */}
              <RiskStressSection riskIndicators={data.analysis.risk_indicators} />
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>PolyPulse • Visual Analytics Dashboard • Mock Data Only</p>
            <p className="mt-1">Not Financial Advice</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
