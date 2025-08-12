#!/usr/bin/env python3
"""
Simple LoRA training script using installed diffusers
Optimized for RTX 3090 24GB VRAM
"""

import os
import torch
import argparse
from pathlib import Path
from PIL import Image
import json
from diffusers import StableDiffusionPipeline, DDPMScheduler
from diffusers.models import UNet2DConditionModel
from transformers import CLIPTextModel, CLIPTokenizer
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from accelerate import Accelerator
from accelerate.logging import get_logger
from tqdm.auto import tqdm
import logging

logger = get_logger(__name__)

class ManhwaDataset(Dataset):
    def __init__(self, data_dir, tokenizer, size=512):
        self.data_dir = Path(data_dir)
        self.tokenizer = tokenizer
        self.size = size
        
        # Find images and captions
        self.images = []
        self.captions = []
        
        images_dir = self.data_dir / "images"
        captions_dir = self.data_dir / "captions"
        
        if not images_dir.exists():
            images_dir = self.data_dir  # Images directly in data_dir
            
        for img_path in images_dir.glob("*.jpg"):
            self.images.append(img_path)
            
            # Look for caption file
            caption_path = captions_dir / f"{img_path.stem}.txt" if captions_dir.exists() else img_path.with_suffix(".txt")
            
            if caption_path.exists():
                with open(caption_path) as f:
                    caption = f.read().strip()
            else:
                # Default caption
                caption = "manhwa style character, korean webtoon art, detailed illustration"
            
            self.captions.append(caption)
        
        # Also check for PNG files
        for img_path in images_dir.glob("*.png"):
            self.images.append(img_path)
            
            caption_path = captions_dir / f"{img_path.stem}.txt" if captions_dir.exists() else img_path.with_suffix(".txt")
            
            if caption_path.exists():
                with open(caption_path) as f:
                    caption = f.read().strip()
            else:
                caption = "manhwa style character, korean webtoon art, detailed illustration"
            
            self.captions.append(caption)
        
        print(f"Found {len(self.images)} images for training")
        
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        img_path = self.images[idx]
        caption = self.captions[idx]
        
        # Load and process image
        image = Image.open(img_path).convert("RGB")
        image = image.resize((self.size, self.size), Image.LANCZOS)
        
        # Convert to tensor and normalize
        image = torch.from_numpy(np.array(image)).float() / 127.5 - 1.0
        image = image.permute(2, 0, 1)
        
        # Tokenize caption
        inputs = self.tokenizer(
            caption,
            max_length=self.tokenizer.model_max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        
        return {
            "pixel_values": image,
            "input_ids": inputs.input_ids.flatten(),
        }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", required=True, help="Training data directory")
    parser.add_argument("--output_dir", default="/models/lora/manhwa", help="Output directory")
    parser.add_argument("--resolution", type=int, default=512, help="Image resolution")
    parser.add_argument("--batch_size", type=int, default=1, help="Batch size")
    parser.add_argument("--max_steps", type=int, default=2000, help="Max training steps")
    parser.add_argument("--learning_rate", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--validation_prompt", default="manhwa style character portrait", help="Validation prompt")
    
    args = parser.parse_args()
    
    # Setup accelerator
    accelerator = Accelerator(
        gradient_accumulation_steps=1,
        mixed_precision="fp16",
    )
    
    # Load models
    print("Loading models...")
    model_id = "runwayml/stable-diffusion-v1-5"
    
    noise_scheduler = DDPMScheduler.from_pretrained(model_id, subfolder="scheduler")
    tokenizer = CLIPTokenizer.from_pretrained(model_id, subfolder="tokenizer")
    text_encoder = CLIPTextModel.from_pretrained(model_id, subfolder="text_encoder")
    vae = AutoencoderKL.from_pretrained(model_id, subfolder="vae")
    unet = UNet2DConditionModel.from_pretrained(model_id, subfolder="unet")
    
    # Move models to GPU and freeze VAE/text_encoder
    vae.to(accelerator.device)
    text_encoder.to(accelerator.device)
    unet.to(accelerator.device)
    
    vae.requires_grad_(False)
    text_encoder.requires_grad_(False)
    unet.train()
    
    # Setup dataset
    dataset = ManhwaDataset(args.data_dir, tokenizer, args.resolution)
    dataloader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True)
    
    # Setup optimizer
    optimizer = torch.optim.AdamW(unet.parameters(), lr=args.learning_rate)
    
    # Prepare for training
    unet, optimizer, dataloader = accelerator.prepare(unet, optimizer, dataloader)
    
    # Training loop
    print(f"Starting training for {args.max_steps} steps...")
    
    progress_bar = tqdm(range(args.max_steps), disable=not accelerator.is_local_main_process)
    global_step = 0
    
    for epoch in range(1000):  # Large number, will break when max_steps reached
        for batch in dataloader:
            with accelerator.accumulate(unet):
                # Convert images to latent space
                latents = vae.encode(batch["pixel_values"].to(accelerator.device)).latent_dist.sample()
                latents = latents * 0.18215
                
                # Sample noise
                noise = torch.randn_like(latents)
                timesteps = torch.randint(0, noise_scheduler.config.num_train_timesteps, (latents.shape[0],), device=latents.device)
                
                # Add noise to latents
                noisy_latents = noise_scheduler.add_noise(latents, noise, timesteps)
                
                # Get text embeddings
                encoder_hidden_states = text_encoder(batch["input_ids"].to(accelerator.device))[0]
                
                # Predict noise
                noise_pred = unet(noisy_latents, timesteps, encoder_hidden_states).sample
                
                # Calculate loss
                loss = F.mse_loss(noise_pred.float(), noise.float(), reduction="mean")
                
                # Backward pass
                accelerator.backward(loss)
                optimizer.step()
                optimizer.zero_grad()
            
            if accelerator.is_main_process:
                progress_bar.update(1)
                progress_bar.set_postfix(loss=loss.detach().item())
            
            global_step += 1
            
            # Save checkpoint
            if global_step % 500 == 0:
                save_path = Path(args.output_dir) / f"checkpoint-{global_step}"
                save_path.mkdir(parents=True, exist_ok=True)
                accelerator.save_state(save_path)
                print(f"Saved checkpoint at step {global_step}")
            
            if global_step >= args.max_steps:
                break
                
        if global_step >= args.max_steps:
            break
    
    # Save final model
    print("Training complete! Saving final model...")
    final_path = Path(args.output_dir) / "final"
    final_path.mkdir(parents=True, exist_ok=True)
    accelerator.save_state(final_path)
    
    print(f"Model saved to {final_path}")
    print("Training finished!")

if __name__ == "__main__":
    import numpy as np
    from diffusers import AutoencoderKL
    main()