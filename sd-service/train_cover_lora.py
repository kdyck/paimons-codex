#!/usr/bin/env python3
"""
LoRA Training Script for Manhwa Cover Art
Optimized for RTX 3090 24GB VRAM + NVMe SSD
"""

import os
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import argparse
from pathlib import Path
import json
import shutil

def setup_cover_lora_training():
    """Setup LoRA training environment for cover art"""
    
    # Cover art specific training configuration
    config = {
        "pretrained_model": "xyn-ai/anything-v4.0",
        "resolution": 832,  # Standard manhwa cover aspect ratio
        "batch_size": 1,    # Cover art is more complex, reduce batch size
        "gradient_accumulation_steps": 4,  # Compensate with more accumulation
        "learning_rate": 8e-5,  # Slightly lower for complex compositions
        "lr_scheduler": "cosine_with_restarts",
        "max_train_steps": 3000,  # More steps for complex cover layouts
        "checkpointing_steps": 500,
        "validation_steps": 300,
        "lora_rank": 128,   # Higher rank for complex cover compositions
        "mixed_precision": "fp16",
        "gradient_checkpointing": True,
        "use_8bit_adam": True,
        "enable_prior_preservation": True,  # Important for cover art quality
        "prior_loss_weight": 1.0,
        # Cover-specific settings
        "cover_focus_loss": True,
        "composition_weight": 1.5,
        "text_area_preservation": True,
    }
    
    return config

def prepare_cover_dataset(input_dir: str, output_dir: str):
    """
    Prepare manhwa cover art dataset for training
    
    Expected structure:
    input_dir/
    ├── covers/
    │   ├── romance/
    │   │   ├── images/
    │   │   │   ├── romance_cover_001.jpg
    │   │   └── captions/
    │   │       ├── romance_cover_001.txt
    │   ├── action/
    │   └── ...
    """
    
    covers_dir = Path(input_dir) / "covers"
    output_path = Path(output_dir)
    
    # Check if covers directory exists
    if not covers_dir.exists():
        print(f"❌ Covers directory not found: {covers_dir}")
        print("💡 Expected structure: /lora-training/covers/[genre]/images/")
        return {"total_covers": 0, "genres": {}}
    
    # Create consolidated dataset structure
    os.makedirs(output_path / "images", exist_ok=True)
    os.makedirs(output_path / "captions", exist_ok=True)
    
    total_covers = 0
    genre_counts = {}
    
    # Process each genre directory
    for genre_dir in covers_dir.iterdir():
        if not genre_dir.is_dir():
            continue
            
        genre = genre_dir.name
        genre_counts[genre] = 0
        
        print(f"📚 Processing {genre} covers...")
        
        # Look for images in the images subdirectory
        images_dir = genre_dir / "images"
        captions_dir = genre_dir / "captions"
        
        if not images_dir.exists():
            print(f"   ⚠️ No images directory found in {genre_dir}")
            continue
        
        for img_path in images_dir.glob("*"):
            if img_path.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.webp']:
                continue
                
            # Copy image to consolidated location
            new_img_name = f"{genre}_{total_covers:03d}{img_path.suffix}"
            shutil.copy2(img_path, output_path / "images" / new_img_name)
            
            # Handle caption
            caption_name = img_path.stem + '.txt'
            caption_path = captions_dir / caption_name
            new_caption_path = output_path / "captions" / f"{genre}_{total_covers:03d}.txt"
            
            if caption_path.exists():
                # Use existing caption and enhance it
                with open(caption_path, 'r') as f:
                    original_caption = f.read().strip()
                
                # Enhance caption for cover art training
                enhanced_caption = enhance_cover_caption(original_caption, genre, img_path.stem)
                
            else:
                # Generate cover-specific caption
                enhanced_caption = generate_cover_caption(genre, img_path.stem)
            
            with open(new_caption_path, 'w') as f:
                f.write(enhanced_caption)
            
            total_covers += 1
            genre_counts[genre] += 1
    
    # Create metadata file
    metadata = {
        "total_covers": total_covers,
        "genres": genre_counts,
        "training_config": {
            "focus": "manhwa cover art",
            "specialization": "composition, typography space, genre aesthetics",
            "aspect_ratio": "portrait (832x1216)",
        }
    }
    
    with open(output_path / "dataset_metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Cover dataset prepared:")
    print(f"   Total covers: {total_covers}")
    for genre, count in genre_counts.items():
        print(f"   {genre.capitalize()}: {count} covers")
    
    return metadata

