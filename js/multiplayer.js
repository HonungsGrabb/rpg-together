import { supabase } from './supabase-client.js'

export class Multiplayer {
    constructor(game) {
        this.game = game
        this.channel = null
        this.otherPlayers = new Map() // Map of odther players in same area
        this.chatMessages = []
        this.onPlayersUpdate = null
        this.onChatMessage = null
        
        // Party system
        this.party = null
        this.pendingInvites = []
        this.onPartyUpdate = null
        this.onPartyInvite = null
    }

    async connect() {
        if (!this.game.player || !this.game.userId) return

        // Register/update our presence in the database
        await this.updatePresence()

        // Set up realtime channel for broadcasts (faster than DB subscriptions)
        this.channel = supabase.channel('game-world', {
            config: { broadcast: { self: false } }
        })

        // Listen for player movements via broadcast
        this.channel.on('broadcast', { event: 'player-move' }, ({ payload }) => {
            if (payload.userId !== this.game.userId) {
                this.handlePlayerMove(payload)
            }
        })

        // Listen for player attacks/combat
        this.channel.on('broadcast', { event: 'player-combat' }, ({ payload }) => {
            if (payload.userId !== this.game.userId) {
                this.handlePlayerCombat(payload)
            }
        })

        // Listen for chat messages via broadcast
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

        // Party broadcast listeners
        this.channel.on('broadcast', { event: 'party-invite' }, ({ payload }) => {
            if (payload.toUserId === this.game.userId) {
                this.handlePartyInvite(payload)
            }
        })

        this.channel.on('broadcast', { event: 'party-response' }, ({ payload }) => {
            if (payload.fromUserId === this.game.userId) {
                this.handlePartyResponse(payload)
            }
        })

        this.channel.on('broadcast', { event: 'party-update' }, ({ payload }) => {
            if (this.party && payload.partyId === this.party.id) {
                this.handlePartyUpdate(payload)
            }
        })

        // Announce we joined
        this.broadcastJoin()

        // Load other players in our area
        await this.loadPlayersInArea()

        // Load party data (won't affect multiplayer if fails)
        this.loadExistingParty().catch(() => {})
        this.loadPendingInvites().catch(() => {})

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

        // Leave party if in one
        if (this.party) {
            await this.leaveParty()
        }

        // Remove from online players
        await supabase.from('online_players').delete().eq('user_id', this.game.userId)
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
            .gt('last_seen', new Date(Date.now() - 120000).toISOString()) // Last 2 minutes

        if (this.game.inDungeon) {
            // In dungeon - only show players on same floor (for now, dungeons are instanced)
            // For shared dungeons, you'd match on dungeon instance ID
            query = query
                .eq('in_dungeon', true)
                .eq('dungeon_floor', p.dungeonFloor)
                .eq('world_x', p.worldX)
                .eq('world_y', p.worldY)
        } else {
            // In overworld - show players in same area
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

    broadcastCombat(action, target) {
        if (!this.channel) return

        this.channel.send({
            type: 'broadcast',
            event: 'player-combat',
            payload: {
                userId: this.game.userId,
                name: this.game.player.name,
                action,
                target,
                worldX: this.game.player.worldX,
                worldY: this.game.player.worldY
            }
        })
    }

    async sendChat(message) {
        if (!message.trim()) return

        const p = this.game.player

        // Broadcast immediately for speed
        this.channel?.send({
            type: 'broadcast',
            event: 'chat',
            payload: {
                userId: this.game.userId,
                playerName: p.name,
                message: message.trim(),
                worldX: p.worldX,
                worldY: p.worldY,
                timestamp: Date.now()
            }
        })

        // Also save to database for persistence
        await supabase.from('chat_messages').insert({
            user_id: this.game.userId,
            player_name: p.name,
            message: message.trim(),
            world_x: p.worldX,
            world_y: p.worldY
        })
    }

    handlePlayerMove(payload) {
        const p = this.game.player
        // Only process if same area
        if (payload.worldX === p.worldX && 
            payload.worldY === p.worldY && 
            payload.inDungeon === this.game.inDungeon) {
            
            // Update or add player
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
            // Player left our area
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

    handlePlayerCombat(payload) {
        const p = this.game.player
        if (payload.worldX === p.worldX && payload.worldY === p.worldY) {
            this.game.log(`${payload.name} ${payload.action}!`, 'info')
        }
    }

    handleChatMessage(payload) {
        const p = this.game.player
        // Show chat from same area or nearby
        const distance = Math.abs(payload.worldX - p.worldX) + Math.abs(payload.worldY - p.worldY)
        if (distance <= 1) { // Same area or adjacent
            this.chatMessages.push({
                name: payload.playerName,
                message: payload.message,
                timestamp: payload.timestamp,
                isLocal: payload.worldX === p.worldX && payload.worldY === p.worldY
            })

            // Keep last 50 messages
            if (this.chatMessages.length > 50) this.chatMessages.shift()

            if (this.onChatMessage) this.onChatMessage(this.chatMessages)
        }
    }

    async cleanupOldPlayers() {
        // Remove players not seen in 2 minutes from our local cache
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
        // Called when player moves to new area
        await this.updatePresence()
        await this.loadPlayersInArea()
        this.broadcastJoin()
    }

    // ============================================
    // PARTY SYSTEM
    // ============================================

    async loadExistingParty() {
        const { data: membership } = await supabase
            .from('party_members')
            .select('party_id')
            .eq('user_id', this.game.userId)
            .single()

        if (membership) {
            await this.loadPartyData(membership.party_id)
        }
    }

    async loadPartyData(partyId) {
        if (!partyId) return

        const { data: party } = await supabase
            .from('parties')
            .select('*')
            .eq('id', partyId)
            .single()

        if (!party) {
            this.party = null
            if (this.onPartyUpdate) this.onPartyUpdate(null)
            return
        }

        const { data: members } = await supabase
            .from('party_members')
            .select('*')
            .eq('party_id', partyId)

        const memberIds = members?.map(m => m.user_id) || []
        const { data: onlineData } = await supabase
            .from('online_players')
            .select('*')
            .in('user_id', memberIds)

        const onlineMap = new Map(onlineData?.map(p => [p.user_id, p]) || [])

        this.party = {
            id: party.id,
            leader_id: party.leader_id,
            members: (members || []).map(m => ({
                ...m,
                online: onlineMap.get(m.user_id),
                isLeader: m.user_id === party.leader_id,
                isMe: m.user_id === this.game.userId
            }))
        }

        if (this.onPartyUpdate) this.onPartyUpdate(this.party)
    }

    async loadPendingInvites() {
        const { data } = await supabase
            .from('party_invites')
            .select('*')
            .eq('to_user_id', this.game.userId)
            .eq('status', 'pending')

        this.pendingInvites = data || []
        if (this.onPartyInvite) this.onPartyInvite(this.pendingInvites)
    }

    async sendPartyInvite(targetUserId, targetName) {
        if (this.party && this.party.leader_id !== this.game.userId) {
            this.game.log('Only party leader can invite', 'info')
            return false
        }

        // Create party if we don't have one
        if (!this.party) {
            await this.createParty()
        }

        if (this.party?.members?.some(m => m.user_id === targetUserId)) {
            this.game.log('Already in your party', 'info')
            return false
        }

        await supabase.from('party_invites').upsert({
            from_user_id: this.game.userId,
            to_user_id: targetUserId,
            from_name: this.game.player.name,
            status: 'pending'
        }, { onConflict: 'from_user_id,to_user_id' })

        this.channel?.send({
            type: 'broadcast',
            event: 'party-invite',
            payload: {
                fromUserId: this.game.userId,
                fromName: this.game.player.name,
                toUserId: targetUserId,
                partyId: this.party.id
            }
        })

        this.game.log(`Invited ${targetName} to party`, 'info')
        return true
    }

    async respondToInvite(inviteId, accept) {
        const invite = this.pendingInvites.find(i => i.id === inviteId)
        if (!invite) return

        if (accept) {
            const { data: membership } = await supabase
                .from('party_members')
                .select('party_id')
                .eq('user_id', invite.from_user_id)
                .single()

            if (membership) {
                if (this.party) await this.leaveParty()

                await supabase.from('party_members').insert({
                    party_id: membership.party_id,
                    user_id: this.game.userId,
                    player_name: this.game.player.name
                })

                await this.loadPartyData(membership.party_id)

                this.channel?.send({
                    type: 'broadcast',
                    event: 'party-update',
                    payload: {
                        partyId: membership.party_id,
                        action: 'joined',
                        userId: this.game.userId,
                        name: this.game.player.name
                    }
                })

                this.game.log(`Joined ${invite.from_name}'s party!`, 'reward')
            }
        }

        await supabase
            .from('party_invites')
            .update({ status: accept ? 'accepted' : 'declined' })
            .eq('id', inviteId)

        this.channel?.send({
            type: 'broadcast',
            event: 'party-response',
            payload: {
                fromUserId: invite.from_user_id,
                responderName: this.game.player.name,
                accepted: accept
            }
        })

        this.pendingInvites = this.pendingInvites.filter(i => i.id !== inviteId)
        if (this.onPartyInvite) this.onPartyInvite(this.pendingInvites)
    }

    async createParty() {
        const { data: party } = await supabase
            .from('parties')
            .insert({ leader_id: this.game.userId })
            .select()
            .single()

        if (!party) return null

        await supabase.from('party_members').insert({
            party_id: party.id,
            user_id: this.game.userId,
            player_name: this.game.player.name
        })

        await this.loadPartyData(party.id)
        return party
    }

    async leaveParty() {
        if (!this.party) return

        const partyId = this.party.id
        const wasLeader = this.party.leader_id === this.game.userId

        await supabase
            .from('party_members')
            .delete()
            .eq('party_id', partyId)
            .eq('user_id', this.game.userId)

        if (wasLeader) {
            const { data: remaining } = await supabase
                .from('party_members')
                .select('*')
                .eq('party_id', partyId)

            if (!remaining || remaining.length === 0) {
                await supabase.from('parties').delete().eq('id', partyId)
            } else {
                await supabase
                    .from('parties')
                    .update({ leader_id: remaining[0].user_id })
                    .eq('id', partyId)
            }
        }

        this.channel?.send({
            type: 'broadcast',
            event: 'party-update',
            payload: {
                partyId,
                action: 'left',
                userId: this.game.userId,
                name: this.game.player.name
            }
        })

        this.party = null
        if (this.onPartyUpdate) this.onPartyUpdate(null)
        this.game.log('Left the party', 'info')
    }

    handlePartyInvite(payload) {
        this.pendingInvites.push({
            id: `temp_${Date.now()}`,
            from_user_id: payload.fromUserId,
            from_name: payload.fromName,
            status: 'pending'
        })
        this.game.log(`${payload.fromName} invited you to a party!`, 'reward')
        if (this.onPartyInvite) this.onPartyInvite(this.pendingInvites)
        this.loadPendingInvites()
    }

    handlePartyResponse(payload) {
        if (payload.accepted) {
            this.game.log(`${payload.responderName} joined your party!`, 'reward')
            this.loadPartyData(this.party?.id)
        } else {
            this.game.log(`${payload.responderName} declined your invite`, 'info')
        }
    }

    handlePartyUpdate(payload) {
        if (payload.action === 'joined') {
            this.game.log(`${payload.name} joined the party!`, 'reward')
        } else if (payload.action === 'left') {
            this.game.log(`${payload.name} left the party`, 'info')
        }
        this.loadPartyData(payload.partyId)
    }

    isInParty() {
        return this.party !== null && this.party.members && this.party.members.length > 1
    }

    isPartyLeader() {
        return this.party && this.party.leader_id === this.game.userId
    }
}
