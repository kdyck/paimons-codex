#!/bin/bash

echo "🎭 Complete LoRA Training Setup - Paimon's Codex"
echo "=============================================="
echo ""

# Configuration
ASSETS_DIR="$(pwd)/assets"
LORA_DIR="$(pwd)/lora-training"
UNIFIED_DIR="$(pwd)/training-data"

# Check if assets folder exists
if [ ! -d "$ASSETS_DIR" ]; then
    echo "❌ Assets folder not found at $ASSETS_DIR"
    echo ""
    echo "📋 Please create an assets folder with your manhwa content:"
    echo "mkdir -p assets"
    echo "# Copy your images to assets/"
    exit 1
fi

# Count total images
TOTAL_IMAGES=$(find "$ASSETS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l)

if [ "$TOTAL_IMAGES" -eq 0 ]; then
    echo "❌ No images found in assets folder"
    echo "💡 Add .jpg, .png, .jpeg, or .webp files to the assets folder"
    exit 1
fi

echo "📸 Found $TOTAL_IMAGES images in assets folder"
echo ""

# Analyze character content
echo "🔍 Analyzing content for training strategies..."

# Detect character files
CHARACTER_FILES=$(find "$ASSETS_DIR" -type f \( -iname "*character*" -o -iname "*hero*" -o -iname "*villain*" -o -iname "*main*" \) \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l)

# Detect cover art files  
COVER_FILES=$(find "$ASSETS_DIR" -type f \( -iname "*cover*" -o -iname "*title*" -o -iname "*poster*" \) \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l)

# Extract character names from filenames
CHARACTERS=$(find "$ASSETS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -printf "%f\n" | \
    grep -iE "(main_character|hero|villain|character)" | \
    sed -E 's/[_-][0-9]+\.(jpg|jpeg|png|webp)//gi' | \
    sed -E 's/\.(jpg|jpeg|png|webp)//gi' | \
    sort | uniq)

echo "📊 Content Analysis:"
echo "   📸 Total images: $TOTAL_IMAGES"
echo "   👤 Character-named files: $CHARACTER_FILES"
echo "   📚 Cover art files: $COVER_FILES"

if [ -n "$CHARACTERS" ]; then
    echo "   🎭 Detected characters:"
    echo "$CHARACTERS" | while read -r char; do
        if [ -n "$char" ]; then
            char_count=$(find "$ASSETS_DIR" -iname "*${char}*" \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l)
            echo "      • $char: $char_count images"
        fi
    done
fi

echo ""
echo "🎯 Recommended Training Strategy:"
echo ""

# Determine best training approach
if [ "$CHARACTER_FILES" -ge 15 ] && [ -n "$CHARACTERS" ] && [ "$COVER_FILES" -ge 10 ]; then
    STRATEGY="COMPLETE_LORA"
    echo "✅ COMPLETE LoRA STRATEGY (Best Quality)"
    echo "   🎭 Character LoRAs: Train separate LoRA for each character"
    echo "   🎨 Style LoRA: Train one LoRA for your art style"
    echo "   📚 Cover LoRA: Train specialized LoRA for cover art"
    echo "   💡 Maximum quality and flexibility"
elif [ "$CHARACTER_FILES" -ge 15 ] && [ -n "$CHARACTERS" ]; then
    STRATEGY="MULTI_LORA"
    echo "✅ MULTIPLE LoRA STRATEGY (Recommended)"
    echo "   🎭 Character LoRAs: Train separate LoRA for each character"
    echo "   🎨 Style LoRA: Train one LoRA for your art style"
    echo "   💡 Best quality and flexibility"
elif [ "$TOTAL_IMAGES" -ge 20 ]; then
    STRATEGY="UNIFIED_LORA"
    echo "✅ UNIFIED LoRA STRATEGY (Simple & Effective)"
    echo "   🎨 Single LoRA: All images for manhwa style training"
    echo "   💡 Easiest to use, good results"
else
    STRATEGY="LIMITED"
    echo "⚠️  LIMITED DATA STRATEGY"
    echo "   📝 Need more images for optimal results"
    echo "   💡 Consider adding more character references"
fi

echo ""
if [ "$COVER_FILES" -ge 5 ]; then
    read -p "🚀 Choose setup type: [1] Multiple LoRAs (character+style+cover), [2] Unified LoRA, [3] Both, [4] Cover only: " choice
else
    read -p "🚀 Choose setup type: [1] Multiple LoRAs (character+style), [2] Unified LoRA, [3] Both: " choice
fi

case $choice in
    1|"")
        if [ "$COVER_FILES" -ge 5 ]; then
            echo "Setting up Multiple LoRA structure (with cover art)..."
            setup_type="MULTI_WITH_COVERS"
        else
            echo "Setting up Multiple LoRA structure..."
            setup_type="MULTI"
        fi
        ;;
    2)
        echo "Setting up Unified LoRA structure..."
        setup_type="UNIFIED"
        ;;
    3)
        echo "Setting up both structures..."
        if [ "$COVER_FILES" -ge 5 ]; then
            setup_type="BOTH_WITH_COVERS"
        else
            setup_type="BOTH"
        fi
        ;;
    4)
        if [ "$COVER_FILES" -ge 5 ]; then
            echo "Setting up Cover Art LoRA only..."
            setup_type="COVER_ONLY"
        else
            echo "Not enough cover art files. Setting up unified structure..."
            setup_type="UNIFIED"
        fi
        ;;
    *)
        echo "Invalid choice. Setting up unified structure..."
        setup_type="UNIFIED"
        ;;
