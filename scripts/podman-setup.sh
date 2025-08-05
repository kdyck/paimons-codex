#!/bin/bash

# Podman-specific setup script for Paimon's Codex

echo "🔧 Setting up Podman environment for Paimon's Codex..."

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo "❌ Podman is not installed. Please install Podman first."
    echo "Visit: https://podman.io/getting-started/installation"
    exit 1
fi

# Install podman-compose if not present
if ! command -v podman-compose &> /dev/null; then
    echo "📦 Installing podman-compose..."
    pip install podman-compose
fi

# Create Podman machine if it doesn't exist (for macOS/Windows)
if command -v podman machine &> /dev/null; then
    if ! podman machine list | grep -q "Currently running"; then
        echo "🚀 Initializing Podman machine..."
        podman machine init --memory=4096 --cpus=2
        podman machine start
    fi
fi

# Enable Podman socket for Docker API compatibility
echo "🔌 Setting up Podman socket..."
systemctl --user enable podman.socket 2>/dev/null || true
systemctl --user start podman.socket 2>/dev/null || true

# Create necessary directories with proper permissions
echo "📁 Creating directories..."
mkdir -p chroma_data oracle_data
chmod 755 chroma_data oracle_data

# Set up SELinux labels if SELinux is enabled
if command -v getenforce &> /dev/null && [[ $(getenforce) != "Disabled" ]]; then
    echo "🔒 Setting SELinux contexts..."
    chcon -Rt svirt_sandbox_file_t chroma_data oracle_data 2>/dev/null || true
fi

echo "✅ Podman environment setup complete!"
echo ""
echo "You can now run: ./scripts/start.sh"