def enhance_cover_caption(original_caption: str, genre: str, filename: str) -> str:
    """Enhance existing caption for cover art training"""
    
    # Genre-specific enhancements
    genre_styles = {
        "romance": "romantic atmosphere, soft lighting, elegant composition, warm colors, emotional expression",
        "action": "dynamic composition, bold colors, dramatic lighting, intense atmosphere, powerful stance", 
        "fantasy": "magical elements, mystical atmosphere, ethereal lighting, fantastical composition, otherworldly beauty",
        "drama": "dramatic composition, emotional depth, sophisticated lighting, mature atmosphere, compelling expression",
        "comedy": "bright colors, cheerful composition, playful atmosphere, expressive characters, lighthearted mood",
        "thriller": "dark atmosphere, mysterious composition, dramatic shadows, suspenseful mood, intense expression"
    }
    
    cover_elements = [
        "manhwa cover art",
        "korean webtoon cover",
        "professional book cover design",
        "clean typography space",
        "dramatic composition",
        "title placement area",
        "commercial illustration",
        "publishing quality"
    ]
    
    # Build enhanced caption
    enhanced = f"{original_caption}, {', '.join(cover_elements)}"
    
    if genre in genre_styles:
        enhanced += f", {genre_styles[genre]}"
    
    # Add composition hints
    enhanced += ", vertical composition, portrait orientation, cover layout, professional design"
    
    return enhanced

def generate_cover_caption(genre: str, filename: str) -> str:
    """Generate caption for cover art without existing caption"""
    
    base_caption = "manhwa cover art, korean webtoon cover, professional book cover design"
    
    genre_descriptions = {
        "romance": "romantic manhwa cover, beautiful character portrait, soft romantic lighting, elegant pose, warm color palette",
        "action": "action manhwa cover, dynamic character pose, dramatic lighting, bold composition, intense atmosphere",
        "fantasy": "fantasy manhwa cover, magical character design, mystical atmosphere, ethereal lighting, fantastical elements",
        "drama": "drama manhwa cover, emotional character portrait, sophisticated composition, mature atmosphere, compelling expression",
        "comedy": "comedy manhwa cover, cheerful character design, bright colors, playful composition, lighthearted mood",
        "thriller": "thriller manhwa cover, mysterious character portrait, dark atmosphere, dramatic shadows, suspenseful mood"
    }
    
    genre_desc = genre_descriptions.get(genre, "manhwa cover, character portrait, professional design")
    
    full_caption = f"{base_caption}, {genre_desc}, clean typography space, title placement area, commercial illustration quality, vertical composition, portrait orientation"
    
    return full_caption

def create_cover_training_config(output_path: str, metadata: dict):
    """Create training configuration file for cover art"""
    
    config = setup_cover_lora_training()
    
    # Add dataset-specific settings
    config.update({
        "dataset_path": output_path,
        "total_samples": metadata["total_covers"],
        "genres": list(metadata["genres"].keys()),
        "validation_prompts": [
            "romantic manhwa cover art, beautiful female character, soft lighting, elegant composition",
            "action manhwa cover art, powerful male character, dynamic pose, dramatic lighting", 
            "fantasy manhwa cover art, magical character with mystical elements, ethereal atmosphere",
            "drama manhwa cover art, emotional character portrait, sophisticated composition",
        ],
        "negative_prompts": [
            "text, lettering, words, title, logo, watermark, signature, blurry, low quality, bad anatomy"
        ]
    })
    
    config_path = Path(output_path) / "training_config.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"📋 Training config saved to: {config_path}")
    return config

