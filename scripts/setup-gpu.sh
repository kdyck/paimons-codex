#!/bin/bash

# Paimon's Codex - GPU Setup Script for Docker

echo "🎮 Setting up GPU support for Docker..."

# Detect platform
IS_WSL=false
IS_LINUX=false
IS_WINDOWS=false

if grep -q microsoft /proc/version 2>/dev/null; then
    IS_WSL=true
    echo "🔍 Detected: WSL2 environment"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IS_LINUX=true
    echo "🔍 Detected: Native Linux environment"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    IS_WINDOWS=true
    echo "🔍 Detected: Windows environment"
else
    echo "⚠️  Unknown platform, assuming Linux..."
    IS_LINUX=true
fi

# Check if nvidia-smi works
if ! nvidia-smi > /dev/null 2>&1; then
    echo "❌ NVIDIA GPU not detected. Make sure you have:"
    if [ "$IS_WSL" = true ]; then
        echo "   1. NVIDIA drivers installed on Windows host"
        echo "   2. WSL2 with GPU support enabled"
    elif [ "$IS_WINDOWS" = true ]; then
        echo "   1. NVIDIA drivers installed"
        echo "   2. Docker Desktop with WSL2 backend"
    else
        echo "   1. NVIDIA drivers installed"
        echo "   2. CUDA toolkit installed"
    fi
    exit 1
fi

echo "✅ NVIDIA GPU detected:"
nvidia-smi --query-gpu=name --format=csv,noheader,nounits

# Windows Docker Desktop check
if [ "$IS_WINDOWS" = true ]; then
    echo "🐳 For Windows, ensure Docker Desktop is configured with:"
    echo "   1. WSL2 backend enabled"
    echo "   2. GPU support enabled in Settings"
    echo "   3. NVIDIA Container Toolkit installed via Docker Desktop"
    echo ""
    echo "✅ GPU setup for Windows Docker Desktop is automatic."
    echo "If you need to test GPU access, use:"
    echo "   docker run --rm --gpus all nvidia/cuda:11.8-runtime-ubuntu22.04 nvidia-smi"
    exit 0
fi

# Linux/WSL setup
if [ "$EUID" -ne 0 ] && [ "$IS_WSL" = true ] || [ "$IS_LINUX" = true ]; then
    echo "🔑 This script needs sudo access to install GPU support."
    echo "You may be prompted for your password..."
fi

# Install NVIDIA Container Toolkit for Linux/WSL
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

# Configure for Docker
echo "⚙️  Configuring Docker for GPU access..."
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

echo "✅ GPU setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Restart your containers: ./scripts/stop.sh && ./scripts/start.sh"
echo "2. GPU will be automatically available to Ollama and Stable Diffusion"
echo ""
echo "🧪 Test GPU access with:"
echo "   docker run --rm --gpus all nvidia/cuda:11.8-runtime-ubuntu22.04 nvidia-smi"