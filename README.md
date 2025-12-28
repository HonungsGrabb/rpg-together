# Browser RPG - Setup Guide

## Step 1: Set Up Supabase Database

Go to your Supabase project → **SQL Editor** → Click **"New Query"** and run this:

```sql
-- Create players table
CREATE TABLE players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username TEXT,
    level INTEGER DEFAULT 1,
    hp INTEGER DEFAULT 100,
    max_hp INTEGER DEFAULT 100,
    xp INTEGER DEFAULT 0,
    xp_to_level INTEGER DEFAULT 100,
    attack INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 5,
    gold INTEGER DEFAULT 0,
    inventory JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own data
CREATE POLICY "Users can view own player" ON players
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own player" ON players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own player" ON players
    FOR UPDATE USING (auth.uid() = user_id);
```

## Step 2: Deploy to Cloudflare Pages

1. Download this entire `rpg-game` folder
2. Go to Cloudflare Dashboard → Workers & Pages → Create Application → Pages
3. Choose "Upload assets"
4. Drag and drop the `rpg-game` folder
5. Done! You'll get a URL like `rpg-game-xxx.pages.dev`

## File Structure

```
rpg-game/
├── index.html          # Main page
├── css/
│   └── style.css       # Styling
├── js/
│   ├── supabase-client.js  # Supabase connection
│   ├── auth.js             # Login/register/logout
│   ├── game.js             # Game logic & save system
│   └── main.js             # Entry point
└── README.md           # This file
```

## Features

- ⚔️ Combat system with multiple enemies
- 📈 Leveling and stats progression
- 💰 Gold and loot drops
- 🎒 Inventory system (9 slots)
- 🧪 Usable items (potions, equipment)
- ☁️ Cloud saves (auto-saves to Supabase)
- 🔐 User authentication

## Expanding the Game

Ideas for next steps:
- Add more enemies and items
- Create a map/locations system
- Add quests
- Implement multiplayer features (leaderboards, trading)
- Add crafting
