podman # 🎭 LoRA Training Setup Guide - Paimon's Codex

Comprehensive guide for setting up Character + Style LoRA training with your manhwa content.

## 📁 Recommended Data Organization

### Option 1: Organized Structure (Best for Multiple LoRAs)
```
assets/
├── characters/
│   ├── hero/
│   │   ├── hero_portrait_01.jpg
│   │   ├── hero_fullbody_02.jpg
│   │   ├── hero_expression_03.jpg
│   │   ├── hero_battle_04.jpg
│   │   └── hero_casual_05.jpg          (5-15 images per character)
│   ├── villain/
│   │   ├── villain_portrait_01.jpg
│   │   ├── villain_angry_02.jpg
│   │   └── villain_power_03.jpg
│   └── sidekick/
│       ├── sidekick_happy_01.jpg
│       └── sidekick_worried_02.jpg
└── style/
    ├── panels/
    │   ├── action_panel_01.jpg
    │   ├── dialogue_panel_02.jpg
    │   └── dramatic_panel_03.jpg
    ├── pages/
    │   ├── chapter1_page01.jpg
    │   └── chapter2_page05.jpg
    └── scenes/
        ├── forest_background_01.jpg
        ├── city_scene_02.jpg
        └── interior_room_03.jpg       (20-50 style references total)
```

### Option 2: Simple Structure (Good for Unified LoRA)
```
assets/
├── main_character_01.jpg
├── main_character_02.jpg
├── hero_portrait_01.jpg
├── hero_battle_02.jpg
├── villain_evil_01.jpg
├── villain_power_02.jpg
├── scene_forest_01.jpg
├── panel_action_01.jpg
└── page_chapter1_01.jpg
```

## 🎯 Training Requirements

### Character LoRAs
- **Minimum**: 5 images per character
- **Recommended**: 8-15 images per character  
- **Focus**: Different poses, expressions, outfits of same character
- **Quality**: Clear face/features, good resolution (512px+)

### Style LoRA  
- **Minimum**: 20 diverse images
- **Recommended**: 30-50 images
- **Focus**: Panels, pages, scenes showing your art style
- **Quality**: Representative of your manhwa's visual style

### Unified LoRA
- **Minimum**: 20 total images
- **Recommended**: 50+ diverse images
- **Focus**: Mix of characters and style elements
- **Quality**: Consistent art style across all images

## 🚀 Complete Setup (New Method)

### 1. One-Command Setup
```bash
# Run the complete setup script
./scripts/setup-lora-complete.sh

# This will:
# - Analyze your assets/ folder
# - Recommend training strategy
# - Create organized datasets
# - Generate training scripts
# - Provide step-by-step instructions
```

### 2. Choose Your Training Strategy

**Option A: Multiple LoRAs (Best Quality)**
- Separate character LoRAs for each main character
- One style LoRA for your art style
- Best flexibility and character consistency

**Option B: Unified LoRA (Simplest)**
- Single LoRA combining all content
- Easiest to use and manage
- Good results with less complexity

**Option C: Both (Recommended)**
- Creates both structures for maximum flexibility

## 🎯 Training Commands

### Multiple LoRA Training
```bash
# 1. Train main character first
./train_main_character_lora.sh

# 2. Train your art style
./train_manhwa_style_lora.sh

# 3. Train other characters (optional)
./train_hero_lora.sh
./train_villain_lora.sh
```

### Unified LoRA Training
```bash
# Single command for unified training
./train_unified_manhwa_lora.sh
```

### Manual Training (Advanced)
```bash
# Character training
podman exec -it paimons-sd python train_lora_simple.py \
  --data_dir "/app/training-data/characters/character_main_character" \
  --output_dir "/models/lora/main_character" \
  --resolution 512 \
  --batch_size 1 \
  --max_steps 1150 \
  --learning_rate 5e-5

# Style training  
podman exec -it paimons-sd python train_lora_simple.py \
  --data_dir "/app/lora-training/style/manhwa" \
  --output_dir "/models/lora/style_manhwa" \
  --resolution 768 \
  --batch_size 2 \
  --max_steps 2000 \
  --learning_rate 1e-4
```

