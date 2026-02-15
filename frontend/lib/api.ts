// API client for backend market analysis
// Use NEXT_PUBLIC_BACKEND_URL (set in Vercel) or fall back to NEXT_PUBLIC_API_URL / localhost
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export interface MarketOutcome {
  [key: string]: number // e.g., { "Yes": 0.65, "No": 0.35 }
}

export interface MarketData {
  event_key: string
  event_id: number
  event_title: string
  market_id: string
  market_question: string
  outcomes: MarketOutcome
  volume: number
  end_date: string | null
}

export interface AssetOutlook {
  bias: 'Positive' | 'Neutral' | 'Negative'
  confidence: number
  reasoning?: string
}

export interface TopStock {
  name: string
  ticker: string
  sector: string
  reasoning: string
  expected_outperformance: 'Moderate' | 'High'
  price_target?: number
  target_period?: string
}

export interface SectorPerformance {
  name: string
  performance: number
  change: string
}

export interface MarketAnalysis {
  market_sentiment: {
    label: 'Bullish' | 'Neutral' | 'Bearish'
    score: number
  }
  market_regime: {
    risk: 'Risk-On' | 'Risk-Off' | 'Transitional'
    liquidity: 'Easing' | 'Neutral' | 'Tightening'
    volatility: 'Low' | 'Normal' | 'Elevated'
  }
  crowd_signals: {
    fed_policy_bias: string
    recession_probability: number
    rate_cut_bias: string
  }
  asset_outlook: {
    nvidia: AssetOutlook
    bitcoin: AssetOutlook
    us_economy: AssetOutlook
  }
  top_stocks: TopStock[]
  sector_performance: SectorPerformance[]
  risk_indicators: {
    bubble_risk: number
    market_fragility: number
    upside_probability: number
  }
}

export interface AnalysisResponse {
  success: boolean
  market_data: MarketData[]
  analysis: MarketAnalysis
  timestamp?: string
  error?: string
}

export async function fetchMarketAnalysis(): Promise<AnalysisResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/market-analysis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 0 || response.type === 'opaque') {
        throw new Error(`Backend not running at ${API_BASE}. Make sure to start the Flask server with: python3 app.py in the backend folder`)
      }
      throw new Error(`Backend error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as AnalysisResponse
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${API_BASE}. Ensure Flask server is running.`)
    }
    throw error
  }
}

export async function fetchRawMarketData(): Promise<MarketData[]> {
  try {
    const response = await fetch(`${API_BASE}/api/raw-market-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data as MarketData[]
  } catch (error) {
    console.error('Failed to fetch raw market data:', error)
    throw error
  }
}
