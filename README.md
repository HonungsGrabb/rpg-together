# Dungeon Depths - Infinite Roguelike RPG

## IMPORTANT: Update Your Database

You need to update your Supabase database with the new save system.

Go to Supabase → **SQL Editor** → **New Query** → Run this:

```sql
-- Drop old table if it exists
DROP TABLE IF EXISTS players;

-- Create new save slots table
CREATE TABLE save_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 3),
    player_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slot)
);

-- Enable Row Level Security
ALTER TABLE save_slots ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own saves
CREATE POLICY "Users can view own saves" ON save_slots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saves" ON save_slots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saves" ON save_slots
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saves" ON save_slots
    FOR DELETE USING (auth.uid() = user_id);
```

## Features

- 🎭 **5 Races**: Human, Elf, Dwarf, Orc, Undead
- ⚔️ **3 Classes**: Warrior, Mage, Hunter
- 🗺️ **Procedural Dungeons**: Randomly generated floors
- 👾 **12+ Enemy Types**: Scaling difficulty
- 🎒 **Equipment System**: Helmet, Chest, Leggings, Boots, Weapon
- 💾 **3 Save Slots**: Multiple characters
- ☁️ **Cloud Saves**: Progress saved to Supabase

## Controls

- **WASD / Arrow Keys**: Move
- **Walk into enemies**: Start combat
- **ESC**: Pause menu
- **Click items**: Use/Equip
- **Right-click items**: Drop

## File Structure

```
rpg-together/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── supabase-client.js   # Supabase connection
│   ├── auth.js              # Authentication
│   ├── data.js              # Game data (races, classes, items, enemies)
│   ├── dungeon.js           # Dungeon generation
│   ├── game.js              # Core game logic
│   └── main.js              # UI and screen management
└── README.md
```

## Coming Soon

- Skill system
- More equipment tiers
- Boss battles
- Achievements
