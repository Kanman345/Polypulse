# PolyPulse - Prediction Market Intelligence

A full-stack AI-powered analytics platform that analyzes Polymarket prediction data and generates intelligent market insights through an interactive dashboard.

## 🎯 What is PolyPulse?

PolyPulse bridges prediction markets with AI analysis. It fetches real-time data from Polymarket, uses advanced LLM analysis to identify patterns and generate stock recommendations, then visualizes everything in a beautiful, interactive dashboard.

### Key Features

- **Real-time Market Data**: Connects directly to Polymarket's prediction API
- **AI-Powered Analysis**: Uses Groq's LLM (llama-3.3-70b) for intelligent insights
- **Interactive Dashboard**: Beautiful visualizations of sentiment, market regime, risk indicators, and more
- **Smart Recommendations**: AI-generated stock recommendations with detailed reasoning
- **Session Caching**: Lightning-fast navigation between dashboard and recommendations
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🏗️ Architecture

### Backend
- **Python Flask** API server that manages Polymarket data fetching and LLM integration
- Real-time market sentiment analysis and pattern detection
- AI-generated recommendations based on crowd signals

### Frontend
- **Next.js 16** with React 19 for a modern, responsive UI
- **TypeScript** for type-safe components and data handling
- **Recharts** for beautiful data visualizations
- **Tailwind CSS** for responsive, accessible design

## 📊 Dashboard Components

- **Market Sentiment Gauge** - Real-time sentiment analysis with confidence metrics
- **Market Regime Detection** - Bullish, bearish, or ranging market conditions
- **Fear & Recession Index** - Crowd-based probability assessments
- **Crowd Sentiment Section** - Detailed analysis of market participant behavior
- **Asset Outlook** - Sector-by-sector performance assessment
- **Risk & Stress Indicators** - Comprehensive risk analysis
- **Stock Recommendations** - AI-generated predictions with expected outperformance levels

## 🚀 Quick Start

See [QUICKSTART.md](QUICKSTART.md) for step-by-step setup instructions.

## 📁 Project Structure

```
Polymarket_Nirvaan/
├── backend/
│   ├── Polymarket_Updated.py    # Core Polymarket data pipeline
│   ├── app.py                   # Flask API server
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── dashboard/           # Dashboard route
│   │   └── recommendations/     # Recommendations route
│   ├── components/              # React UI components
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── context.tsx         # Global state management
│   │   └── hooks.ts            # Custom React hooks
│   └── package.json
│
└── QUICKSTART.md               # Setup guide
```

## 🔧 Technology Stack

### Backend
- Python 3.11+
- Flask (API server)
- Groq API (LLM integration)
- Polymarket REST API

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts
- React Context API

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

If you'd like to contribute or report issues, feel free to reach out!

---

**Built with ❤️ for prediction market analysis**
