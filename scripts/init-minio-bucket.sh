#!/bin/bash

# MinIO Bucket Initialization Script
# Creates bucket and sets public read permissions

echo "🪣 Initializing MinIO bucket..."

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
MAX_ATTEMPTS=30
attempt=0

while [ $attempt -lt $MAX_ATTEMPTS ]; do
    if docker exec paimons-minio mc alias set local http://localhost:9000 paimons paimons123 2>/dev/null; then
        break
    fi
    
    attempt=$((attempt + 1))
    echo "MinIO not ready yet, waiting 5 seconds... (attempt $attempt/$MAX_ATTEMPTS)"
    sleep 5
    
    # Check if container is running
    if ! docker ps | grep -q paimons-minio; then
        echo "❌ MinIO container is not running. Please check docker compose logs minio"
        exit 1
    fi
done

if [ $attempt -eq $MAX_ATTEMPTS ]; then
    echo "❌ MinIO failed to become ready after $MAX_ATTEMPTS attempts"
    echo "📋 Checking MinIO container logs:"
    docker logs paimons-minio --tail=20
    exit 1
fi

echo "✅ MinIO connection established"

# Create bucket if it doesn't exist
if ! docker exec paimons-minio mc ls local/codex > /dev/null 2>&1; then
    echo "📦 Creating codex bucket..."
    docker exec paimons-minio mc mb local/codex
else
    echo "📦 Bucket 'codex' already exists"
fi

# Set public read policy for the bucket
echo "🔓 Setting public read access for codex bucket..."
docker exec paimons-minio mc anonymous set public local/codex

# Verify the policy
echo "🔍 Verifying bucket policy..."
docker exec paimons-minio mc anonymous get local/codex

echo "✅ MinIO bucket initialization complete!"
echo "📦 You can now access images at: http://localhost:9000/codex/"