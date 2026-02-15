"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Moon, Sun, ArrowRight, BarChart3, Brain, Zap } from "lucide-react"
import Link from "next/link"
import { useMarketAnalysisContext } from "@/lib/context"

export default function LandingPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const { clearCache } = useMarketAnalysisContext()

  useEffect(() => {
    // Clear cache when landing page is mounted (fresh session)
    clearCache()
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`}>
      <div className="bg-background text-foreground min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                <span className="text-lg font-bold">PP</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">PolyPulse</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center">
          <div className="container mx-auto px-4 py-20 space-y-16">
            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="space-y-2">
                <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
                  Prediction Market Intelligence
                </h2>
                <p className="text-xl text-muted-foreground">
                  Real-time market analysis powered by AI, using Polymarket data
                </p>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                PolyPulse analyzes prediction market sentiment, identifies emerging trends, and generates actionable recommendations based on crowd intelligence.
              </p>
              <div className="pt-4">
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2">
                    Start Market Analysis
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-center">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Data Collection */}
                <Card className="p-6 border-border hover:border-accent transition-colors">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-accent" />
                    </div>
                    <h4 className="text-xl font-semibold">1. Data Collection</h4>
                    <p className="text-muted-foreground">
                      We connect to Polymarket's API and fetch real-time prediction market data, including odds, volumes, and trading activity across multiple prediction categories.
                    </p>
                  </div>
                </Card>

                {/* AI Analysis */}
                <Card className="p-6 border-border hover:border-accent transition-colors">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Brain className="h-6 w-6 text-accent" />
                    </div>
                    <h4 className="text-xl font-semibold">2. AI Analysis</h4>
                    <p className="text-muted-foreground">
                      Our backend uses Groq's LLM (llama-3.3-70b) to perform deep analysis of market sentiment, identify patterns, assess risk indicators, and evaluate asset outlook based on crowd signals.
                    </p>
                  </div>
                </Card>

                {/* Recommendations */}
                <Card className="p-6 border-border hover:border-accent transition-colors">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Zap className="h-6 w-6 text-accent" />
                    </div>
                    <h4 className="text-xl font-semibold">3. Recommendations</h4>
                    <p className="text-muted-foreground">
                      The LLM generates AI-powered stock recommendations with detailed reasoning, expected outperformance levels, and sector analysis based on the market signals it detects.
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Technical Stack Section */}
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-center">Technology Stack</h3>
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card className="p-6 border-border">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full"></span>
                    Backend
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Python Flask API Server</li>
                    <li>• Polymarket REST API Integration</li>
                    <li>• Groq LLM (llama-3.3-70b)</li>
                    <li>• CORS Enabled for Security</li>
                  </ul>
                </Card>

                <Card className="p-6 border-border">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full"></span>
                    Frontend
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Next.js 16 with React 19</li>
                    <li>• TypeScript for Type Safety</li>
                    <li>• Recharts for Data Visualization</li>
                    <li>• Responsive Tailwind Design</li>
                  </ul>
                </Card>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-center">Dashboard Features</h3>
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-accent">→</span> Market Sentiment Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">Real-time sentiment gauge and confidence metrics</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-accent">→</span> Market Regime Detection
                  </h4>
                  <p className="text-sm text-muted-foreground">Identify bullish, bearish, or ranging market conditions</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-accent">→</span> Risk Assessment
                  </h4>
                  <p className="text-sm text-muted-foreground">Comprehensive risk indicators and stress signals</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-accent">→</span> Stock Recommendations
                  </h4>
                  <p className="text-sm text-muted-foreground">AI-generated predictions with detailed analysis</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-6 py-8">
              <p className="text-muted-foreground">Ready to explore the dashboard?</p>
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Launch Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-12 py-6 bg-card/50">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>PolyPulse • AI-Powered Prediction Market Analysis</p>
            <p className="mt-1">Not Financial Advice • Data for educational purposes only</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

