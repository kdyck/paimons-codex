#!/bin/bash

# Paimon's Codex - UI Only Clean Script

echo "🧹 Cleaning UI environment only..."

# Navigate to UI directory
cd "$(dirname "$0")/../ui" || exit 1

echo "📂 Current directory: $(pwd)"

# Check for -y flag
FORCE_YES=false
if [[ "$1" == "-y" || "$1" == "--yes" ]]; then
    FORCE_YES=true
fi

# Stop UI dev server if running
echo "🛑 Stopping React dev server..."
pkill -f "react-scripts start" 2>/dev/null || true

echo "🗑️  Cleaning UI build artifacts and dependencies..."

# Remove build directory
if [ -d "build" ]; then
    echo "  - Removing build directory..."
    rm -rf build
fi

# Remove node_modules
if [ -d "node_modules" ]; then
    echo "⚠️  This will remove node_modules (you'll need to run 'npm install' after)"
    
    if [ "$FORCE_YES" = true ]; then
        echo "🤖 Auto-confirmed with -y flag"
        REPLY="y"
    else
        read -p "Remove node_modules? (y/N): " -n 1 -r
        echo
    fi
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "  - Removing node_modules..."
        rm -rf node_modules
        NEED_INSTALL=true
    fi
fi

# Remove package-lock.json
if [ -f "package-lock.json" ]; then
    echo "  - Removing package-lock.json..."
    rm -f package-lock.json
fi

# Clear npm cache
echo "  - Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

echo "✅ UI environment cleaned successfully."

echo "🚀 Run './scripts/start.sh ui' to rebuild and start the UI service"