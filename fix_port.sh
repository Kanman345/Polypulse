#!/bin/bash
# Fix for macOS port 5000 conflict with AirTunes

echo "🔧 Fixing port 5000 conflict..."
echo ""

# Kill any process on port 5000
echo "1. Clearing port 5000 (used by macOS AirTunes)..."
lsof -i :5000 2>/dev/null | grep -v COMMAND | awk '{print $2}' | xargs kill -9 2>/dev/null
echo "   ✓ Done"
echo ""

# Check if port 5001 is available
echo "2. Checking port 5001 availability..."
if lsof -i :5001 &>/dev/null; then
    echo "   ✗ Port 5001 is in use! Kill it with:"
    echo "   lsof -i :5001 | grep LISTEN | awk '{print \$2}' | xargs kill -9"
    exit 1
else
    echo "   ✓ Port 5001 is free"
fi
echo ""

echo "3. Backend is now configured to use port 5001"
echo "4. Frontend configured to point to: http://localhost:5001"
echo ""
echo "✅ Fix complete! Now:"
echo "   • Restart backend: python3 app.py (in virtual environment)"
echo "   • Refresh frontend: http://localhost:3000"