def train_cover_lora(dataset_path: str, output_path: str = "/nvme-models/lora/manhwa-covers"):
    """Train LoRA for manhwa cover art"""
    
    config_path = Path(dataset_path) / "training_config.json"
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = json.load(f)
    else:
        config = setup_cover_lora_training()
    
    # Use NVMe SSD paths for optimal performance
    os.makedirs(output_path, exist_ok=True)
    
    print("🎨 Starting LoRA training for manhwa cover art...")
    print(f"📁 Dataset: {dataset_path}")
    print(f"💾 Output: {output_path}")
    print(f"🎯 Target: RTX 3090 24GB VRAM + NVMe SSD")
    print(f"📚 Total samples: {config.get('total_samples', 'unknown')}")
    print(f"🏷️  Genres: {', '.join(config.get('genres', []))}")
    
    # Enhanced training command for cover art
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
      --validation_prompt="manhwa cover art, beautiful character portrait, professional book cover design" \\
      --validation_epochs=5 \\
      --validation_steps={config['validation_steps']} \\
      --seed=1337 \\
      --rank={config['lora_rank']} \\
      --use_8bit_adam \\
      --mixed_precision="{config['mixed_precision']}" \\
      --gradient_checkpointing \\
      --enable_xformers_memory_efficient_attention \\
      --prior_generation_precision="fp16" \\
      --cache_dir="/nvme-models" \\
      --logging_dir="{output_path}/logs" \\
      --report_to="tensorboard"
    """
    
    print("\n🚀 Training command:")
    print(cmd)
    
    # Create validation script
    create_cover_validation_script(output_path, config)
    
    return cmd

def create_cover_validation_script(output_path: str, config: dict):
    """Create validation script for trained cover LoRA"""
    
    validation_script = f"""#!/usr/bin/env python3
# Manhwa Cover LoRA Validation Script

import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from pathlib import Path
import os

def test_cover_lora():
    print("🎨 Testing manhwa cover LoRA...")
    
    # Load base model
    pipe = StableDiffusionPipeline.from_pretrained(
        "{config['pretrained_model']}",
        torch_dtype=torch.float16,
        cache_dir="/nvme-models"
    )
    
    # Load trained LoRA
    pipe.load_lora_weights("{output_path}")
    pipe.to("cuda")
    
    # Test prompts for different genres
    test_prompts = {config['validation_prompts']}
    
    output_dir = Path("{output_path}/validation_outputs")
    output_dir.mkdir(exist_ok=True)
    
    for i, prompt in enumerate(test_prompts):
        print(f"Generating cover {{i+1}}: {{prompt[:50]}}...")
        
        image = pipe(
            prompt=prompt,
            negative_prompt="text, lettering, title, low quality, blurry",
            width=832,
            height=1216,
            num_inference_steps=25,
            guidance_scale=7.5,
            generator=torch.Generator("cuda").manual_seed(42)
        ).images[0]
        
        image.save(output_dir / f"cover_test_{{i+1:02d}}.png")
    
    print(f"✅ Validation complete! Check {{output_dir}}")

if __name__ == "__main__":
    test_cover_lora()
"""
    
    validation_path = Path(output_path) / "validate_cover_lora.py"
    with open(validation_path, 'w') as f:
        f.write(validation_script)
    
    os.chmod(validation_path, 0o755)
    print(f"📝 Validation script created: {validation_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train LoRA for manhwa cover art")
    parser.add_argument("--dataset", required=True, help="Path to cover art dataset")
    parser.add_argument("--output", default="/nvme-models/lora/manhwa-covers", help="Output directory")
    parser.add_argument("--prepare-only", action="store_true", help="Only prepare dataset")
    
    args = parser.parse_args()
    
    if args.prepare_only:
        metadata = prepare_cover_dataset(args.dataset, args.dataset + "_prepared")
        create_cover_training_config(args.dataset + "_prepared", metadata)
        print(f"✅ Dataset prepared at: {args.dataset}_prepared")
    else:
        # Prepare dataset
        prepared_path = args.dataset + "_prepared"
        metadata = prepare_cover_dataset(args.dataset, prepared_path)
        config = create_cover_training_config(prepared_path, metadata)
        
        # Generate training command
        train_cmd = train_cover_lora(prepared_path, args.output)
        
        print("\n🎯 Next steps:")
        print("1. Review the prepared dataset and config")
        print("2. Run the training command above")
        print("3. Use the validation script to test results")
        print(f"4. Find trained LoRA at: {args.output}")