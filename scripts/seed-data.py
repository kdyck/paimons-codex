#!/usr/bin/env python3
"""
Seed script to populate the database with sample manhwa data
"""

import asyncio
import sys
import os

# Add the project root to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'dal'))

from dal.oracle_client import OracleClient
from dal.chroma_client import ChromaClient

sample_manhwa_data = [
    {
        "id": "solo-leveling",
        "title": "Solo Leveling",
        "author": "Chugong",
        "genre": ["Action", "Fantasy", "Adventure"],
        "status": "completed",
        "description": "10 years ago, after 'the Gate' that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate. They are known as 'Hunters'. However, not all Hunters are powerful. My name is Sung Jin-Woo, an E-rank Hunter. I'm someone who has to risk his life in the lowliest of dungeons, the 'World's Weakest'. Having no skills whatsoever to display, I barely earned the required money by fighting in low-leveled dungeons... at least until I found a hidden dungeon with the hardest difficulty within the D-rank dungeons! In the end, as I was accepting death, I suddenly received a strange power, a quest log that only I could see, a secret to leveling up that only I know about! If I trained in accordance with my quests and hunted monsters, my level would rise. Changing from the weakest Hunter to the strongest S-rank Hunter!",
        "cover_image": "https://example.com/solo-leveling-cover.jpg"
    },
    {
        "id": "tower-of-god",
        "title": "Tower of God",
        "author": "SIU",
        "genre": ["Action", "Drama", "Fantasy", "Mystery"],
        "status": "ongoing",
        "description": "Bam, who was alone all his life has entered the tower to chase after his only friend, available to fulfill his promise. But to reunite with her, he needs to climb higher and higher up the tower. Each floor has a different test, and each test gets more and more difficult and dangerous. What does Bam need to become in order to survive? What will he be willing to sacrifice? As he climbs each floor, he gets to know himself and his destiny better, but at what cost?",
        "cover_image": "https://example.com/tower-of-god-cover.jpg"
    },
    {
        "id": "the-god-of-high-school",
        "title": "The God of High School",
        "author": "Yongje Park",
        "genre": ["Action", "Comedy", "Supernatural", "Martial Arts"],
        "status": "completed",
        "description": "While an island half-disappearing from the face of the earth, a mysterious organization is sending out invitations for a tournament to every skilled fighter in the world. 'The God of High School' tournament. The winner will be granted any wish they want. Jin Mori, a Taekwondo specialist and a high school student, soon learns that there is something much greater beneath the stage of the tournament.",
        "cover_image": "https://example.com/god-of-high-school-cover.jpg"
    },
    {
        "id": "noblesse",
        "title": "Noblesse",
        "author": "Jeho Son",
        "genre": ["Action", "Supernatural", "Comedy", "School"],
        "status": "completed",
        "description": "Rai wakes up from 820-years long sleep and starts his new life as a student in a high school founded by his loyal servant, Frankenstein. But his peaceful days with other human students are soon interrupted by mysterious attackers known as the \"Unions\".",
        "cover_image": "https://example.com/noblesse-cover.jpg"
    },
    {
        "id": "hardcore-leveling-warrior",
        "title": "Hardcore Leveling Warrior",
        "author": "Sehoon Kim",
        "genre": ["Action", "Comedy", "Game", "Virtual Reality"],
        "status": "ongoing",
        "description": "Known as Hardcore Leveling Warrior, Ethan is the #1 player of the world's biggest VRMMO, Lucid Adventure. But when a mysterious player kills Ethan and forces his character back to level 1, he will do anything to get back on top. New friends and old foes, as well as mysterious forces and his own dark past, will follow him as he does what he does best – level up.",
        "cover_image": "https://example.com/hardcore-leveling-warrior-cover.jpg"
    }
]

async def seed_database():
    print("🌱 Starting database seeding...")
    
    # Initialize clients
    oracle_client = OracleClient()
    chroma_client = ChromaClient()
    
    try:
        # Initialize database tables
        print("📋 Initializing database tables...")
        await oracle_client.init_database()
        
        # Seed manhwa data
        print("📚 Seeding manhwa data...")
        for manhwa_data in sample_manhwa_data:
            print(f"   Adding: {manhwa_data['title']}")
            
            # Create manhwa in Oracle
            manhwa = await oracle_client.create_manhwa(manhwa_data)
            
            # Add embedding to ChromaDB
            await chroma_client.add_manhwa_embedding(
                manhwa_id=manhwa["id"],
                title=manhwa["title"],
                description=manhwa["description"],
                genre=manhwa["genre"]
            )
        
        print("✅ Database seeding completed successfully!")
        print(f"📊 Added {len(sample_manhwa_data)} manhwa entries")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(seed_database())