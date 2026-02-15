"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, Bitcoin, DollarSign } from "lucide-react"
import { MarketAnalysis } from "@/lib/api"

interface AssetOutlookSectionProps {
  assetOutlook: MarketAnalysis["asset_outlook"]
}

const nvidiaData = [
  { month: "Jan", low: 450, mid: 520, high: 590 },
  { month: "Feb", low: 480, mid: 550, high: 620 },
  { month: "Mar", low: 510, mid: 580, high: 650 },
  { month: "Apr", low: 530, mid: 610, high: 690 },
  { month: "May", low: 560, mid: 640, high: 720 },
  { month: "Jun", low: 580, mid: 670, high: 760 },
]

const bitcoinData = [
  { month: "Jan", low: 38000, mid: 42000, high: 46000 },
  { month: "Feb", low: 40000, mid: 45000, high: 50000 },
  { month: "Mar", low: 42000, mid: 48000, high: 54000 },
  { month: "Apr", low: 44000, mid: 51000, high: 58000 },
  { month: "May", low: 46000, mid: 54000, high: 62000 },
  { month: "Jun", low: 48000, mid: 57000, high: 66000 },
]

const gdpData = [
  { quarter: "Q1", low: 1.8, mid: 2.3, high: 2.8 },
  { quarter: "Q2", low: 2.0, mid: 2.5, high: 3.0 },
  { quarter: "Q3", low: 2.1, mid: 2.6, high: 3.1 },
  { quarter: "Q4", low: 2.2, mid: 2.7, high: 3.2 },
]

const getBiasColor = (bias: string) => {
  if (bias === "Positive") return "text-chart-3"
  if (bias === "Negative") return "text-chart-1"
  return "text-chart-2"
}

export function AssetOutlookSection({ assetOutlook }: AssetOutlookSectionProps) {
  const assets = [
    {
      name: "Nvidia",
      type: "Tech Equities",
      icon: TrendingUp,
      data: nvidiaData,
      outlook: assetOutlook.nvidia,
      low: "$580",
      target: "$670",
      high: "$760",
    },
    {
      name: "Bitcoin",
      type: "Crypto",
      icon: Bitcoin,
      data: bitcoinData,
      outlook: assetOutlook.bitcoin,
      low: "$48K",
      target: "$57K",
      high: "$66K",
    },
    {
      name: "US Economy",
      type: "GDP Growth",
      icon: DollarSign,
      data: gdpData,
      outlet: assetOutlook.us_economy,
      low: "2.2%",
      target: "2.7%",
      high: "3.2%",
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Asset Outlook</h2>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Nvidia */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-chart-3/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <h3 className="font-semibold">Nvidia</h3>
              <p className="text-sm text-muted-foreground">Tech Equities</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className={`text-lg font-bold ${getBiasColor(assetOutlook.nvidia.bias)}`}>
                {assetOutlook.nvidia.bias}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Confidence: {Math.round(assetOutlook.nvidia.confidence * 100)}%
              </div>
            </div>
            {assetOutlook.nvidia.reasoning && (
              <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded">
                {assetOutlook.nvidia.reasoning}
              </div>
            )}
          </div>
        </Card>

        {/* Bitcoin */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-chart-5/20 rounded-lg flex items-center justify-center">
              <Bitcoin className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <h3 className="font-semibold">Bitcoin</h3>
              <p className="text-sm text-muted-foreground">Crypto</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className={`text-lg font-bold ${getBiasColor(assetOutlook.bitcoin.bias)}`}>
                {assetOutlook.bitcoin.bias}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Confidence: {Math.round(assetOutlook.bitcoin.confidence * 100)}%
              </div>
            </div>
            {assetOutlook.bitcoin.reasoning && (
              <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded">
                {assetOutlook.bitcoin.reasoning}
              </div>
            )}
          </div>
        </Card>

        {/* US Economy */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-chart-4/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <h3 className="font-semibold">US Economy</h3>
              <p className="text-sm text-muted-foreground">GDP Growth</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className={`text-lg font-bold ${getBiasColor(assetOutlook.us_economy.bias)}`}>
                {assetOutlook.us_economy.bias}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Confidence: {Math.round(assetOutlook.us_economy.confidence * 100)}%
              </div>
            </div>
            {assetOutlook.us_economy.reasoning && (
              <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded">
                {assetOutlook.us_economy.reasoning}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
