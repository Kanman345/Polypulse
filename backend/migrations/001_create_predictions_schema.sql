-- Migrations for Polymarket Predictions System
-- Run this migration on Supabase to set up the predictions tracking tables

-- Create predictions table (active 3-week cycle)
CREATE TABLE IF NOT EXISTS predictions (
    id BIGSERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    asset_name VARCHAR(50) NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    price_target DECIMAL(12, 2) NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL,
    reasoning TEXT NOT NULL,
    macro_regime VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    meta JSONB DEFAULT '{}',
    UNIQUE(ticker, created_at)
);

-- Create prediction_tracker table (archived predictions)
CREATE TABLE IF NOT EXISTS prediction_tracker (
    id BIGSERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    asset_name VARCHAR(50) NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    price_target DECIMAL(12, 2) NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL,
    reasoning TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    meta JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_active ON predictions(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_ticker ON predictions(ticker);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_ticker ON prediction_tracker(ticker);
CREATE INDEX IF NOT EXISTS idx_tracker_archived_at ON prediction_tracker(archived_at DESC);

-- Enable RLS (Row Level Security) if needed
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_tracker ENABLE ROW LEVEL SECURITY;

-- Optional: Create policy to allow all authenticated users to read
CREATE POLICY "Allow read access to predictions" ON predictions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to tracker" ON prediction_tracker FOR SELECT USING (auth.role() = 'authenticated');
