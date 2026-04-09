#!/usr/bin/env python3
"""
Migration script to set up Supabase tables for 3-week prediction cycle.
Run this once before using the storage system.
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Read migration SQL
with open("migrations/001_create_predictions_schema.sql", "r") as f:
    sql = f.read()

print("🔧 Running migration...")
try:
    # Execute SQL via Supabase admin API
    response = supabase.postgrest.post(
        "/rpc/exec_sql",
        {"sql": sql}
    )
    print("✓ Migration completed successfully!")
    print("\nTables created:")
    print("  - predictions (active 3-week cycle)")
    print("  - prediction_tracker (archived predictions)")
    
except Exception as e:
    print(f"⚠️ Note: If tables already exist, that's OK!")
    print(f"   Error: {e}")
    print("\n📝 Alternative: Run this SQL manually in Supabase dashboard:")
    print("   Go to SQL Editor → New Query → Paste the SQL from migrations/001_create_predictions_schema.sql")