esac

echo ""

# Function: Setup Cover Art LoRA structure  
setup_cover_lora() {
    echo "📚 Setting up Cover Art LoRA structure..."
    
    # Create cover art directories by genre
    covers_dir="$LORA_DIR/covers"
    mkdir -p "$covers_dir"/{romance,action,fantasy,drama,comedy,thriller,general}/{images,captions}
    
    echo "📋 Organizing cover art data..."
    
    # Process cover art files
    total_covers=0
    while IFS= read -r -d '' cover_img; do
        filename=$(basename "$cover_img")
        ext="${filename##*.}"
        
        # Determine genre from filename
        genre="general"
        if [[ "$filename" == *"romance"* ]]; then genre="romance"
        elif [[ "$filename" == *"action"* ]]; then genre="action"
        elif [[ "$filename" == *"fantasy"* ]]; then genre="fantasy" 
        elif [[ "$filename" == *"drama"* ]]; then genre="drama"
        elif [[ "$filename" == *"comedy"* ]]; then genre="comedy"
        elif [[ "$filename" == *"thriller"* ]]; then genre="thriller"
        fi
        
        # Copy to appropriate genre directory
        counter=$(find "$covers_dir/$genre/images" -type f 2>/dev/null | wc -l)
        counter=$((counter + 1))
        new_name="${genre}_cover_$(printf "%03d" $counter).${ext}"
        
        cp "$cover_img" "$covers_dir/$genre/images/$new_name"
        
        # Create genre-specific caption
        case $genre in
            "romance")
                caption="manhwa cover art, romantic manhwa, beautiful character portrait, soft romantic lighting, elegant composition, warm color palette, professional book cover design, clean typography space"
                ;;
            "action") 
                caption="manhwa cover art, action manhwa, dynamic character pose, dramatic lighting, bold composition, intense atmosphere, professional book cover design, clean typography space"
                ;;
            "fantasy")
                caption="manhwa cover art, fantasy manhwa, magical character design, mystical atmosphere, ethereal lighting, fantastical elements, professional book cover design, clean typography space"
                ;;
            "drama")
                caption="manhwa cover art, drama manhwa, emotional character portrait, sophisticated composition, mature atmosphere, compelling expression, professional book cover design, clean typography space"
                ;;
            "comedy")
                caption="manhwa cover art, comedy manhwa, cheerful character design, bright colors, playful composition, lighthearted mood, professional book cover design, clean typography space"
                ;;
            "thriller")
                caption="manhwa cover art, thriller manhwa, mysterious character portrait, dark atmosphere, dramatic shadows, suspenseful mood, professional book cover design, clean typography space"
                ;;
            *)
                caption="manhwa cover art, professional book cover design, character portrait, dramatic composition, clean typography space, title placement area, commercial illustration quality"
                ;;
        esac
        
        echo "$caption" > "$covers_dir/$genre/captions/${genre}_cover_$(printf "%03d" $counter).txt"
        total_covers=$((total_covers + 1))
    done < <(find "$ASSETS_DIR" -type f \( -iname "*cover*" -o -iname "*title*" -o -iname "*poster*" \) \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0)
    
    # Count covers by genre
    for genre in romance action fantasy drama comedy thriller general; do
        genre_count=$(find "$covers_dir/$genre/images" -type f 2>/dev/null | wc -l)
        if [ "$genre_count" -gt 0 ]; then
            echo "   📚 $genre: $genre_count covers"
        fi
    done
    
    # Count total covers after processing
    total_processed=0
    for genre in romance action fantasy drama comedy thriller general; do
        genre_count=$(find "$covers_dir/$genre/images" -type f 2>/dev/null | wc -l)
        total_processed=$((total_processed + genre_count))
    done
    
    # Create cover art training script
    if [ "$total_processed" -gt 0 ]; then
        echo "📝 Creating cover art training script..."
        cat > "train_cover_lora.sh" << EOF
