## 3-Week Prediction Cycle Setup

### Overview
The system now saves predictions for 3 assets (NVIDIA, Bitcoin, Gold) and refreshes them every 3 weeks. Old predictions automatically move to a historical tracker.

---

## Setup Instructions

### Step 1: Create Supabase Tables

**Option A: Automated (recommended)**
```bash
python setup_migrations.py
```

**Option B: Manual (via Supabase Dashboard)**
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project → SQL Editor
3. Create new query
4. Copy & paste content from `migrations/001_create_predictions_schema.sql`
5. Run

---

## How It Works

### 1. **Predictions Table** (Active)
- Stores current 3-week cycle predictions
- Auto-archives to `prediction_tracker` after 3 weeks
- Tracks: current price, target price, confidence, reasoning

| Field | Type | Purpose |
|-------|------|---------|
| `ticker` | VARCHAR | NVDA, BTC, GLD |
| `asset_name` | VARCHAR | nvidia, bitcoin, gold |
| `current_price` | DECIMAL | Market price when prediction was made |
| `price_target` | DECIMAL | AI-predicted price in 3 months |
| `confidence` | DECIMAL | 0.0-1.0 confidence level |
| `created_at` | TIMESTAMP | When prediction was created |
| `is_active` | BOOLEAN | TRUE until 3 weeks pass |

### 2. **Prediction Tracker** (Historical)
- Archives completed prediction cycles
- Useful for backtesting accuracy
- Tracks: original prediction → archived timestamp

---

## Prediction Flow

```
Day 1: Run Polymarket_Updated.py
  ↓
Predictions created for NVDA, BTC, GLD
  ↓
Saved to predictions table (is_active = TRUE)
  ↓
21 days pass...
  ↓
Next run of Polymarket_Updated.py
  ↓
System detects 3+ weeks passed
  ↓
Old predictions archived → prediction_tracker
  ↓
New predictions created
```

---

## Running Predictions

### First time:
```bash
python Polymarket_Updated.py
```
→ Saves 3 predictions to Supabase

### Before 3 weeks:
```bash
python Polymarket_Updated.py
```
→ Skips (already fresh)
→ Message: "⏳ Predictions still fresh (< 3 weeks)"

### After 3 weeks:
```bash
python Polymarket_Updated.py
```
→ Archives old predictions
→ Creates new predictions
→ Saves to Supabase

---

## Querying Results

### View Active Predictions
```sql
SELECT ticker, current_price, price_target, confidence, created_at
FROM predictions
WHERE is_active = TRUE
ORDER BY created_at DESC;
```

### View Prediction History
```sql
SELECT ticker, price_target, archived_at
FROM prediction_tracker
ORDER BY archived_at DESC;
```

### Compare Prediction vs Actual
```sql
SELECT 
  t.ticker,
  t.price_target,
  NOW() as current_time,
  t.archived_at,
  EXTRACT(DAY FROM (NOW() - t.archived_at)) as days_since_prediction
FROM prediction_tracker t
ORDER BY archived_at DESC LIMIT 10;
```

---

## Schema Summary

### `predictions` Table
```
✓ ticker VARCHAR(10)
✓ asset_name VARCHAR(50)
✓ current_price DECIMAL
✓ price_target DECIMAL
✓ target_period VARCHAR(20)
✓ confidence DECIMAL
✓ bias VARCHAR(20)
✓ outlook_confidence DECIMAL
✓ reasoning TEXT
✓ created_at TIMESTAMP
✓ batch_id VARCHAR(100)
✓ is_active BOOLEAN
✓ meta JSONB
```

### `prediction_tracker` Table
```
✓ ticker VARCHAR(10)
✓ price_target DECIMAL
✓ current_price DECIMAL
✓ confidence DECIMAL
✓ reasoning TEXT
✓ prediction_created_at TIMESTAMP
✓ archived_at TIMESTAMP
✓ meta JSONB (full snapshot)
```

---

## Notes

- **Refresh Interval**: 21 days (REFRESH_INTERVAL_DAYS = 21)
- **Auto-Archive**: Old predictions automatically move to tracker
- **Batch ID**: Groups predictions created at same time
- **Metadata**: Full analysis snapshot stored as JSON for reference

---

## Troubleshooting

### Error: "column predictions.created_at does not exist"
→ Run migrations first: `python setup_migrations.py`

### Error: "Could not find the 'asset_name' column"
→ Your table schema is outdated. Drop & recreate via migrations.

### Predictions not showing up?
→ Check `is_active = TRUE` in your query
→ Verify `created_at` is recent

---

Done! Your 3-week prediction system is ready. 🚀
