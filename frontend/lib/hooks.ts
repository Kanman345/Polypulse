import { useState, useEffect } from 'react'
import { AnalysisResponse, fetchMarketAnalysis } from './api'

export interface UseMarketAnalysisState {
  data: AnalysisResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMarketAnalysis(): UseMarketAnalysisState {
  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchMarketAnalysis()
      if (result.success) {
        setData(result)
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching market analysis:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}
