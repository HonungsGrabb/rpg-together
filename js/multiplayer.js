import { supabase, supabaseUrl, supabaseKey } from './supabase-client.js'

export class Multiplayer {
    constructor(game) {
        this.game = game
        this.channel = null
        this.otherPlayers = new Map()
        this.chatMessages = []
        this.onPlayersUpdate = null
        this.onChatMessage = null
        
        // Party system
        this.party = null
        this.pendingInvites = []
        this.onPartyUpdate = null
        this.onPartyInvite = null
        
        // Party combat
        this.pendingCombatInvite = null
        this.onPartyCombatInvite = null
        this.onPartyCombatAction = null
        this.onPartyCombatEnd = null
        
        // Set up beforeunload to clean up when closing browser
        window.addEventListener('beforeunload', () => {
            this.cleanupOnExit()
        })
    }
    
    cleanupOnExit() {
        // Synchronous cleanup - use sendBeacon for reliability
        if (this.game.userId) {
            // Use fetch with keepalive for cleanup
            const url = `${supabaseUrl}/rest/v1/online_players?user_id=eq.${this.game.userId}`
            fetch(url, {
                method: 'DELETE',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                },
                keepalive: true
            }).catch(() => {})
            
            // Also try to leave party
            if (this.party) {
                const partyUrl = `${supabaseUrl}/rest/v1/party_members?user_id=eq.${this.game.userId}`
                fetch(partyUrl, {
                    method: 'DELETE',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                    },
                    keepalive: true
                }).catch(() => {})
            }
        }
        
        // Broadcast leave
        this.broadcastLeave()
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

        // Party broadcasts
        this.channel.on('broadcast', { event: 'party-invite' }, ({ payload }) => {
            this.handlePartyInvite(payload)
        })

        this.channel.on('broadcast', { event: 'party-response' }, ({ payload }) => {
            this.handlePartyResponse(payload)
        })

        this.channel.on('broadcast', { event: 'party-update' }, ({ payload }) => {
            this.handlePartyUpdate(payload)
        })

        // Party combat broadcasts
        this.channel.on('broadcast', { event: 'party-combat-start' }, ({ payload }) => {
            this.handlePartyCombatStart(payload)
        })

        this.channel.on('broadcast', { event: 'party-combat-join' }, ({ payload }) => {
            this.handlePartyCombatJoin(payload)
        })

        this.channel.on('broadcast', { event: 'party-combat-action' }, ({ payload }) => {
            this.handlePartyCombatAction(payload)
        })

        this.channel.on('broadcast', { event: 'party-combat-end' }, ({ payload }) => {
            this.handlePartyCombatEnd(payload)
        })

        await this.channel.subscribe()

        // Announce we joined
        this.broadcastJoin()

        // Load other players in our area
        await this.loadPlayersInArea()

        // Load party data
        await this.loadExistingParty()
        await this.loadPendingInvites()

        // Set up periodic presence updates (every 15 seconds)
        this.presenceInterval = setInterval(() => this.updatePresence(), 15000)

        // Clean up old players more frequently (every 20 seconds)
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldPlayers()
            this.loadPlayersInArea() // Refresh player list
        }, 20000)
        
        // Refresh party data periodically (every 30 seconds)
        this.partyRefreshInterval = setInterval(() => {
            if (this.party) this.loadPartyData(this.party.id)
        }, 30000)

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
        if (this.partyRefreshInterval) clearInterval(this.partyRefreshInterval)

        // Leave party if in one
        if (this.party) {
            await this.leaveParty()
        }

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
            symbol: p.symbol || '@',
            color: p.color || '#4a9eff',
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
            .gt('last_seen', new Date(Date.now() - 45000).toISOString())

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
                dungeonFloor: p.dungeonFloor,
                symbol: p.symbol || '@',
                color: p.color || '#4a9eff'
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
                world_y: payload.worldY,
                symbol: payload.symbol || '@',
                color: payload.color || '#4a9eff'
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
        const cutoff = Date.now() - 45000
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

    // ==================== PARTY SYSTEM ====================

    async loadExistingParty() {
        try {
            const { data: membership } = await supabase
                .from('party_members')
                .select('party_id')
                .eq('user_id', this.game.userId)
                .single()

            if (membership?.party_id) {
                await this.loadPartyData(membership.party_id)
            }
        } catch (e) {
            // No party
        }
    }

    async loadPartyData(partyId) {
        const { data: party } = await supabase
            .from('parties')
            .select('*')
            .eq('id', partyId)
            .single()

        if (!party) {
            this.party = null
            return
        }

        const { data: members } = await supabase
            .from('party_members')
            .select('*')
            .eq('party_id', partyId)

        // Get online status for each member
        const memberIds = members?.map(m => m.user_id) || []
        const { data: onlineData } = await supabase
            .from('online_players')
            .select('user_id, hp, max_hp')
            .in('user_id', memberIds)

        const onlineMap = new Map(onlineData?.map(o => [o.user_id, o]) || [])

        this.party = {
            id: party.id,
            leaderId: party.leader_id,
            members: members?.map(m => ({
                userId: m.user_id,
                name: m.player_name,
                isOnline: onlineMap.has(m.user_id),
                hp: onlineMap.get(m.user_id)?.hp || 0,
                maxHp: onlineMap.get(m.user_id)?.max_hp || 100
            })) || []
        }

        if (this.onPartyUpdate) this.onPartyUpdate(this.party)
    }

    async loadPendingInvites() {
        try {
            const { data } = await supabase
                .from('party_invites')
                .select('*')
                .eq('to_user_id', this.game.userId)
                .eq('status', 'pending')

            this.pendingInvites = data || []
            if (this.onPartyInvite && this.pendingInvites.length > 0) {
                this.onPartyInvite(this.pendingInvites)
            }
        } catch (e) {
            this.pendingInvites = []
        }
    }

    async sendPartyInvite(targetUserId, targetName) {
        // Create party if we don't have one
        if (!this.party) {
            await this.createParty()
        }

        // Check if already in party
        const { data: existing } = await supabase
            .from('party_members')
            .select('id')
            .eq('user_id', targetUserId)
            .single()

        if (existing) {
            this.game.log(`${targetName} is already in a party`, 'info')
            return false
        }

        // Create invite
        await supabase.from('party_invites').upsert({
            from_user_id: this.game.userId,
            to_user_id: targetUserId,
            from_name: this.game.player.name,
            party_id: this.party.id,
            status: 'pending'
        }, { onConflict: 'from_user_id,to_user_id' })

        // Broadcast invite
        console.log('Broadcasting party invite:', {
            fromUserId: this.game.userId,
            fromName: this.game.player.name,
            toUserId: targetUserId,
            partyId: this.party.id
        })
        
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

        this.game.log(`Sent party invite to ${targetName}`, 'info')
        return true
    }

    async respondToInvite(inviteId, accept) {
        const invite = this.pendingInvites.find(i => i.id === inviteId)
        if (!invite) return

        if (accept) {
            // Leave current party if in one
            if (this.party) {
                await this.leaveParty()
            }

            // Join the party
            await supabase.from('party_members').insert({
                party_id: invite.party_id,
                user_id: this.game.userId,
                player_name: this.game.player.name
            })

            // Update invite status in database (find by from/to user IDs)
            await supabase.from('party_invites')
                .update({ status: 'accepted' })
                .eq('from_user_id', invite.from_user_id)
                .eq('to_user_id', this.game.userId)

            // Load party data
            await this.loadPartyData(invite.party_id)

            // Broadcast join
            this.channel?.send({
                type: 'broadcast',
                event: 'party-response',
                payload: {
                    accepted: true,
                    partyId: invite.party_id,
                    userId: this.game.userId,
                    userName: this.game.player.name
                }
            })

            this.game.log(`Joined ${invite.from_name}'s party!`, 'info')
        } else {
            // Decline - update by from/to user IDs
            await supabase.from('party_invites')
                .update({ status: 'declined' })
                .eq('from_user_id', invite.from_user_id)
                .eq('to_user_id', this.game.userId)

            this.channel?.send({
                type: 'broadcast',
                event: 'party-response',
                payload: {
                    accepted: false,
                    fromUserId: invite.from_user_id,
                    userId: this.game.userId,
                    userName: this.game.player.name
                }
            })
        }

        // Remove from pending
        this.pendingInvites = this.pendingInvites.filter(i => i.id !== inviteId)
        if (this.onPartyInvite) this.onPartyInvite(this.pendingInvites)
    }

    async createParty() {
        const { data: party } = await supabase
            .from('parties')
            .insert({ leader_id: this.game.userId })
            .select()
            .single()

        if (party) {
            await supabase.from('party_members').insert({
                party_id: party.id,
                user_id: this.game.userId,
                player_name: this.game.player.name
            })

            await this.loadPartyData(party.id)
        }

        return party
    }

    async leaveParty() {
        if (!this.party) return

        const partyId = this.party.id
        const wasLeader = this.party.leaderId === this.game.userId

        // Remove self from party
        await supabase.from('party_members')
            .delete()
            .eq('party_id', partyId)
            .eq('user_id', this.game.userId)

        // If leader, transfer leadership or delete party
        if (wasLeader) {
            const { data: remainingMembers } = await supabase
                .from('party_members')
                .select('user_id')
                .eq('party_id', partyId)

            if (remainingMembers && remainingMembers.length > 0) {
                // Transfer to first remaining member
                await supabase.from('parties')
                    .update({ leader_id: remainingMembers[0].user_id })
                    .eq('id', partyId)
            } else {
                // Delete empty party
                await supabase.from('parties').delete().eq('id', partyId)
                await supabase.from('party_invites').delete().eq('party_id', partyId)
            }
        }

        // Broadcast leave
        this.channel?.send({
            type: 'broadcast',
            event: 'party-update',
            payload: {
                type: 'leave',
                partyId,
                userId: this.game.userId,
                userName: this.game.player.name
            }
        })

        this.party = null
        if (this.onPartyUpdate) this.onPartyUpdate(null)
        this.game.log('Left the party', 'info')
    }

    handlePartyInvite(payload) {
        console.log('Received party invite:', payload)
        console.log('My userId:', this.game.userId)
        
        if (payload.toUserId !== this.game.userId) {
            console.log('Invite not for me, ignoring')
            return
        }

        console.log('Invite is for me, adding to pendingInvites')
        
        this.pendingInvites.push({
            id: `temp_${Date.now()}`,
            from_user_id: payload.fromUserId,
            from_name: payload.fromName,
            party_id: payload.partyId,
            status: 'pending'
        })

        console.log('pendingInvites now:', this.pendingInvites)
        console.log('onPartyInvite callback:', this.onPartyInvite ? 'SET' : 'NOT SET')
        
        if (this.onPartyInvite) {
            this.onPartyInvite(this.pendingInvites)
        }
        this.game.log(`📩 ${payload.fromName} invited you to their party!`, 'info')
    }

    handlePartyResponse(payload) {
        if (payload.accepted && this.party && payload.partyId === this.party.id) {
            // Someone joined our party
            this.loadPartyData(this.party.id)
            this.game.log(`${payload.userName} joined the party!`, 'info')
        } else if (!payload.accepted && payload.fromUserId === this.game.userId) {
            // Our invite was declined
            this.game.log(`${payload.userName} declined your party invite`, 'info')
        }
    }

    handlePartyUpdate(payload) {
        if (!this.party || payload.partyId !== this.party.id) return

        if (payload.type === 'leave') {
            this.game.log(`${payload.userName} left the party`, 'info')
            this.loadPartyData(this.party.id)
        }
    }

    isInParty() {
        return this.party !== null
    }

    isPartyLeader() {
        return this.party && this.party.leaderId === this.game.userId
    }

    // ==================== PARTY COMBAT ====================
    
    broadcastCombatStart(combatId, enemies, x, y) {
        if (!this.channel || !this.party) return
        
        console.log('Broadcasting combat start:', combatId)
        
        this.channel.send({
            type: 'broadcast',
            event: 'party-combat-start',
            payload: {
                combatId,
                userId: this.game.userId,
                starterName: this.game.player.name,
                enemies: enemies.map(e => ({
                    name: e.name,
                    emoji: e.emoji,
                    hp: e.hp,
                    maxHp: e.maxHp,
                    physicalDamage: e.physicalDamage,
                    magicDamage: e.magicDamage,
                    defense: e.defense,
                    magicResist: e.magicResist,
                    speed: e.speed,
                    xp: e.xp,
                    gold: e.gold
                })),
                x,
                y,
                partyId: this.party.id
            }
        })
    }
    
    broadcastCombatJoin(combatId) {
        if (!this.channel) return
        
        this.channel.send({
            type: 'broadcast',
            event: 'party-combat-join',
            payload: {
                combatId,
                userId: this.game.userId,
                playerName: this.game.player.name
            }
        })
    }
    
    broadcastCombatAction(action) {
        if (!this.channel || !this.game.isPartyCombat) return
        
        this.channel.send({
            type: 'broadcast',
            event: 'party-combat-action',
            payload: {
                combatId: this.game.partyCombatId,
                userId: this.game.userId,
                ...action
            }
        })
    }
    
    broadcastCombatEnd(combatId, victory) {
        if (!this.channel) return
        
        this.channel.send({
            type: 'broadcast',
            event: 'party-combat-end',
            payload: {
                combatId,
                userId: this.game.userId,
                victory
            }
        })
    }
    
    // Handler: Party member started combat
    handlePartyCombatStart(payload) {
        console.log('Received party-combat-start:', payload)
        
        // Ignore if not in same party or if it's our own combat
        if (!this.party || payload.partyId !== this.party.id) return
        if (payload.userId === this.game.userId) return
        
        // Don't show invite if already in combat
        if (this.game.inCombat) {
            console.log('Already in combat, ignoring invite')
            return
        }
        
        // Store pending combat invite
        this.pendingCombatInvite = {
            combatId: payload.combatId,
            userId: payload.userId,
            starterName: payload.starterName,
            enemies: payload.enemies,
            x: payload.x,
            y: payload.y
        }
        
        this.game.log(`⚔️ ${payload.starterName} is in combat! Click to join!`, 'info')
        
        // Notify UI
        if (this.onPartyCombatInvite) {
            this.onPartyCombatInvite(this.pendingCombatInvite)
        }
    }
    
    // Handler: Someone joined the combat
    handlePartyCombatJoin(payload) {
        console.log('Received party-combat-join:', payload)
        
        if (!this.game.isPartyCombat) return
        if (payload.combatId !== this.game.partyCombatId) return
        if (payload.userId === this.game.userId) return
        
        this.game.log(`${payload.playerName} joined the battle!`, 'info')
        this.game.partyMembers.push({
            userId: payload.userId,
            name: payload.playerName
        })
    }
    
    // Handler: Combat action from party member
    handlePartyCombatAction(payload) {
        console.log('Received party-combat-action:', payload)
        
        if (!this.game.isPartyCombat) return
        if (payload.combatId !== this.game.partyCombatId) return
        if (payload.userId === this.game.userId) return
        
        // Apply the damage to our local enemy state
        if (payload.targetIndex !== undefined && payload.damage !== undefined) {
            const result = this.game.applyPartyMemberDamage(
                payload.targetIndex, 
                payload.damage, 
                payload.playerName
            )
            
            // Notify UI to update
            if (this.onPartyCombatAction) {
                this.onPartyCombatAction(payload, result)
            }
        }
    }
    
    // Handler: Combat ended
    handlePartyCombatEnd(payload) {
        console.log('Received party-combat-end:', payload)
        
        // Clear pending invite if it matches
        if (this.pendingCombatInvite && this.pendingCombatInvite.combatId === payload.combatId) {
            this.pendingCombatInvite = null
            if (this.onPartyCombatInvite) {
                this.onPartyCombatInvite(null)
            }
        }
        
        // If we're in this combat, end it
        if (this.game.isPartyCombat && this.game.partyCombatId === payload.combatId) {
            if (payload.userId !== this.game.userId) {
                // Someone else ended the combat
                if (payload.victory) {
                    this.game.log('Victory! The enemy was defeated!', 'reward')
                } else {
                    this.game.log('The battle was lost...', 'combat')
                }
                
                // End our combat state
                this.game.inCombat = false
                this.game.currentEnemies = []
                this.game.isPartyCombat = false
                this.game.partyCombatId = null
                
                if (this.onPartyCombatEnd) {
                    this.onPartyCombatEnd(payload.victory)
                }
            }
        }
    }
    
    // Join an ongoing party combat
    joinPartyCombat() {
        if (!this.pendingCombatInvite) return false
        
        const invite = this.pendingCombatInvite
        this.pendingCombatInvite = null
        
        // Join the combat
        this.game.joinPartyCombat(invite.combatId, invite.enemies, invite.starterName)
        
        // Broadcast that we joined
        this.broadcastCombatJoin(invite.combatId)
        
        // Clear UI
        if (this.onPartyCombatInvite) {
            this.onPartyCombatInvite(null)
        }
        
        return true
    }
}
