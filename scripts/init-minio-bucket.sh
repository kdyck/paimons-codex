#!/bin/bash

# MinIO Bucket Initialization Script
# Creates bucket and sets public read permissions

echo "🪣 Initializing MinIO bucket..."

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
until podman exec paimons-minio mc alias set local http://localhost:9000 paimons paimons123 2>/dev/null; do
    echo "MinIO not ready yet, waiting 5 seconds..."
    sleep 5
done

echo "✅ MinIO connection established"

# Create bucket if it doesn't exist
if ! podman exec paimons-minio mc ls local/codex > /dev/null 2>&1; then
    echo "📦 Creating codex bucket..."
    podman exec paimons-minio mc mb local/codex
else
    echo "📦 Bucket 'codex' already exists"
fi

# Set public read policy for the bucket
echo "🔓 Setting public read access for codex bucket..."
podman exec paimons-minio mc anonymous set public local/codex

# Verify the policy
echo "🔍 Verifying bucket policy..."
podman exec paimons-minio mc anonymous get local/codex

echo "✅ MinIO bucket initialization complete!"
echo "📦 You can now access images at: http://localhost:9000/codex/"