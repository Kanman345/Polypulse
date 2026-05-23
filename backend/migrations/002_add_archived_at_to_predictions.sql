-- Migration 002: Add archived_at and supporting tracker columns to predictions table
-- Run this on Supabase SQL Editor to fix the prediction tracker endpoint

-- Add archived_at column (nullable - only set when a prediction is archived)
ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add additional columns used by prediction_tracker.py for progress tracking
ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS start_price    DECIMAL(12, 2) DEFAULT NULL;

ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS last_price     DECIMAL(12, 2) DEFAULT NULL;

ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS price_target   DECIMAL(12, 2) DEFAULT NULL; -- already exists, skip if so

ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS direction      VARCHAR(10)    DEFAULT 'UP';

ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS expires_at     TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS progress       DECIMAL(6, 2)  DEFAULT NULL;

ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS hit            BOOLEAN        DEFAULT NULL;

ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS status         VARCHAR(20)    DEFAULT 'Tracking';

ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS batch_id       VARCHAR(50)    DEFAULT NULL;

-- Index for prediction tracker queries
CREATE INDEX IF NOT EXISTS idx_predictions_archived_at ON predictions(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_batch_id    ON predictions(batch_id);
