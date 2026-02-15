"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"
import { AnalysisResponse } from "./api"

interface MarketAnalysisContextType {
  data: AnalysisResponse | null
  loading: boolean
  error: string | null
  fetchData: () => Promise<void>
  clearCache: () => void
}

const MarketAnalysisContext = createContext<MarketAnalysisContextType | undefined>(undefined)

export function MarketAnalysisProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchData = async () => {
    // Don't fetch if we already have data cached
    if (hasFetched && data) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
      const response = await fetch(`${apiUrl}/api/market-analysis`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(
          `Failed to fetch market analysis: ${response.status} ${response.statusText}`
        )
      }

      const result: AnalysisResponse = await response.json()
      setData(result)
      setHasFetched(true)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = () => {
    setData(null)
    setHasFetched(false)
    setError(null)
  }

  return (
    <MarketAnalysisContext.Provider value={{ data, loading, error, fetchData, clearCache }}>
      {children}
    </MarketAnalysisContext.Provider>
  )
}

export function useMarketAnalysisContext() {
  const context = useContext(MarketAnalysisContext)
  if (context === undefined) {
    throw new Error("useMarketAnalysisContext must be used within MarketAnalysisProvider")
  }
  return context
}
