#!/bin/bash

# Paimon's Codex - GPU Setup Script for WSL2 + Podman

echo "🎮 Setting up GPU support for Podman in WSL2..."

# Check if running in WSL
if ! grep -q microsoft /proc/version; then
    echo "❌ This script is designed for WSL2. Exiting."
    exit 1
fi

# Check if nvidia-smi works
if ! nvidia-smi > /dev/null 2>&1; then
    echo "❌ NVIDIA GPU not detected. Make sure you have:"
    echo "   1. NVIDIA drivers installed on Windows host"
    echo "   2. WSL2 with GPU support enabled"
    exit 1
fi

echo "✅ NVIDIA GPU detected:"
nvidia-smi --query-gpu=name --format=csv,noheader,nounits

# Check if we need sudo
if [ "$EUID" -ne 0 ]; then
    echo "🔑 This script needs sudo access to install GPU support."
    echo "You may be prompted for your password..."
fi

# Install NVIDIA Container Toolkit
echo "📦 Installing NVIDIA Container Toolkit..."

# Add NVIDIA package repository
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# Update package list
sudo apt-get update

# Install the toolkit
sudo apt-get install -y nvidia-container-toolkit

# Configure for Podman
echo "⚙️  Configuring Podman for GPU access..."
sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml

# Verify CDI configuration
if [ -f /etc/cdi/nvidia.yaml ]; then
    echo "✅ CDI configuration created successfully"
else
    echo "❌ Failed to create CDI configuration"
    exit 1
fi

echo "🔄 Restarting Podman to apply GPU configuration..."
podman system reset --force 2>/dev/null || true

echo "✅ GPU setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Restart your containers: ./scripts/stop.sh && ./scripts/start.sh"
echo "2. GPU will be automatically available to Ollama and Stable Diffusion"
echo ""
echo "🧪 Test GPU access with:"
echo "   podman run --rm --device nvidia.com/gpu=all nvidia/cuda:11.8-runtime-ubuntu22.04 nvidia-smi"