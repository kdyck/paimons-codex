#!/usr/bin/env python3
"""
Style-specific LoRA training for consistent panel/art style
Focuses on line weight, shading, color palette, composition
"""

import os
import json
import argparse
from pathlib import Path
from typing import Dict, List

def create_style_dataset(style_name: str, images_dir: str, output_dir: str):
    """
    Create style-specific dataset for LoRA training
    Focuses on artistic style rather than character identity
    """
    
    style_dir = Path(output_dir) / f"style_{style_name.lower()}"
    style_dir.mkdir(parents=True, exist_ok=True)
    
    images_out = style_dir / "images"
    captions_out = style_dir / "captions"
    images_out.mkdir(exist_ok=True)
    captions_out.mkdir(exist_ok=True)
    
    # Find style reference images (panels, pages, artwork)
    image_files = []
    for ext in ["*.jpg", "*.jpeg", "*.png", "*.webp"]:
        image_files.extend(Path(images_dir).glob(f"*panel*{ext}"))
        image_files.extend(Path(images_dir).glob(f"*page*{ext}"))
        image_files.extend(Path(images_dir).glob(f"*scene*{ext}"))
        image_files.extend(Path(images_dir).glob(f"*style*{ext}"))
        # Include all if no specific naming
        if not image_files:
            image_files.extend(Path(images_dir).glob(f"*{ext}"))
    
    if len(image_files) < 20:
        print(f"⚠️  Only {len(image_files)} images found for style training")
        print(f"   Recommended minimum: 20-50 diverse style examples")
    
    # Style-specific activation token
    activation_token = f"sks{style_name.lower()}style"
    
    copied_count = 0
    for img_path in image_files:
        # Copy image
        new_name = f"{style_name.lower()}_style_{copied_count:03d}{img_path.suffix}"
        dest_img = images_out / new_name
        
        import shutil
        shutil.copy2(img_path, dest_img)
        
        # Create style-specific caption
        caption_file = captions_out / f"{style_name.lower()}_style_{copied_count:03d}.txt"
        
        # Analyze image path for appropriate style description
        img_path_str = str(img_path).lower()
        
        if "character" in img_path_str or "portrait" in img_path_str:
            style_focus = "character art style, detailed line work, consistent shading"
        elif "scene" in img_path_str or "background" in img_path_str:
            style_focus = "scene composition style, environmental art, atmospheric rendering"
        elif "panel" in img_path_str:
            style_focus = "panel layout style, sequential art, comic composition"
        else:
            style_focus = "artistic style, consistent rendering, professional artwork"
        
        # Style LoRA caption focuses on artistic elements
        caption = (
            f"{activation_token}, manhwa style, korean webtoon art, "
            f"{style_focus}, clean line art, digital painting style, "
            f"consistent color palette, professional illustration"
        )
        
        with open(caption_file, 'w') as f:
            f.write(caption)
        
        copied_count += 1
    
    # Create style config
    style_config = {
        "style_name": style_name,
        "activation_token": activation_token,
        "dataset_path": str(style_dir),
        "training_type": "style_lora",
        "focus": ["line_weight", "shading", "color_palette", "composition"],
        "recommended_settings": {
            "resolution": 768,  # Higher res for style details
            "batch_size": 2,    # Larger batch for style consistency
            "learning_rate": 1e-4,  # Standard LR for style features
            "lora_rank": 64,    # Higher rank for style complexity
            "max_train_steps": min(copied_count * 50, 3000),  # 50 steps per image, max 3000
            "network_alpha": 32,
            "clip_skip": 2,
            "mixed_precision": "fp16",
            "noise_offset": 0.1  # Better for style training
        },
        "usage_example": f"'character portrait, {activation_token}, detailed artwork'"
    }
    
    with open(style_dir / "style_config.json", 'w') as f:
        json.dump(style_config, f, indent=2)
    
    print(f"✅ Style dataset created for {style_name}")
    print(f"   📸 Images: {copied_count}")
    print(f"   🎨 Activation token: {activation_token}")
    print(f"   📁 Location: {style_dir}")
    
    return style_dir, activation_token

def generate_style_training_command(config_path: str):
    """Generate optimized training command for style LoRA"""
    
    with open(config_path) as f:
        config = json.load(f)
    
    settings = config['recommended_settings']
    dataset_path = config['dataset_path']
    style_name = config['style_name']
    
    # Style LoRA training command
    cmd = f"""
accelerate launch train_text_to_image_lora.py \\
  --pretrained_model_name_or_path="runwayml/stable-diffusion-v1-5" \\
  --train_data_dir="{dataset_path}/images" \\
  --caption_column="text" \\
  --resolution={settings['resolution']} \\
  --center_crop --random_flip \\
  --train_batch_size={settings['batch_size']} \\
  --gradient_accumulation_steps=2 \\
  --max_train_steps={settings['max_train_steps']} \\
  --learning_rate={settings['learning_rate']} \\
  --max_grad_norm=1 \\
  --lr_scheduler="cosine" \\
  --lr_warmup_steps=300 \\
  --output_dir="/models/lora/style_{style_name.lower()}" \\
  --checkpointing_steps=500 \\
  --validation_prompt="{config['activation_token']}, character portrait, detailed artwork" \\
  --validation_steps=250 \\
  --seed=1337 \\
  --rank={settings['lora_rank']} \\
  --network_alpha={settings['network_alpha']} \\
  --use_8bit_adam \\
  --mixed_precision="{settings['mixed_precision']}" \\
  --gradient_checkpointing \\
  --enable_xformers_memory_efficient_attention \\
  --noise_offset={settings['noise_offset']} \\
  --caption_dropout_rate=0.05
"""
    
    return cmd.strip()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train style-specific LoRA")
    parser.add_argument("--style", required=True, help="Style name (e.g., 'manhwa', 'webtoon')")
    parser.add_argument("--images-dir", required=True, help="Directory containing style reference images")
    parser.add_argument("--output-dir", default="./training-data/styles", help="Output directory")
    parser.add_argument("--train", action="store_true", help="Generate training command")
    
    args = parser.parse_args()
    
    print(f"🎨 Setting up style LoRA training for: {args.style}")
    
    # Create dataset
    style_dir, token = create_style_dataset(
        args.style,
        args.images_dir, 
        args.output_dir
    )
    
    if args.train:
        config_path = style_dir / "style_config.json"
        cmd = generate_style_training_command(config_path)
        
        print(f"\n🚀 Training command for {args.style} style:")
        print(cmd)
        
        print(f"\n💡 Usage after training:")
        print(f"   Prompt: 'character portrait, {token}, detailed artwork'")
        print(f"   Weight: 0.5-0.8 (style influence)")
    else:
        print(f"\n📋 Next steps:")
        print(f"   1. Review dataset: ls {style_dir}/images/")
        print(f"   2. Start training: python train_style_lora.py --style {args.style} --images-dir {args.images_dir} --train")
        print(f"   3. Training time: ~1-2 hours on RTX 3090")