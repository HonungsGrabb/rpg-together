# Multiplayer Implementation Guide

## What You Have Now (Single Player)
- Supabase Auth (login/register)
- Supabase Database (save slots)
- Client-side game logic
- AI-generated items (client-side)

## What You Need for Multiplayer

### 1. **Supabase Realtime** (See Other Players)
Add real-time subscriptions to see other players move:

```javascript
// Subscribe to player positions
const channel = supabase.channel('game-world')
  .on('broadcast', { event: 'player-move' }, (payload) => {
    // Update other player positions on map
    updateOtherPlayer(payload.userId, payload.x, payload.y)
  })
  .subscribe()

// Broadcast your movement
function broadcastMove(x, y) {
  channel.send({
    type: 'broadcast',
    event: 'player-move',
    payload: { userId: game.userId, x, y, area: `${worldX},${worldY}` }
  })
}
```

### 2. **Database Tables Needed**

```sql
-- Active players in the world
CREATE TABLE active_players (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  player_name TEXT,
  world_x INT,
  world_y INT,
  pos_x INT,
  pos_y INT,
  in_dungeon BOOLEAN DEFAULT FALSE,
  dungeon_floor INT,
  last_seen TIMESTAMP DEFAULT NOW()
);

-- Shared world state (dungeons, enemies)
CREATE TABLE world_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_x INT,
  world_y INT,
  dungeon_floor INT DEFAULT 0,
  state JSONB,  -- enemies, chests, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  player_name TEXT,
  message TEXT,
  world_x INT,
  world_y INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **Supabase Edge Functions** (Server-Side Logic)

For secure multiplayer, move game logic server-side:

```typescript
// supabase/functions/combat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { action, spellId } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  // Validate combat, calculate damage server-side
  // Prevent cheating by doing all calculations here
  
  return new Response(JSON.stringify({ result }))
})
```

### 4. **AI Item Generation via Edge Function**

```typescript
// supabase/functions/generate-item/index.ts
serve(async (req) => {
  const { floor, playerLevel } = await req.json()
  
  // Call Claude API for creative item generation
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Generate a random RPG item for floor ${floor}. Return JSON only:
        { name, type (weapon/helmet/chest/etc), rarity (common/uncommon/rare/epic/legendary), 
          emoji, description, stats: { physicalDamage?, magicDamage?, defense?, hp?, mana?, speed?, physicalPower?, magicPower?, magicResist? },
          levelReq }`
      }]
    })
  })
  
  const item = await response.json()
  return new Response(item.content[0].text)
})
```

### 5. **Real-Time Chat**

```javascript
// Subscribe to chat
supabase.channel('chat')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'chat_messages',
    filter: `world_x=eq.${worldX},world_y=eq.${worldY}`
  }, (payload) => {
    addChatMessage(payload.new)
  })
  .subscribe()

// Send message
async function sendChat(message) {
  await supabase.from('chat_messages').insert({
    user_id: userId,
    player_name: player.name,
    message,
    world_x: worldX,
    world_y: worldY
  })
}
```

### 6. **Deployment Steps**

1. **Enable Supabase Realtime** in dashboard
2. **Create Edge Functions**:
   ```bash
   supabase functions new combat
   supabase functions new generate-item
   supabase functions deploy
   ```
3. **Add environment variables** in Supabase dashboard:
   - `ANTHROPIC_API_KEY` for AI generation

### 7. **Architecture Overview**

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│   Client    │◄──────────────────►│ Supabase Realtime│
│  (Browser)  │                    └──────────────────┘
└─────┬───────┘                            │
      │ HTTPS                              │
      ▼                                    ▼
┌─────────────┐                   ┌──────────────────┐
│   Supabase  │◄─────────────────►│    PostgreSQL    │
│Edge Function│                   │    Database      │
└─────────────┘                   └──────────────────┘
      │
      ▼
┌─────────────┐
│ Claude API  │ (for AI items)
└─────────────┘
```

### Cost Estimate (Supabase)
- **Free tier**: 500MB database, 2GB bandwidth, 500K Edge Function invocations
- **Pro ($25/mo)**: 8GB database, 50GB bandwidth, 2M invocations
- Good for ~100-500 concurrent players on Pro

### Alternative: Full Custom Server
For more control, you could use:
- **Node.js + Socket.io** on a VPS
- **Colyseus.js** (game server framework)
- **Hathora** (managed game servers)

This requires more setup but gives you full control over game logic.
