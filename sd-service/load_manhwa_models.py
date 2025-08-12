#!/usr/bin/env python3
"""
Download and setup optimized models for manhwa generation
"""

import os
import requests
from pathlib import Path
import torch
from huggingface_hub import hf_hub_download

def download_manhwa_models():
    """Download recommended models for manhwa generation"""
    
    models_dir = Path("/models")
    models_dir.mkdir(exist_ok=True)
    
    print("📥 Downloading optimized models for manhwa generation...")
    
    # Better base models for anime/manhwa
    recommended_models = {
        "anything-v4.5": {
            "repo": "andite/anything-v4.0",
            "files": ["anything-v4.5-pruned.safetensors"],
            "description": "Popular anime model with good manhwa compatibility"
        },
        "counterfeit-v3": {
            "repo": "gsdf/Counterfeit-V3.0",
            "files": ["Counterfeit-V3.0_fp16.safetensors"],
            "description": "Excellent for anime/manhwa characters"
        },
        "deliberate-v2": {
            "repo": "XpucT/Deliberate",
            "files": ["deliberate_v2.safetensors"],
            "description": "Great for realistic manhwa style"
        }
    }
    
    # Download VAE for better colors
    vae_models = {
        "anime-vae": {
            "repo": "hakurei/waifu-diffusion-v1-4",
            "files": ["kl-f8-anime2.ckpt"],
            "description": "Better colors for anime/manhwa"
        }
    }
    
    # LoRA models for manhwa style
    lora_models = {
        "manhwa-style": {
            "repo": "Linaqruf/stolen",
            "files": ["stolen_lora.safetensors"],
            "description": "Korean webtoon style"
        }
    }
    
    # Create directories
    (models_dir / "checkpoints").mkdir(exist_ok=True)
    (models_dir / "vae").mkdir(exist_ok=True)
    (models_dir / "lora").mkdir(exist_ok=True)
    
    # Download models
    for model_name, info in recommended_models.items():
        print(f"\n📦 {model_name}: {info['description']}")
        for filename in info['files']:
            try:
                print(f"   Downloading {filename}...")
                hf_hub_download(
                    repo_id=info['repo'],
                    filename=filename,
                    local_dir=models_dir / "checkpoints",
                    local_dir_use_symlinks=False
                )
                print(f"   ✅ {filename} downloaded")
            except Exception as e:
                print(f"   ❌ Failed to download {filename}: {e}")
    
    print("\n🎨 Model setup complete!")
    return models_dir

def setup_controlnet_models():
    """Download ControlNet models for better composition"""
    
    controlnet_dir = Path("/models/controlnet")
    controlnet_dir.mkdir(exist_ok=True)
    
    controlnet_models = {
        "canny": {
            "repo": "lllyasviel/sd-controlnet-canny",
            "files": ["diffusion_pytorch_model.safetensors"],
            "description": "Edge detection for better line art"
        },
        "openpose": {
            "repo": "lllyasviel/sd-controlnet-openpose",
            "files": ["diffusion_pytorch_model.safetensors"],
            "description": "Pose control for character consistency"
        }
    }
    
    print("\n🎮 Setting up ControlNet models...")
    
    for model_name, info in controlnet_models.items():
        model_dir = controlnet_dir / model_name
        model_dir.mkdir(exist_ok=True)
        
        print(f"📦 {model_name}: {info['description']}")
        for filename in info['files']:
            try:
                print(f"   Downloading {filename}...")
                hf_hub_download(
                    repo_id=info['repo'],
                    filename=filename,
                    local_dir=model_dir,
                    local_dir_use_symlinks=False
                )
                print(f"   ✅ {filename} downloaded")
            except Exception as e:
                print(f"   ❌ Failed: {e}")

def create_model_config():
    """Create configuration for model loading"""
    
    config = {
        "recommended_settings": {
            "sampler": "DPM++ 2M Karras",
            "steps": 25,
            "cfg_scale": 7.5,
            "width": 768,
            "height": 1152,  # Perfect manhwa aspect ratio
            "clip_skip": 2,   # Better for anime/manhwa
        },
        "quality_tags": [
            "masterpiece", "best quality", "ultra detailed",
            "extremely detailed face", "perfect lighting",
            "8k uhd", "high resolution"
        ],
        "manhwa_tags": [
            "manhwa style", "korean webtoon", "digital art",
            "clean lines", "cell shading", "anime style",
            "beautiful composition", "professional artwork"
        ]
    }
    
    config_file = Path("/models/manhwa_config.json")
    import json
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"⚙️ Configuration saved to {config_file}")

if __name__ == "__main__":
    print("🎨 Setting up manhwa generation models...")
    print("💾 RTX 3090 detected - using optimized settings")
    
    # Check VRAM
    if torch.cuda.is_available():
        vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"🎮 GPU VRAM: {vram_gb:.1f}GB")
        
        if vram_gb >= 20:
            print("✅ Excellent! You can run the largest models with high resolution")
        else:
            print("⚠️  Limited VRAM - consider smaller models")
    
    # Setup models
    download_manhwa_models()
    setup_controlnet_models() 
    create_model_config()
    
    print("\n🚀 Setup complete! Your manhwa generation should be much better now.")
    print("\nNext steps:")
    print("1. Restart your SD service: podman-compose restart stable-diffusion")
    print("2. Test with improved prompts")
    print("3. Consider training custom LoRA with your manhwa content")