-- Migration 003: Rename current_price to entry_price in predictions table
-- This makes it clear that the stored price is the price AT THE TIME the prediction was made,
-- not the current live market price.
-- Run this on Supabase SQL Editor.

ALTER TABLE predictions
    RENAME COLUMN current_price TO entry_price;