#!/bin/bash
echo "📚 Training Manhwa Cover Art LoRA"
echo "📸 Total covers: $total_processed"
echo "⏱️  Estimated time: 2-3 hours"
echo ""

# Use the simple training approach like character training
podman exec -it paimons-sd python train_lora_simple.py \\
  --data_dir "/lora-training/covers/general" \\
  --output_dir "/nvme-models/lora/manhwa-covers" \\
  --resolution 832 \\
  --batch_size 1 \\
  --max_steps $((total_processed * 50)) \\
  --learning_rate 8e-5 \\
  --validation_prompt "manhwa cover art, professional book cover design"

echo ""
echo "✅ Cover LoRA training complete!"
echo "💡 Usage examples:"
echo "  'manhwa cover art, beautiful female character'"
echo "  'manhwa cover art, dynamic warrior pose'"
echo "  'manhwa cover art, mystical character design'"
EOF
        chmod +x "train_cover_lora.sh"
        echo "   ✅ Created: train_cover_lora.sh ($total_processed covers)"
    else
        echo "   ⚠️ No cover art found - skipping training script"
    fi
    
    echo "✅ Cover art dataset ready: $total_processed total covers"
}

# Function: Setup Multiple LoRA structure
setup_multiple_loras() {
    echo "🎭 Setting up Multiple LoRA structure..."
    
    # Create directory structure
    mkdir -p "$LORA_DIR"/{characters,style/manhwa}/{images,captions}
    
    # Setup characters
    echo "📋 Organizing character data..."
    
    if [ -n "$CHARACTERS" ]; then
        echo "$CHARACTERS" | while read -r char; do
            if [ -n "$char" ] && [ "$char" != "character" ]; then
                char_clean=$(echo "$char" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_]//g')
                char_count=$(find "$ASSETS_DIR" -iname "*${char}*" \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l)
                
                if [ "$char_count" -ge 3 ]; then
                    echo "   👤 Setting up $char_clean ($char_count images)..."
                    
                    # Create character directory
                    char_dir="$LORA_DIR/characters/$char_clean"
                    mkdir -p "$char_dir"/{images,captions}
                    
                    # Copy character images
                    counter=1
                    find "$ASSETS_DIR" -iname "*${char}*" \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | while read -r img; do
                        filename=$(basename "$img")
                        ext="${filename##*.}"
                        new_name="${char_clean}_$(printf "%03d" $counter).${ext}"
                        
                        cp "$img" "$char_dir/images/$new_name"
                        
                        # Create caption
                        echo "solo, single subject, 1person, portrait, sks${char_clean} character, detailed face, consistent character design" > "$char_dir/captions/${char_clean}_$(printf "%03d" $counter).txt"
                        
                        counter=$((counter + 1))
                    done
                    
                    echo "      ✅ Character dataset ready: $char_dir/"
                fi
            fi
        done
    else
        echo "   ℹ️  No character-specific files detected"
        echo "   💡 Rename files like 'main_character_01.jpg' for auto-detection"
    fi
    
    # Setup style data
    echo ""
    echo "🎨 Setting up style data..."
    style_dir="$LORA_DIR/style/manhwa"
    
    # Copy style images (use all images + any non-character specific ones)
    counter=1
    find "$ASSETS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | head -50 | while read -r img; do
        filename=$(basename "$img")
        ext="${filename##*.}"
        new_name="style_$(printf "%03d" $counter).${ext}"
        
        cp "$img" "$style_dir/images/$new_name"
        
        # Create style caption
        if [[ "$filename" == *"page"* ]] || [[ "$filename" == *"pg"* ]]; then
            caption="sksmanhwastyle, manhwa page layout, webtoon style, professional composition, digital art"
        elif [[ "$filename" == *"panel"* ]]; then
            caption="sksmanhwastyle, manhwa panel style, comic layout, sequential art, clean line art"
        else
            caption="sksmanhwastyle, manhwa art style, korean webtoon style, digital art, clean lines, professional illustration"
        fi
        
        echo "$caption" > "$style_dir/captions/style_$(printf "%03d" $counter).txt"
        
        counter=$((counter + 1))
    done
    
    style_count=$(find "$style_dir/images" -type f | wc -l)
    echo "   ✅ Style dataset ready: $style_count images"
    
    # Create training scripts
    echo ""
    echo "📝 Creating training scripts..."
    
    # Character training scripts
    if [ -d "$LORA_DIR/characters" ]; then
        for char_dir in "$LORA_DIR/characters"/*; do
            if [ -d "$char_dir" ]; then
                char_name=$(basename "$char_dir")
                img_count=$(find "$char_dir/images" -type f | wc -l)
                
                if [ "$img_count" -gt 0 ]; then
                    script_file="train_${char_name}_lora.sh"
                    cat > "$script_file" << EOF
#!/bin/bash
echo "🎭 Training Character LoRA: $char_name"
echo "📸 Images: $img_count"
echo "⏱️  Estimated time: 30-60 minutes"
echo ""

podman exec -it paimons-sd python train_lora_simple.py \\
  --data_dir "/lora-training/characters/$char_name" \\
  --output_dir "/models/lora/character_$char_name" \\
  --resolution 512 \\
  --batch_size 1 \\
  --max_steps $((img_count * 50)) \\
  --learning_rate 5e-5

echo ""
echo "✅ Character LoRA training complete!"
echo "💡 Use in prompts: 'sks${char_name} character [your prompt]'"
EOF
                    chmod +x "$script_file"
                    echo "   ✅ Created: $script_file"
                fi
            fi
        done
    fi
    
    # Style training script
    if [ "$style_count" -gt 0 ]; then
        cat > "train_manhwa_style_lora.sh" << EOF
#!/bin/bash
echo "🎨 Training Manhwa Style LoRA"
echo "📸 Images: $style_count"
echo "⏱️  Estimated time: 1-2 hours"
echo ""

podman exec -it paimons-sd python train_lora_simple.py \\
  --data_dir "/lora-training/style/manhwa" \\
  --output_dir "/models/lora/style_manhwa" \\
  --resolution 768 \\
  --batch_size 2 \\
  --max_steps $((style_count * 30)) \\
  --learning_rate 1e-4

echo ""
echo "✅ Style LoRA training complete!"
echo "💡 Use in prompts: '[your prompt], sksmanhwastyle'"
EOF
        chmod +x "train_manhwa_style_lora.sh"
        echo "   ✅ Created: train_manhwa_style_lora.sh"
    fi
}

# Function: Setup Unified LoRA structure
setup_unified_lora() {
    echo "🎨 Setting up Unified LoRA structure..."
    
    # Create unified training directory
    unified_dir="$UNIFIED_DIR/manhwa"
    mkdir -p "$unified_dir"/{images,captions}
    
    echo "📋 Processing images for unified training..."
    
    # Process all images including covers
    counter=1
    processed=0
    character_count=0
    cover_count=0
    page_count=0
    other_count=0
    
    # Use a different approach to avoid subshell variable issues
    while IFS= read -r -d '' img_path; do
        if [ $counter -le 100 ]; then  # Limit to prevent overflow
            filename=$(basename "$img_path")
            ext="${filename##*.}"
            
            # Determine image type for better captions and tracking
            if [[ "$filename" == *"character"* ]] || [[ "$filename" == *"hero"* ]] || [[ "$filename" == *"villain"* ]]; then
                caption="manhwa character art, korean webtoon style, detailed character design, digital art, clean lines, character portrait"
                type="character"
                character_count=$((character_count + 1))
            elif [[ "$filename" == *"cover"* ]] || [[ "$filename" == *"title"* ]] || [[ "$filename" == *"poster"* ]]; then
                caption="manhwa cover art, korean webtoon style, dramatic composition, title page artwork, digital art, professional illustration, book cover design"
                type="cover"
                cover_count=$((cover_count + 1))
            elif [[ "$filename" == *"page"* ]] || [[ "$filename" == *"pg"* ]]; then
                caption="manhwa page art, korean webtoon style, sequential art, panel layout, digital art, professional illustration"
                type="page"
                page_count=$((page_count + 1))
            else
                caption="manhwa art style, korean webtoon style, digital art, clean lines, professional illustration"
                type="general"
                other_count=$((other_count + 1))
            fi
            
            # Copy and create caption
            new_name="manhwa_$(printf "%03d" $counter).${ext}"
            cp "$img_path" "$unified_dir/images/$new_name"
            echo "$caption" > "$unified_dir/captions/manhwa_$(printf "%03d" $counter).txt"
            
            processed=$((processed + 1))
            if [ $((processed % 10)) -eq 0 ]; then
                echo "   Processed $processed images..."
            fi
        fi
        counter=$((counter + 1))
    done < <(find "$ASSETS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0)
    
    final_count=$(find "$unified_dir/images" -type f | wc -l)
    echo "✅ Processed $final_count training images"
    
    # Show breakdown of content types
    echo ""
    echo "📊 Content breakdown for unified training:"
    echo "   👤 Characters: $character_count images"
    echo "   📚 Covers: $cover_count images" 
    echo "   📖 Pages: $page_count images"
    echo "   🎨 Other: $other_count images"
    echo "   📸 Total: $final_count images"
    
    # Create enhanced training config
    cat > "$unified_dir/training_config.json" << EOF
{
  "dataset_name": "manhwa_unified",
  "total_images": $final_count,
  "content_breakdown": {
    "characters": $character_count,
    "covers": $cover_count,
    "pages": $page_count,
    "other": $other_count
  },
  "resolution": 768,
  "batch_size": 2,
  "max_steps": $((final_count * 25)),
  "learning_rate": 1e-4,
  "description": "Unified manhwa style LoRA training dataset including characters, covers, and pages"
}
EOF
    
    # Create unified training script
    cat > "train_unified_manhwa_lora.sh" << EOF
#!/bin/bash
echo "🎨 Training Unified Manhwa LoRA (with covers)"
echo "📸 Total images: $final_count"
echo "👤 Characters: $character_count | 📚 Covers: $cover_count | 📖 Pages: $page_count | 🎨 Other: $other_count"
echo "⏱️  Estimated time: 2-4 hours"
echo ""

podman exec -it paimons-sd python train_lora_simple.py \\
  --data_dir "/training-data/manhwa" \\
  --output_dir "/models/lora/manhwa_unified" \\
  --resolution 768 \\
  --batch_size 2 \\
  --max_steps $((final_count * 25)) \\
  --learning_rate 1e-4

echo ""
echo "✅ Unified LoRA training complete!"
echo "💡 Use in prompts:"
echo "   Characters: '[character description], manhwa style'"
echo "   Covers: 'manhwa cover art, [description]'"
echo "   General: '[your prompt], manhwa style'"
EOF
    chmod +x "train_unified_manhwa_lora.sh"
    echo "   ✅ Created: train_unified_manhwa_lora.sh"
    
    echo ""
    echo "📊 Unified Training Summary:"
    echo "   • Training images: $final_count"
    echo "   • Location: $unified_dir"
    echo "   • Config: $unified_dir/training_config.json"
}

# Execute based on choice
case $setup_type in
    "MULTI")
        setup_multiple_loras
        ;;
    "MULTI_WITH_COVERS")
        setup_multiple_loras
        echo ""
        echo "=" | head -c 50; echo ""
        setup_cover_lora
        ;;
    "UNIFIED")
        setup_unified_lora
        ;;
    "BOTH")
        setup_multiple_loras
        echo ""
        echo "=" | head -c 50; echo ""
        setup_unified_lora
        ;;
    "BOTH_WITH_COVERS")
        setup_multiple_loras
        echo ""
        echo "=" | head -c 30; echo " COVER ART "; echo "=" | head -c 30; echo ""
        setup_cover_lora
        echo ""
        echo "=" | head -c 30; echo " UNIFIED "; echo "=" | head -c 30; echo ""
        setup_unified_lora
        ;;
    "COVER_ONLY")
        setup_cover_lora
        ;;
esac

echo ""
echo "🎉 LoRA Setup Complete!"
echo ""

# Final summary
echo "📋 FINAL SUMMARY:"
echo ""

if [[ "$setup_type" == *"MULTI"* ]]; then
    echo "🎭 MULTIPLE LoRAs:"
    char_count=$(find "$LORA_DIR/characters" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    style_images=$(find "$LORA_DIR/style" -name "*.jpg" -o -name "*.png" 2>/dev/null | wc -l)
    
    echo "   Characters ready: $char_count"
    if [ -d "$LORA_DIR/characters" ]; then
        for char_dir in "$LORA_DIR/characters"/*; do
            if [ -d "$char_dir" ]; then
                char_name=$(basename "$char_dir")
                char_img_count=$(find "$char_dir/images" -type f 2>/dev/null | wc -l)
                echo "      • $char_name: $char_img_count images"
            fi
        done
    fi
    echo "   Style images: $style_images"
    echo ""
fi

if [[ "$setup_type" == *"COVER"* ]]; then
    echo "📚 COVER ART LoRA:"
    cover_total=$(find "$LORA_DIR/covers" -name "*.jpg" -o -name "*.png" 2>/dev/null | wc -l)
    echo "   Total covers: $cover_total"
    
    if [ -d "$LORA_DIR/covers" ]; then
        for genre_dir in "$LORA_DIR/covers"/*; do
            if [ -d "$genre_dir" ]; then
                genre_name=$(basename "$genre_dir")
                genre_count=$(find "$genre_dir/images" -type f 2>/dev/null | wc -l)
                if [ "$genre_count" -gt 0 ]; then
                    echo "      • $genre_name: $genre_count covers"
                fi
            fi
        done
    fi
    echo ""
fi

if [ "$setup_type" = "UNIFIED" ] || [ "$setup_type" = "BOTH" ] || [ "$setup_type" = "BOTH_WITH_COVERS" ]; then
    echo "🎨 UNIFIED LoRA (includes covers):"
    unified_images=$(find "$UNIFIED_DIR/manhwa/images" -type f 2>/dev/null | wc -l)
    echo "   Training images: $unified_images"
    echo "   Location: $UNIFIED_DIR/manhwa"
    if [ -f "$UNIFIED_DIR/manhwa/training_config.json" ]; then
        echo "   Content: Characters + Covers + Pages + General art"
    fi
    echo ""
fi

echo "🚀 NEXT STEPS - HOW TO RUN TRAINING:"
echo ""

if [[ "$setup_type" == *"MULTI"* ]]; then
    echo "🎭 MULTIPLE LoRA TRAINING:"
    echo ""
    echo "Step 1: Train your main character first (recommended):"
    if [ -f "train_main_character_lora.sh" ]; then
        echo "   ./train_main_character_lora.sh"
    else
        echo "   ./train_[character]_lora.sh  # Replace [character] with actual name"
    fi
    echo ""
    echo "Step 2: Train your art style:"
    echo "   ./train_manhwa_style_lora.sh"
    echo ""
    if [[ "$setup_type" == *"COVER"* ]] && [ -f "train_cover_lora.sh" ]; then
        echo "Step 3: Train cover art (new!):"
        echo "   ./train_cover_lora.sh"
        echo ""
    fi
    echo "Step $([ "$setup_type" == *"COVER"* ] && echo "4" || echo "3"): Train other characters (optional):"
    ls train_*_lora.sh 2>/dev/null | grep -v -E "(manhwa_style|cover)" | head -3 | while read script; do
        echo "   ./$script"
    done
    echo ""
    echo "💡 Usage after training:"
    if [[ "$setup_type" == *"COVER"* ]]; then
        echo "   Characters: 'sksmain_character character walking in garden, sksmanhwastyle'"
        echo "   Covers: 'romantic manhwa cover art, beautiful character portrait'"
    else
        echo "   'sksmain_character character walking in garden, sksmanhwastyle'"
    fi
    echo ""
fi

if [[ "$setup_type" == "COVER_ONLY" ]]; then
    echo "📚 COVER ART LoRA TRAINING:"
    echo ""
    echo "Step 1: Train cover art LoRA:"
    echo "   ./train_cover_lora.sh"
    echo ""
    echo "💡 Usage after training:"
    echo "   'romantic manhwa cover art, beautiful character portrait'"
    echo "   'action manhwa cover art, dynamic warrior stance'"
    echo "   'fantasy manhwa cover art, mystical character design'"
    echo ""
fi

if [ "$setup_type" = "UNIFIED" ] || [ "$setup_type" = "BOTH" ] || [ "$setup_type" = "BOTH_WITH_COVERS" ]; then
    echo "🎨 UNIFIED LoRA TRAINING (includes covers):"
    echo ""
    echo "Step 1: Start the unified training:"
    echo "   ./train_unified_manhwa_lora.sh"
    echo ""
    echo "💡 Usage after training:"
    echo "   Characters: 'beautiful character portrait, manhwa style'"
    echo "   Covers: 'manhwa cover art, romantic character design'"
    echo "   General: 'action scene with warrior, manhwa style'"
    echo ""
fi

echo "🔧 MONITORING & TROUBLESHOOTING:"
echo ""
echo "• Monitor GPU usage:"
echo "  podman exec -it paimons-sd nvidia-smi"
echo ""
echo "• Watch training progress:"
echo "  podman logs -f paimons-sd"
echo ""
echo "• Check training output:"
echo "  podman exec -it paimons-sd ls -la /models/lora/"
echo ""
echo "• If training stops/fails:"
echo "  1. Check GPU memory: nvidia-smi"
echo "  2. Restart container: podman restart paimons-sd" 
echo "  3. Resume training from last checkpoint"
echo ""

echo "⏰ ESTIMATED TRAINING TIMES (RTX 3090):"
if [ "$setup_type" = "MULTI" ] || [ "$setup_type" = "BOTH" ]; then
    echo "• Character LoRAs: 30-60 minutes each"
    echo "• Style LoRA: 1-2 hours"
    echo "• Total (all characters + style): 3-5 hours"
fi
if [ "$setup_type" = "UNIFIED" ] || [ "$setup_type" = "BOTH" ]; then
    echo "• Unified LoRA: 2-4 hours"
fi
echo ""

echo "✅ QUICK START RECOMMENDATION:"
if [ "$setup_type" = "MULTI" ] || [ "$setup_type" = "BOTH" ]; then
    echo "1. Start with: ./train_main_character_lora.sh"
    echo "2. While that trains, monitor with: podman logs -f paimons-sd"
    echo "3. After completion, test the character LoRA in your API"
    echo "4. Then train style: ./train_manhwa_style_lora.sh"
elif [ "$setup_type" = "UNIFIED" ] || [ "$setup_type" = "BOTH_WITH_COVERS" ]; then
    echo "1. Start with: ./train_unified_manhwa_lora.sh (includes covers!)" 
    echo "2. Monitor with: podman logs -f paimons-sd"
    echo "3. Training will take 2-4 hours - be patient!"
    echo "4. Test results for both characters AND covers in your API"
fi