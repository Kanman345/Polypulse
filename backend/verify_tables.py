#!/usr/bin/env python3
"""Verify and create missing Supabase tables"""

from db import supabase
import json

def verify_tables():
    """Check which tables exist and create missing ones"""
    print("🔍 Checking Supabase tables...\n")
    
    tables_to_check = ["market_analysis_cache", "predictions", "prediction_tracker"]
    
    for table in tables_to_check:
        try:
            res = supabase.table(table).select("*").limit(1).execute()
            print(f"✅ {table} - EXISTS")
        except Exception as e:
            print(f"❌ {table} - MISSING: {str(e)}")
    
    print("\n" + "="*60)
    print("Creating missing tables...")
    print("="*60 + "\n")
    
    # Create market_analysis_cache if it doesn't exist
    try:
        supabase.table("market_analysis_cache").select("*").limit(1).execute()
        print("✅ market_analysis_cache already exists")
    except:
        print("🔧 Creating market_analysis_cache...")
        try:
            supabase.rpc("create_table_if_not_exists", {
                "table_name": "market_analysis_cache"
            }).execute()
            print("✅ Created market_analysis_cache")
        except Exception as e:
            print(f"⚠️  Auto-creation failed. Run this SQL manually on Supabase:\n")
            print("""
CREATE TABLE IF NOT EXISTS market_analysis_cache (
    id BIGSERIAL PRIMARY KEY,
    analysis JSONB NOT NULL,
    market_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    meta JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_market_analysis_cache_created_at 
ON market_analysis_cache(created_at DESC);

ALTER TABLE market_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to market_analysis_cache" 
ON market_analysis_cache FOR SELECT 
USING (auth.role() = 'authenticated');
            """)

if __name__ == "__main__":
    verify_tables()
