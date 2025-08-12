#!/usr/bin/env python3
"""
LoRA Training Script for Manhwa Style
Optimized for RTX 3090 24GB VRAM
"""

import os
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import argparse
from pathlib import Path

def setup_lora_training():
    """Setup LoRA training environment"""
    
    # Training configuration optimized for RTX 3090
    config = {
        "pretrained_model": "runwayml/stable-diffusion-v1-5",
        "resolution": 768,  # Higher res for better manhwa detail
        "batch_size": 2,    # RTX 3090 can handle this
        "gradient_accumulation_steps": 2,
        "learning_rate": 1e-4,
        "lr_scheduler": "cosine",
        "max_train_steps": 2000,
        "checkpointing_steps": 500,
        "validation_steps": 250,
        "lora_rank": 64,    # Higher rank for better quality
        "mixed_precision": "fp16",
        "gradient_checkpointing": True,
        "use_8bit_adam": True,
    }
    
    return config

def prepare_dataset(input_dir: str, output_dir: str):
    """
    Prepare manhwa dataset for training
    
    Expected structure:
    input_dir/
    ├── images/
    │   ├── character1_001.jpg
    │   ├── character1_002.jpg
    │   └── ...
    └── captions/
        ├── character1_001.txt
        ├── character1_002.txt
        └── ...
    """
    
    images_dir = Path(input_dir) / "images"
    captions_dir = Path(input_dir) / "captions"
    
    if not images_dir.exists() or not captions_dir.exists():
        raise ValueError(f"Missing images/ or captions/ directory in {input_dir}")
    
    # Auto-generate captions if missing
    for img_path in images_dir.glob("*.jpg"):
        caption_path = captions_dir / f"{img_path.stem}.txt"
        if not caption_path.exists():
            # Generate basic manhwa caption
            caption = "manhwa style, korean webtoon art, clean lines, digital art, anime style character"
            with open(caption_path, 'w') as f:
                f.write(caption)
    
    print(f"Dataset prepared with {len(list(images_dir.glob('*.jpg')))} images")

def train_manhwa_lora(dataset_path: str, output_path: str = "/models/lora/manhwa"):
    """Train LoRA for manhwa style"""
    
    config = setup_lora_training()
    
    # Create output directory
    os.makedirs(output_path, exist_ok=True)
    
    print("🎨 Starting LoRA training for manhwa style...")
    print(f"📁 Dataset: {dataset_path}")
    print(f"💾 Output: {output_path}")
    print(f"🎯 Target: RTX 3090 24GB VRAM")
    
    # Training command (you'll need to install diffusers training scripts)
    cmd = f"""
    accelerate launch --mixed_precision="fp16" train_text_to_image_lora.py \\
      --pretrained_model_name_or_path="{config['pretrained_model']}" \\
      --dataset_name="{dataset_path}" \\
      --dataloader_num_workers=8 \\
      --resolution={config['resolution']} \\
      --center_crop --random_flip \\
      --train_batch_size={config['batch_size']} \\
      --gradient_accumulation_steps={config['gradient_accumulation_steps']} \\
      --max_train_steps={config['max_train_steps']} \\
      --learning_rate={config['learning_rate']} \\
      --max_grad_norm=1 \\
      --lr_scheduler="{config['lr_scheduler']}" \\
      --lr_warmup_steps=500 \\
      --output_dir="{output_path}" \\
      --checkpointing_steps={config['checkpointing_steps']} \\
      --validation_prompt="manhwa style character portrait, korean webtoon art" \\
      --validation_steps={config['validation_steps']} \\
      --seed=1337 \\
      --rank={config['lora_rank']} \\
      --use_8bit_adam \\
      --mixed_precision="{config['mixed_precision']}" \\
      --gradient_checkpointing \\
      --enable_xformers_memory_efficient_attention
    """
    
    print("Training command:")
    print(cmd)
    
    return cmd

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True, help="Path to manhwa dataset")
    parser.add_argument("--output", default="/models/lora/manhwa", help="Output directory")
    parser.add_argument("--prepare-only", action="store_true", help="Only prepare dataset")
    
    args = parser.parse_args()
    
    if args.prepare_only:
        prepare_dataset(args.dataset, args.dataset)
    else:
        prepare_dataset(args.dataset, args.dataset)
        train_cmd = train_manhwa_lora(args.dataset, args.output)
        
        print("\n🚀 Ready to train! Run this command:")
        print(train_cmd)