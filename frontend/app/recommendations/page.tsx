"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Loader } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMarketAnalysisContext } from "@/lib/context"
import { WeeklyRecommendations } from "@/components/weekly-recommendations"
import { PredictionTracker } from "@/components/prediction-tracker"

export default function RecommendationsPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const pathname = usePathname()
  const { data, loading, error, fetchData } = useMarketAnalysisContext()

  useEffect(() => {
    // Fetch data if not already cached
    fetchData()
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
    document.documentElement.classList.toggle("dark")
  }

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
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Loading State */}
          {loading && (
            <Card className="p-12 flex items-center justify-center text-center">
              <div className="flex flex-col items-center gap-4">
                <Loader className="h-8 w-8 animate-spin text-accent" />
                <p className="text-muted-foreground">Fetching latest recommendations...</p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="p-6 border-red-500/50 bg-red-950/10">
              <h3 className="font-semibold text-red-500 mb-2">Unable to Load Recommendations</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </Card>
          )}

          {/* Weekly Recommendations */}
          {data && !loading && (
            <div>
              <div className="mb-4">
                <h2 className="text-3xl font-bold tracking-tight">Top Stock Recommendations</h2>
                <p className="text-muted-foreground mt-1">AI-powered stock recommendations based on market analysis</p>
              </div>
              <WeeklyRecommendations topStocks={data.analysis.top_stocks} />
            </div>
          )}

          {/* Prediction Tracker */}
          <div>
            <div className="mb-4">
              <h2 className="text-3xl font-bold tracking-tight">Prediction Performance</h2>
              <p className="text-muted-foreground mt-1">Track the accuracy and performance of our past predictions</p>
            </div>
            <PredictionTracker />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>PolyPulse • Recommendations & Analysis • Mock Data Only</p>
            <p className="mt-1">Not Financial Advice</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
