# Quick Start Guide - PolyPulse

Get PolyPulse running in 5 minutes!

## Prerequisites

- **Python 3.11+** with pip
- **Node.js 18+** with npm
- **Git** (optional, for cloning)

## Setup Steps

### Step 1: Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

**Create `.env` file from template:**

```bash
cp .env.example .env
```

Then edit `.env` and add your Groq API key:

```bash
# .env
GROQ_API_KEY=your_actual_groq_api_key_here
```

Get your free Groq API key at https://console.groq.com

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask server:

```bash
python3 app.py
```

You should see:
```
 * Running on http://127.0.0.1:5001
 * Press CTRL+C to quit
```

✅ **Backend is running on port 5001**

### Step 2: Frontend Setup

Open a **new terminal** and navigate to the frontend directory:

```bash
cd frontend
```

Install Node dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
```

✅ **Frontend is running on port 3000**

## Verification

### Check if everything is working:

1. **Backend Health Check**
   - Open browser or terminal:
   ```bash
   curl http://localhost:5001/api/health
   ```
   - Expected response: `{"status":"ok"}`

2. **Access the Dashboard**
   - Open your browser: **http://localhost:3000**
   - You should see the landing page with "Start Market Analysis" button
   - Click to go to dashboard and wait for data to load (~30-60 seconds on first load)

3. **Check Recommendations**
   - Click "View Recommendations" to see AI-generated stock picks
   - Should load instantly from cached data

## Troubleshooting

### Backend won't start

**Error: "Address already in use"**
```bash
# Kill process on port 5001 (macOS/Linux)
lsof -ti:5001 | xargs kill -9

# Or change port in app.py:
# Change: app.run(port=5001)
# To:     app.run(port=5002)
```

**Error: "ModuleNotFoundError"**
```bash
# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend won't start

**Error: "Port 3000 already in use"**
```bash
npm run dev -- -p 3001
# Then visit http://localhost:3001
```

**Error: "Module not found"**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Data not loading on dashboard

1. **Check backend is running** - Visit http://localhost:5001/api/health
2. **Check browser console** - Look for error messages (F12 → Console tab)
3. **Check network tab** - Verify API calls are reaching the backend
4. **Wait 1-2 minutes** - LLM analysis takes time on first request

## How It Works

1. **Landing Page** (`/`) - Clears session cache, shows project info
2. **Dashboard** (`/dashboard`) - Fetches market data and AI analysis from backend (~30-60s first time)
3. **Recommendations** (`/recommendations`) - Shows AI-generated stock picks from cached data (instant)

Data is cached for the entire session - navigate between pages without re-fetching!

## Next Steps

### Explore the Dashboard
- View real Polymarket sentiment data
- Check market regime (bullish/bearish/ranging)
- See fear index and recession probabilities
- Review AI-generated stock recommendations

### Customize Markets

Edit `backend/Polymarket_Updated.py` to track different markets:

```python
PREDEFINED_EVENT_IDS = {
    "your_market": YOUR_EVENT_ID,
    # Add more markets here
}
```

Then restart the backend server.

### Check Logs

**Backend logs** - Look in the backend terminal for API request details
**Frontend logs** - Press F12 in browser, open Console tab

## Development Tips

- **Frontend hot reload** - Changes to React components refresh instantly
- **Backend changes** - Restart Flask server for changes to take effect
- **API debugging** - Visit `http://localhost:5001/api/raw-market-data` for raw JSON data

## Stop the Servers

Press **CTRL+C** in each terminal to stop the servers.

## Questions?

If something isn't working:
1. Check you're using Python 3.11+ and Node.js 18+
2. Ensure both terminals show no errors
3. Verify ports 5001 (backend) and 3000 (frontend) are accessible
4. Clear browser cache (Ctrl+Shift+Del / Cmd+Shift+Del)
5. Check internet connection for Polymarket API access

---

**Happy analyzing! 🚀**
