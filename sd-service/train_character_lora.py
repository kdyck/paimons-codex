#!/usr/bin/env python3
"""
Character-specific LoRA training for consistent character identity
Lightweight approach focusing on face, hair, outfit consistency
"""

import os
import json
import argparse
from pathlib import Path
from typing import Dict, List

def create_character_dataset(character_name: str, images_dir: str, output_dir: str):
    """
    Create character-specific dataset for LoRA training
    
    Expected input structure:
    images_dir/
    ├── character_name_001.jpg
    ├── character_name_002.jpg
    └── ...
    """
    
    char_dir = Path(output_dir) / f"character_{character_name.lower()}"
    char_dir.mkdir(parents=True, exist_ok=True)
    
    images_out = char_dir / "images"
    captions_out = char_dir / "captions"
    images_out.mkdir(exist_ok=True)
    captions_out.mkdir(exist_ok=True)
    
    # Find character images
    image_files = []
    images_path = Path(images_dir)
    
    # If images_dir points to a character folder with images/ subfolder
    if (images_path / "images").exists():
        images_path = images_path / "images"
    
    # Find all image files in the directory
    for ext in ["*.jpg", "*.jpeg", "*.png", "*.webp"]:
        image_files.extend(images_path.glob(ext))
    
    # Filter for character-specific files if needed
    if not image_files:
        # Fallback: search parent directory
        parent_path = Path(images_dir).parent if images_path.name == "images" else Path(images_dir)
        for ext in ["*.jpg", "*.jpeg", "*.png", "*.webp"]:
            all_files = parent_path.glob(ext)
            character_files = [f for f in all_files if character_name.lower() in f.name.lower()]
            image_files.extend(character_files)
    
    if len(image_files) < 5:
        print(f"⚠️  Only {len(image_files)} images found for {character_name}")
        print(f"   Recommended minimum: 5-10 images for character consistency")
    
    # Character-specific activation token
    activation_token = f"sks{character_name.lower()}"
    
    copied_count = 0
    for img_path in image_files:
        # Copy image
        new_name = f"{character_name.lower()}_{copied_count:03d}{img_path.suffix}"
        dest_img = images_out / new_name
        
        import shutil
        shutil.copy2(img_path, dest_img)
        
        # Create character-specific caption
        caption_file = captions_out / f"{character_name.lower()}_{copied_count:03d}.txt"
        
        # Character LoRA caption focuses on identity, not style
        caption = (
            f"solo, single subject, 1person, portrait, {activation_token} character, "
            f"detailed face, consistent character design, character reference sheet"
        )
        
        with open(caption_file, 'w') as f:
            f.write(caption)
        
        copied_count += 1
    
    # Create character config
    char_config = {
        "character_name": character_name,
        "activation_token": activation_token,
        "dataset_path": str(char_dir),
        "training_type": "character_lora",
        "focus": ["face", "hair", "outfit", "identity"],
        "recommended_settings": {
            "resolution": 512,  # Lower res for character consistency
            "batch_size": 1,    # Small batch for character details
            "learning_rate": 5e-5,  # Lower LR for character features
            "lora_rank": 32,    # Lightweight LoRA
            "max_train_steps": copied_count * 100,  # 100 steps per image
            "network_alpha": 16,
            "clip_skip": 2,
            "mixed_precision": "fp16"
        },
        "usage_example": f"'{activation_token} character, [your scene prompt]'"
    }
    
    with open(char_dir / "character_config.json", 'w') as f:
        json.dump(char_config, f, indent=2)
    
    print(f"✅ Character dataset created for {character_name}")
    print(f"   📸 Images: {copied_count}")
    print(f"   🏷️  Activation token: {activation_token}")
    print(f"   📁 Location: {char_dir}")
    
    return char_dir, activation_token

def generate_character_training_command(config_path: str):
    """Generate optimized training command for character LoRA"""
    
    with open(config_path) as f:
        config = json.load(f)
    
    settings = config['recommended_settings']
    dataset_path = config['dataset_path']
    char_name = config['character_name']
    
    # Character LoRA training command
    cmd = f"""
accelerate launch train_text_to_image_lora.py \\
  --pretrained_model_name_or_path="runwayml/stable-diffusion-v1-5" \\
  --train_data_dir="{dataset_path}/images" \\
  --caption_column="text" \\
  --resolution={settings['resolution']} \\
  --center_crop --random_flip \\
  --train_batch_size={settings['batch_size']} \\
  --gradient_accumulation_steps=4 \\
  --max_train_steps={settings['max_train_steps']} \\
  --learning_rate={settings['learning_rate']} \\
  --max_grad_norm=1 \\
  --lr_scheduler="cosine_with_restarts" \\
  --lr_warmup_steps=100 \\
  --output_dir="/models/lora/character_{char_name.lower()}" \\
  --checkpointing_steps=200 \\
  --validation_prompt="{config['activation_token']} character portrait, detailed face" \\
  --validation_steps=100 \\
  --seed=1337 \\
  --rank={settings['lora_rank']} \\
  --network_alpha={settings['network_alpha']} \\
  --use_8bit_adam \\
  --mixed_precision="{settings['mixed_precision']}" \\
  --gradient_checkpointing \\
  --enable_xformers_memory_efficient_attention \\
  --caption_dropout_rate=0.1
"""
    
    return cmd.strip()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train character-specific LoRA")
    parser.add_argument("--character", required=True, help="Character name")
    parser.add_argument("--images-dir", required=True, help="Directory containing character images")
    parser.add_argument("--output-dir", default="./training-data/characters", help="Output directory")
    parser.add_argument("--train", action="store_true", help="Generate training command")
    
    args = parser.parse_args()
    
    print(f"🎭 Setting up character LoRA training for: {args.character}")
    
    # Create dataset
    char_dir, token = create_character_dataset(
        args.character,
        args.images_dir, 
        args.output_dir
    )
    
    if args.train:
        config_path = char_dir / "character_config.json"
        cmd = generate_character_training_command(config_path)
        
        print(f"\n🚀 Training command for {args.character}:")
        print(cmd)
        
        print(f"\n💡 Usage after training:")
        print(f"   Prompt: '{token} character walking in garden, manhwa style'")
        print(f"   Weight: 0.7-0.9 (character features)")
    else:
        print(f"\n📋 Next steps:")
        print(f"   1. Review dataset: ls {char_dir}/images/")
        print(f"   2. Start training: python train_character_lora.py --character {args.character} --images-dir {args.images_dir} --train")
        print(f"   3. Training time: ~30-60 minutes on RTX 3090")