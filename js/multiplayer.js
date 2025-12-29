import { supabase } from './supabase-client.js'

export class Multiplayer {
    constructor(game) {
        this.game = game
        this.channel = null
        this.otherPlayers = new Map()
        this.chatMessages = []
        this.onPlayersUpdate = null
        this.onChatMessage = null
    }

    async connect() {
        if (!this.game.player || !this.game.userId) return

        // Register presence in database
        await this.updatePresence()

        // Set up realtime channel
        this.channel = supabase.channel('game-world', {
            config: { broadcast: { self: false } }
        })

        // Listen for player movements
        this.channel.on('broadcast', { event: 'player-move' }, ({ payload }) => {
            if (payload.userId !== this.game.userId) {
                this.handlePlayerMove(payload)
            }
        })

        // Listen for chat messages
        this.channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
            this.handleChatMessage(payload)
        })

        // Listen for players joining/leaving
        this.channel.on('broadcast', { event: 'player-join' }, ({ payload }) => {
            this.handlePlayerJoin(payload)
        })

        this.channel.on('broadcast', { event: 'player-leave' }, ({ payload }) => {
            this.handlePlayerLeave(payload)
        })

        await this.channel.subscribe()

        // Announce we joined
        this.broadcastJoin()

        // Load other players in our area
        await this.loadPlayersInArea()

        // Set up periodic presence updates
        this.presenceInterval = setInterval(() => this.updatePresence(), 30000)

        // Clean up old players periodically
        this.cleanupInterval = setInterval(() => this.cleanupOldPlayers(), 60000)

        console.log('Multiplayer connected!')
    }

    async disconnect() {
        if (this.channel) {
            this.broadcastLeave()
            await this.channel.unsubscribe()
            this.channel = null
        }

        if (this.presenceInterval) clearInterval(this.presenceInterval)
        if (this.cleanupInterval) clearInterval(this.cleanupInterval)

        // Remove from online players
        if (this.game.userId) {
            await supabase.from('online_players').delete().eq('user_id', this.game.userId)
        }
    }

    async updatePresence() {
        const p = this.game.player
        if (!p) return

        const data = {
            user_id: this.game.userId,
            player_name: p.name,
            race: p.race,
            class: p.class,
            level: p.level,
            world_x: p.worldX,
            world_y: p.worldY,
            pos_x: this.game.inDungeon ? this.game.dungeon?.playerPos?.x : this.game.world?.playerPos?.x,
            pos_y: this.game.inDungeon ? this.game.dungeon?.playerPos?.y : this.game.world?.playerPos?.y,
            in_dungeon: this.game.inDungeon,
            dungeon_floor: p.dungeonFloor || 0,
            hp: p.hp,
            max_hp: this.game.getMaxHp(),
            last_seen: new Date().toISOString()
        }

        await supabase.from('online_players').upsert(data, { onConflict: 'user_id' })
    }

    async loadPlayersInArea() {
        const p = this.game.player
        if (!p) return

        let query = supabase
            .from('online_players')
            .select('*')
            .neq('user_id', this.game.userId)
            .gt('last_seen', new Date(Date.now() - 120000).toISOString())

        if (this.game.inDungeon) {
            query = query
                .eq('in_dungeon', true)
                .eq('dungeon_floor', p.dungeonFloor)
                .eq('world_x', p.worldX)
                .eq('world_y', p.worldY)
        } else {
            query = query
                .eq('in_dungeon', false)
                .eq('world_x', p.worldX)
                .eq('world_y', p.worldY)
        }

        const { data } = await query

        this.otherPlayers.clear()
        if (data) {
            for (const player of data) {
                this.otherPlayers.set(player.user_id, player)
            }
        }

        if (this.onPlayersUpdate) this.onPlayersUpdate(this.otherPlayers)
    }

    broadcastMove(x, y) {
        if (!this.channel) return

        const p = this.game.player
        this.channel.send({
            type: 'broadcast',
            event: 'player-move',
            payload: {
                userId: this.game.userId,
                name: p.name,
                race: p.race,
                class: p.class,
                level: p.level,
                worldX: p.worldX,
                worldY: p.worldY,
                x,
                y,
                inDungeon: this.game.inDungeon,
                dungeonFloor: p.dungeonFloor
            }
        })
    }

    broadcastJoin() {
        if (!this.channel) return

        const p = this.game.player
        this.channel.send({
            type: 'broadcast',
            event: 'player-join',
            payload: {
                userId: this.game.userId,
                name: p.name,
                race: p.race,
                class: p.class,
                level: p.level,
                worldX: p.worldX,
                worldY: p.worldY,
                inDungeon: this.game.inDungeon
            }
        })
    }

    broadcastLeave() {
        if (!this.channel) return

        this.channel.send({
            type: 'broadcast',
            event: 'player-leave',
            payload: { userId: this.game.userId }
        })
    }

    async sendChat(message) {
        if (!message.trim()) return

        const p = this.game.player
        const msg = message.trim()

        // Add own message locally
        this.chatMessages.push({
            name: p.name,
            message: msg,
            timestamp: Date.now(),
            isOwn: true
        })
        if (this.chatMessages.length > 50) this.chatMessages.shift()
        if (this.onChatMessage) this.onChatMessage(this.chatMessages)

        // Broadcast to others
        this.channel?.send({
            type: 'broadcast',
            event: 'chat',
            payload: {
                userId: this.game.userId,
                playerName: p.name,
                message: msg,
                worldX: p.worldX,
                worldY: p.worldY,
                timestamp: Date.now()
            }
        })

        // Save to database
        await supabase.from('chat_messages').insert({
            user_id: this.game.userId,
            player_name: p.name,
            message: msg,
            world_x: p.worldX,
            world_y: p.worldY
        })
    }

    handlePlayerMove(payload) {
        const p = this.game.player
        if (payload.worldX === p.worldX && 
            payload.worldY === p.worldY && 
            payload.inDungeon === this.game.inDungeon) {
            
            this.otherPlayers.set(payload.userId, {
                user_id: payload.userId,
                player_name: payload.name,
                race: payload.race,
                class: payload.class,
                level: payload.level,
                pos_x: payload.x,
                pos_y: payload.y,
                world_x: payload.worldX,
                world_y: payload.worldY
            })

            if (this.onPlayersUpdate) this.onPlayersUpdate(this.otherPlayers)
        } else {
            this.otherPlayers.delete(payload.userId)
            if (this.onPlayersUpdate) this.onPlayersUpdate(this.otherPlayers)
        }
    }

    handlePlayerJoin(payload) {
        const p = this.game.player
        if (payload.worldX === p.worldX && payload.worldY === p.worldY) {
            this.game.log(`${payload.name} entered the area`, 'info')
            this.loadPlayersInArea()
        }
    }

    handlePlayerLeave(payload) {
        if (this.otherPlayers.has(payload.userId)) {
            const player = this.otherPlayers.get(payload.userId)
            this.game.log(`${player?.player_name || 'Someone'} left`, 'info')
            this.otherPlayers.delete(payload.userId)
            if (this.onPlayersUpdate) this.onPlayersUpdate(this.otherPlayers)
        }
    }

    handleChatMessage(payload) {
        const p = this.game.player
        const distance = Math.abs(payload.worldX - p.worldX) + Math.abs(payload.worldY - p.worldY)
        if (distance <= 1) {
            this.chatMessages.push({
                name: payload.playerName,
                message: payload.message,
                timestamp: payload.timestamp,
                isOwn: false
            })

            if (this.chatMessages.length > 50) this.chatMessages.shift()
            if (this.onChatMessage) this.onChatMessage(this.chatMessages)
        }
    }

    async cleanupOldPlayers() {
        const cutoff = Date.now() - 120000
        for (const [id, player] of this.otherPlayers) {
            if (new Date(player.last_seen).getTime() < cutoff) {
                this.otherPlayers.delete(id)
            }
        }
        if (this.onPlayersUpdate) this.onPlayersUpdate(this.otherPlayers)
    }

    getPlayersInArea() {
        return Array.from(this.otherPlayers.values())
    }

    async onAreaChange() {
        await this.updatePresence()
        await this.loadPlayersInArea()
        this.broadcastJoin()
    }
}
