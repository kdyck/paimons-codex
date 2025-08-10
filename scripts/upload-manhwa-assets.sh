#!/bin/bash

# MinIO Asset Upload Script
# Uploads manhwa assets to MinIO bucket

# Function to show usage
show_usage() {
    echo "Usage: $0 <manhwa-name>"
    echo ""
    echo "Examples:"
    echo "  $0 no-more-princes       # Upload no-more-princes manhwa"
    echo "  $0 solo-leveling         # Upload solo-leveling manhwa"
    echo ""
    echo "This script will upload all assets from assets/<manhwa-name>/ to MinIO bucket 'codex'"
    exit 1
}

# Check if manhwa name is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Manhwa name is required"
    show_usage
fi

MANHWA_NAME="$1"

echo "📤 Uploading manhwa assets: $MANHWA_NAME"

# Check if assets directory exists
ASSETS_DIR="assets/$MANHWA_NAME"
if [ ! -d "$ASSETS_DIR" ]; then
    echo "❌ Error: Assets directory not found: $ASSETS_DIR"
    echo "   Make sure the manhwa assets exist in the assets/ directory"
    exit 1
fi

# Run the Python upload script
echo "🚀 Starting upload process..."
python scripts/upload_assets.py --manhwa "$MANHWA_NAME"

# Check if upload was successful
if [ $? -eq 0 ]; then
    echo "✅ Upload completed successfully!"
    echo "📦 Assets available at: http://localhost:9000/codex/$MANHWA_NAME/"
else
    echo "❌ Upload failed!"
    exit 1
fi