## 🔧 Monitoring & Troubleshooting

### Monitor Training Progress
```bash
# GPU usage
podman exec -it paimons-sd nvidia-smi

# Training logs
podman logs -f paimons-sd

# Check outputs
podman exec -it paimons-sd ls -la /models/lora/
```

### Common Issues & Solutions

**"Found 0 images for training"**
- Check data directory path in container
- Verify images are in `/app/training-data/` or `/app/lora-training/`
- Run setup script again if needed

**"RuntimeError: Input type and weight type should be the same"**
- Fixed in latest `train_lora_simple.py`
- Models now properly moved to GPU

**Training stops/crashes**
- Check GPU memory: `nvidia-smi`
- Reduce batch size or resolution
- Restart container: `podman restart paimons-sd`

**Poor quality results**
- Increase training steps (more epochs)
- Check image quality and consistency
- Adjust LoRA weights in generation (0.6-0.9)

## 🎨 Using Your Trained LoRAs

### Character + Style LoRAs
```python
# Multiple LoRA approach
prompt = "sksmain_character character walking in garden, sksmanhwastyle, detailed artwork"

# With explicit weights
prompt = "character portrait <lora:main_character:0.8> <lora:style_manhwa:0.6>"
```

### Unified LoRA
```python
# Unified approach
prompt = "beautiful character portrait, manhwa style, detailed artwork"

# With weight control
prompt = "character in forest <lora:manhwa_unified:0.7>"
```

### Integration with Image Generation API
```python
# In your image generation service
result = await image_service.generate_character_art(
    character_prompt="main character in battle pose",
    style="manhwa",
    lora="main_character",
    lora_scale=0.8
)
```

## 💡 Pro Tips

### Character Training
- **Variety**: Include different expressions, poses, outfits
- **Consistency**: Same character across all images  
- **Quality over Quantity**: 8 good images > 15 poor images
- **Naming**: Use descriptive filenames like `main_character_angry_01.jpg`

### Style Training
- **Diversity**: Mix of panels, pages, close-ups, wide shots
- **Representative**: Should show your typical art style
- **Consistency**: Similar line weight, coloring, shading across images
- **Clean Examples**: Avoid heavily watermarked or low-quality images

### Training Strategy
1. **Start with main character** (most important for consistency)
2. **Train unified LoRA** if you want simplicity
3. **Train style LoRA** for multiple character approach
4. **Add supporting characters** as needed

### Optimization for RTX 3090 (24GB VRAM)
- **Concurrent Training**: Can train while generating images
- **High Resolution**: 768px for style, 512px for characters
- **Batch Processing**: Train multiple characters per day
- **Fast Iteration**: Quick cycles for experimentation

## ⏰ Training Time Estimates

| Training Type | Images | Time (RTX 3090) | VRAM Usage |
|---------------|--------|-----------------|------------|
| Character LoRA | 5-15 | 30-60 minutes | ~8GB |
| Style LoRA | 20-50 | 1-2 hours | ~12GB |
| Unified LoRA | 50+ | 2-4 hours | ~10GB |

**Total Time for Complete Setup:**
- Multiple LoRAs: 3-5 hours (all characters + style)
- Unified LoRA: 2-4 hours (single training)

## 📋 Quick Start Checklist

- [ ] Add manhwa images to `assets/` folder
- [ ] Run `./scripts/setup-lora-complete.sh`
- [ ] Choose training strategy (Multiple/Unified/Both)
- [ ] Start with main character or unified training
- [ ] Monitor with `podman logs -f paimons-sd`
- [ ] Test trained LoRAs in image generation API
- [ ] Train additional characters if using multiple LoRA approach

---

🎮 **Ready to start?** Run `./scripts/setup-lora-complete.sh` and follow the guided setup! 🚀

For support, check the troubleshooting section or review container logs.