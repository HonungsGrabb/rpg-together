import { supabase } from './supabase-client.js'
import { RACES, CLASSES, ITEMS, SPELLS, EQUIPMENT_SLOT_IDS, getLootDrop, generateRandomItem } from './data.js'
import { Dungeon } from './dungeon.js'
import { WorldArea } from './world.js'
import { Multiplayer } from './multiplayer.js'

const BASE_STATS = { hp: 100, mana: 50, physicalPower: 5, magicPower: 5, defense: 3, magicResist: 3, speed: 5 }

export class Game {
    constructor() {
        this.userId = null; this.saves = []; this.currentSlot = null; this.player = null
        this.dungeon = null; this.world = null; this.inDungeon = false; this.inCombat = false
        this.currentEnemies = []; this.targetIndex = 0; this.enemyPosition = null
        this.combatBuffs = []; this.combatDebuffs = []; this.enemyDots = []
        this.gameLog = []; this.generatedItems = {}
        this.multiplayer = new Multiplayer(this)
        
        // Party combat
        this.isPartyCombat = false
        this.partyCombatId = null
        this.partyMembers = [] // Other party members in this combat
        this.waitingForParty = false
        this.myTurnTaken = false
    }
    
    // For backwards compatibility
    get currentEnemy() { return this.currentEnemies[this.targetIndex] || null }
    set currentEnemy(val) { 
        if (val) this.currentEnemies = [val]
        else this.currentEnemies = []
    }

    async loadSaves(userId) {
        this.userId = userId
        const { data } = await supabase.from('save_slots').select('*').eq('user_id', userId).order('slot', { ascending: true })
        this.saves = data || []; return this.saves
    }

    async createNewGame(slot, name, raceId, classId, symbol = '@', color = '#4a9eff') {
        const race = RACES[raceId], cls = CLASSES[classId]
        const maxHp = BASE_STATS.hp + race.bonuses.hp + cls.bonuses.hp
        const maxMana = BASE_STATS.mana + race.bonuses.mana + cls.bonuses.mana
        const playerData = {
            name, race: raceId, class: classId, level: 1, xp: 0, xpToLevel: 100,
            hp: maxHp, maxHp, mana: maxMana, maxMana,
            basePhysicalPower: BASE_STATS.physicalPower + race.bonuses.physicalPower + cls.bonuses.physicalPower,
            baseMagicPower: BASE_STATS.magicPower + race.bonuses.magicPower + cls.bonuses.magicPower,
            baseDefense: BASE_STATS.defense + race.bonuses.defense + cls.bonuses.defense,
            baseMagicResist: BASE_STATS.magicResist + race.bonuses.magicResist + cls.bonuses.magicResist,
            baseSpeed: BASE_STATS.speed + race.bonuses.speed + cls.bonuses.speed,
            gold: 50, dungeonFloor: 0, worldX: 0, worldY: 0,
            symbol, color, // Player appearance customization
            equipment: { weapon: cls.startingWeapon, offhand: null, helmet: null, chest: null, leggings: null, boots: null, amulet: null, ring1: null, ring2: null },
            inventory: ['health_potion', 'health_potion', 'mana_potion', 'warp_scroll'],
            learnedSpells: [], generatedItems: {},
            stats: { enemiesKilled: 0, dungeonsCleared: 0, floorsExplored: 0, totalGold: 50 }
        }
        await supabase.from('save_slots').upsert({ user_id: this.userId, slot, player_data: playerData, updated_at: new Date().toISOString() }, { onConflict: 'user_id,slot' })
        return this.loadGame(slot)
    }

    async loadGame(slot) {
        const { data } = await supabase.from('save_slots').select('*').eq('user_id', this.userId).eq('slot', slot).single()
        if (!data) return false
        this.currentSlot = slot; this.player = data.player_data; this.gameLog = []; this.inDungeon = false; this.inCombat = false
        this.generatedItems = this.player.generatedItems || {}
        this.world = new WorldArea(20, 15); this.world.generate(this.player.worldX, this.player.worldY, this.player.level)
        this.log(this.player.worldX === 0 && this.player.worldY === 0 ? 'Castle courtyard. Explore to find dungeons!' : `You are in the ${this.world.biome}.`, 'info')
        
        // Connect multiplayer
        await this.multiplayer.connect()
        
        return true
    }

    async saveGame() {
        if (!this.currentSlot || !this.player) return
        this.player.generatedItems = this.generatedItems
        await supabase.from('save_slots').update({ player_data: this.player, updated_at: new Date().toISOString() }).eq('user_id', this.userId).eq('slot', this.currentSlot)
        await this.multiplayer.updatePresence()
    }

    async disconnectMultiplayer() {
        await this.multiplayer.disconnect()
    }

    async deleteGame(slot) { return !(await supabase.from('save_slots').delete().eq('user_id', this.userId).eq('slot', slot)).error }

    getItem(itemId) { return ITEMS[itemId] || this.generatedItems[itemId] }

    getStat(statName) {
        let value = this.player[`base${statName.charAt(0).toUpperCase() + statName.slice(1)}`] || 0
        for (const slotId of EQUIPMENT_SLOT_IDS) {
            const item = this.getItem(this.player.equipment[slotId])
            if (item?.stats?.[statName]) value += item.stats[statName]
        }
        for (const buff of this.combatBuffs) if (buff[statName]) value += buff[statName]
        return value
    }

    getPhysicalPower() { return this.getStat('physicalPower') }
    getMagicPower() { return this.getStat('magicPower') }
    getDefense() { return this.getStat('defense') }
    getMagicResist() { return this.getStat('magicResist') }
    getSpeed() { return this.getStat('speed') }

    getWeaponDamage() {
        let phys = 0, magic = 0
        for (const slotId of ['weapon', 'offhand']) {
            const item = this.getItem(this.player.equipment[slotId])
            if (item?.stats?.physicalDamage) phys += item.stats.physicalDamage
            if (item?.stats?.magicDamage) magic += item.stats.magicDamage
        }
        return { physical: phys, magic }
    }

    getMaxHp() {
        let hp = this.player.maxHp
        for (const slotId of EQUIPMENT_SLOT_IDS) { const item = this.getItem(this.player.equipment[slotId]); if (item?.stats?.hp) hp += item.stats.hp }
        return hp
    }

    getMaxMana() {
        let mana = this.player.maxMana
        for (const slotId of EQUIPMENT_SLOT_IDS) { const item = this.getItem(this.player.equipment[slotId]); if (item?.stats?.mana) mana += item.stats.mana }
        return mana
    }

    move(direction) {
        if (this.inCombat) return { success: false }
        const dirs = { w: { dx: 0, dy: -1 }, a: { dx: -1, dy: 0 }, s: { dx: 0, dy: 1 }, d: { dx: 1, dy: 0 } }
        const dir = dirs[direction.toLowerCase()]; if (!dir) return { success: false }
        return this.inDungeon ? this.moveDungeon(dir.dx, dir.dy) : this.moveWorld(dir.dx, dir.dy)
    }

    moveDungeon(dx, dy) {
        const result = this.dungeon.movePlayer(dx, dy)
        if (result.encounter) {
            if (result.encounter.type === 'enemy') { this.startCombat(result.encounter.enemies, result.encounter.x, result.encounter.y); return { success: true, combat: true } }
            if (result.encounter.type === 'stairs') return { success: true, stairs: true }
            if (result.encounter.type === 'exit') return { success: true, exit: true }
            if (result.encounter.type === 'chest' && result.encounter.loot) {
                this.addItemToInventory(result.encounter.loot)
                this.saveGame()
            }
        }
        return { success: result.moved }
    }

    moveWorld(dx, dy) {
        const result = this.world.movePlayer(dx, dy)
        if (result.transition) {
            this.player.worldX += result.transition.dx; this.player.worldY += result.transition.dy
            this.world.generate(this.player.worldX, this.player.worldY, this.player.level)
            this.world.playerPos = { x: result.transition.newX, y: result.transition.newY }
            this.log(`Entered ${this.world.biome} (${this.player.worldX}, ${this.player.worldY})`, 'info')
            this.saveGame()
            return { success: true, newArea: true }
        }
        if (result.encounter) {
            if (result.encounter.type === 'enemy') { this.startCombat(result.encounter.enemies, result.encounter.x, result.encounter.y); return { success: true, combat: true } }
            if (result.encounter.type === 'dungeon') return { success: true, dungeon: true }
        }
        return { success: result.moved }
    }

    enterDungeon() {
        this.inDungeon = true; this.player.dungeonFloor = 1; this.dungeon = new Dungeon(17, 13); this.dungeon.generate(1)
        this.player.stats.floorsExplored++; this.log(`Entered dungeon floor 1`, 'info'); this.saveGame()
    }

    descendDungeon() {
        this.player.dungeonFloor++; this.dungeon.generate(this.player.dungeonFloor)
        this.player.stats.floorsExplored++; this.log(`Descended to floor ${this.player.dungeonFloor}`, 'info'); this.saveGame()
    }

    exitDungeon() {
        this.inDungeon = false; this.dungeon = null; this.log('Returned to surface', 'info'); this.saveGame()
    }

    startCombat(enemies, x, y, isJoining = false, combatId = null, existingEnemies = null) {
        this.inCombat = true
        this.isPartyCombat = false  // Default to false, will be set true if needed
        this.partyCombatId = null
        
        // If joining existing combat, use provided enemies
        if (isJoining && existingEnemies) {
            this.currentEnemies = existingEnemies.map(e => ({ ...e }))
            this.isPartyCombat = true
            this.partyCombatId = combatId
        } else {
            // Accept either single enemy or array
            if (Array.isArray(enemies)) {
                this.currentEnemies = enemies.map(e => ({ ...e }))
            } else {
                this.currentEnemies = [{ ...enemies }]
            }
        }
        
        this.targetIndex = 0
        this.enemyPosition = { x, y }
        this.combatBuffs = []; this.combatDebuffs = []; this.enemyDots = new Array(this.currentEnemies.length).fill(null)
        this.partyMembers = []
        this.myTurnTaken = false
        this.waitingForParty = false
        
        if (this.currentEnemies.length === 1) {
            this.log(`⚔️ ${this.currentEnemies[0].emoji} ${this.currentEnemies[0].name} attacks!`, 'combat')
        } else {
            const names = this.currentEnemies.map(e => e.name).join(', ')
            this.log(`⚔️ A group attacks: ${names}!`, 'combat')
        }
        
        // If in party and not joining, broadcast combat start
        if (!isJoining && this.multiplayer.isInParty()) {
            this.isPartyCombat = true
            this.partyCombatId = `combat_${this.userId}_${Date.now()}`
            this.multiplayer.broadcastCombatStart(this.partyCombatId, this.currentEnemies, x, y)
        }
    }
    
    setTarget(index) {
        if (index >= 0 && index < this.currentEnemies.length && this.currentEnemies[index].hp > 0) {
            this.targetIndex = index
        }
    }
    
    getAliveEnemies() {
        return this.currentEnemies.filter(e => e.hp > 0)
    }

    calculatePhysicalDamage(rawDamage, targetDefense) { return Math.max(1, Math.floor(rawDamage - targetDefense * 0.5) + Math.floor(Math.random() * 5) - 2) }
    calculateMagicDamage(rawDamage, targetMagicResist) { return Math.max(1, Math.floor(rawDamage - targetMagicResist * 0.5) + Math.floor(Math.random() * 5) - 2) }

    playerAttack() {
        if (!this.inCombat || this.getAliveEnemies().length === 0) return null
        
        // Make sure target is valid
        if (!this.currentEnemy || this.currentEnemy.hp <= 0) {
            this.targetIndex = this.currentEnemies.findIndex(e => e.hp > 0)
            if (this.targetIndex === -1) return null
        }
        
        let result = { playerDamage: 0, enemyDamage: 0, enemyDefeated: false, allDefeated: false, playerDefeated: false }
        
        // Player always attacks first in their turn
        result = this.executePlayerAttack(result)
        
        // Broadcast damage to party if in party combat
        if (this.isPartyCombat && !result.allDefeated) {
            this.multiplayer.broadcastCombatAction({
                type: 'attack',
                targetIndex: this.targetIndex,
                damage: result.playerDamage,
                enemyHp: this.currentEnemy?.hp,
                enemyMaxHp: this.currentEnemy?.maxHp,
                playerName: this.player.name
            })
        }
        
        // Enemies counter-attack this player
        if (!result.allDefeated) {
            result = this.executeAllEnemyAttacks(result)
        }
        
        this.processDots(result)
        this.tickBuffs()
        return result
    }

    // Called when receiving party member's attack
    applyPartyMemberDamage(targetIndex, damage, attackerName) {
        if (targetIndex >= 0 && targetIndex < this.currentEnemies.length) {
            const enemy = this.currentEnemies[targetIndex]
            if (enemy.hp > 0) {
                enemy.hp = Math.max(0, enemy.hp - damage)
                this.log(`${attackerName} hits ${enemy.name} for ${damage}!`, 'combat')
                
                if (enemy.hp <= 0) {
                    this.log(`${enemy.emoji} ${enemy.name} defeated!`, 'reward')
                    
                    // Award XP/gold to this player too (party shares rewards)
                    this.player.xp += enemy.xp
                    this.player.gold += enemy.gold
                    this.player.stats.totalGold += enemy.gold
                    this.player.stats.enemiesKilled++
                    this.log(`+${enemy.xp} XP, +${enemy.gold} gold`, 'reward')
                    this.checkLevelUp()
                    
                    if (this.getAliveEnemies().length === 0) {
                        this.endCombat(true)
                        return { allDefeated: true }
                    }
                }
            }
        }
        return { allDefeated: false }
    }

    executePlayerAttack(result) {
        const target = this.currentEnemy
        if (!target || target.hp <= 0) return result
        
        const wpnDmg = this.getWeaponDamage()
        const physRaw = wpnDmg.physical + this.getPhysicalPower() * 0.5
        const physDmg = this.calculatePhysicalDamage(physRaw, target.defense)
        target.hp -= physDmg
        result.playerDamage = physDmg
        this.log(`You hit ${target.name} for ${physDmg} damage!`, 'combat')
        
        if (target.hp <= 0) {
            this.log(`${target.emoji} ${target.name} defeated!`, 'reward')
            result.enemyDefeated = true
            
            // Award XP/gold for this enemy
            this.player.xp += target.xp
            this.player.gold += target.gold
            this.player.stats.totalGold += target.gold
            this.player.stats.enemiesKilled++
            this.log(`+${target.xp} XP, +${target.gold} gold`, 'reward')
            this.checkLevelUp()
            
            // Check if all enemies defeated
            if (this.getAliveEnemies().length === 0) {
                result.allDefeated = true
                this.endCombat(true)
            } else {
                // Switch to next alive enemy
                this.targetIndex = this.currentEnemies.findIndex(e => e.hp > 0)
            }
        }
        return result
    }

    executeAllEnemyAttacks(result) {
        let totalDamage = 0
        for (const enemy of this.getAliveEnemies()) {
            const physDmg = this.calculatePhysicalDamage(enemy.physicalDamage, this.getDefense())
            const magDmg = enemy.magicDamage > 0 ? this.calculateMagicDamage(enemy.magicDamage, this.getMagicResist()) : 0
            const dmg = physDmg + magDmg
            this.player.hp -= dmg
            totalDamage += dmg
            this.log(`${enemy.name} hits you for ${dmg}!${magDmg > 0 ? ` (${physDmg} phys + ${magDmg} magic)` : ''}`, 'combat')
        }
        result.enemyDamage = totalDamage
        
        // Broadcast our HP to party members
        if (this.isPartyCombat && totalDamage > 0) {
            this.multiplayer.broadcastPlayerDamage()
        }
        
        if (this.player.hp <= 0) { 
            result.playerDefeated = true
            this.player.hp = 0
            this.endCombat(false)
        }
        return result
    }

    // Keep old method name for compatibility
    executeEnemyAttack(result) {
        return this.executeAllEnemyAttacks(result)
    }

    castSpell(spellId) {
        if (!this.inCombat) return null
        const spell = SPELLS[spellId]; if (!spell || this.player.mana < spell.manaCost) { this.log('Not enough mana!', 'info'); return null }
        this.player.mana -= spell.manaCost; this.log(`Cast ${spell.emoji} ${spell.name}!`, 'combat')
        let result = { playerDamage: 0, enemyDamage: 0, enemyDefeated: false, playerDefeated: false }
        const eff = spell.effect
        const wpnDmg = this.getWeaponDamage()
        let physDmg = 0, magDmg = 0
        
        // Physical spells scale with physical power
        if (eff.basePhysical) {
            const raw = eff.basePhysical + this.getPhysicalPower() * (eff.physicalScaling || 1)
            const hits = eff.hits || 1
            for (let i = 0; i < hits; i++) physDmg += this.calculatePhysicalDamage(raw, this.currentEnemy.defense)
        }
        
        // Magic spells scale with magic power AND weapon magic damage
        if (eff.baseMagic) {
            const raw = eff.baseMagic + this.getMagicPower() * (eff.magicScaling || 1) + wpnDmg.magic * 0.5
            magDmg = this.calculateMagicDamage(raw, this.currentEnemy.magicResist)
        }
        
        const totalDmg = physDmg + magDmg
        if (totalDmg > 0) { 
            this.currentEnemy.hp -= totalDmg
            result.playerDamage = totalDmg
            if (physDmg > 0 && magDmg > 0) {
                this.log(`Deals ${totalDmg} damage! (${physDmg} phys + ${magDmg} magic)`, 'combat')
            } else {
                this.log(`Deals ${totalDmg} ${physDmg > 0 ? 'physical' : 'magic'} damage!`, 'combat')
            }
            
            // Broadcast spell damage to party
            if (this.isPartyCombat) {
                this.multiplayer.broadcastCombatAction({
                    type: 'spell',
                    spellName: spell.name,
                    targetIndex: this.targetIndex,
                    damage: totalDmg,
                    enemyHp: this.currentEnemy?.hp,
                    enemyMaxHp: this.currentEnemy?.maxHp,
                    playerName: this.player.name
                })
            }
        }
        if (eff.baseHeal) { const heal = Math.floor(eff.baseHeal + this.getMagicPower() * (eff.healScaling || 1)); const old = this.player.hp; this.player.hp = Math.min(this.getMaxHp(), this.player.hp + heal); this.log(`Healed ${this.player.hp - old} HP!`, 'heal') }
        if (eff.buff) { this.combatBuffs.push({ ...eff.buff }); this.log(`Buff for ${eff.buff.turns} turns!`, 'info') }
        if (eff.debuff) { this.combatDebuffs.push({ ...eff.debuff }); this.log(`Enemy debuffed!`, 'info') }
        if (eff.dot) { this.enemyDots[this.targetIndex] = { ...eff.dot }; this.log(`Applied poison to ${this.currentEnemy.name}!`, 'info') }
        
        if (this.currentEnemy.hp <= 0) { 
            this.log(`${this.currentEnemy.emoji} ${this.currentEnemy.name} defeated!`, 'reward')
            result.enemyDefeated = true
            
            if (this.getAliveEnemies().length === 0) {
                result.allDefeated = true
                this.endCombat(true)
                return result
            } else {
                // Award partial rewards
                this.player.xp += this.currentEnemy.xp
                this.player.gold += this.currentEnemy.gold
                this.player.stats.totalGold += this.currentEnemy.gold
                this.player.stats.enemiesKilled++
                this.log(`+${this.currentEnemy.xp} XP, +${this.currentEnemy.gold} gold`, 'reward')
                this.checkLevelUp()
                this.targetIndex = this.currentEnemies.findIndex(e => e.hp > 0)
            }
        }
        
        if (!result.allDefeated) {
            result = this.executeAllEnemyAttacks(result)
            this.processDots(result)
        }
        this.tickBuffs()
        return result
    }

    processDots(result) {
        for (let i = 0; i < this.currentEnemies.length; i++) {
            const enemy = this.currentEnemies[i]
            const dot = this.enemyDots[i]
            if (dot && enemy.hp > 0 && !result.allDefeated) {
                enemy.hp -= dot.damage
                this.log(`Poison deals ${dot.damage} to ${enemy.name}!`, 'combat')
                dot.turns--
                if (dot.turns <= 0) this.enemyDots[i] = null
                
                if (enemy.hp <= 0) {
                    this.log(`${enemy.emoji} ${enemy.name} defeated!`, 'reward')
                    this.player.xp += enemy.xp
                    this.player.gold += enemy.gold
                    this.player.stats.totalGold += enemy.gold
                    this.player.stats.enemiesKilled++
                    this.log(`+${enemy.xp} XP, +${enemy.gold} gold`, 'reward')
                    this.checkLevelUp()
                    
                    if (this.getAliveEnemies().length === 0) {
                        result.allDefeated = true
                        this.endCombat(true)
                    } else if (this.targetIndex === i) {
                        this.targetIndex = this.currentEnemies.findIndex(e => e.hp > 0)
                    }
                }
            }
        }
    }
    
    // Old method name for compatibility
    processDot(result) { this.processDots(result) }

    tickBuffs() {
        this.combatBuffs = this.combatBuffs.filter(b => { b.turns--; return b.turns > 0 })
        this.combatDebuffs = this.combatDebuffs.filter(d => { d.turns--; return d.turns > 0 })
    }

    flee() {
        if (!this.inCombat) return false
        const avgSpeed = this.getAliveEnemies().reduce((sum, e) => sum + e.speed, 0) / this.getAliveEnemies().length
        if (Math.random() < 0.4 + (this.getSpeed() - avgSpeed) * 0.05) {
            this.log('You escaped!', 'info')
            this.inCombat = false
            this.currentEnemies = []
            this.targetIndex = 0
            this.enemyPosition = null
            this.combatBuffs = []
            this.combatDebuffs = []
            this.enemyDots = []
            return true
        }
        this.log('Failed to escape!', 'combat')
        this.executeAllEnemyAttacks({ playerDamage: 0, enemyDamage: 0, enemyDefeated: false, allDefeated: false, playerDefeated: false })
        return false
    }

    endCombat(victory) {
        // Broadcast combat end to party
        if (this.isPartyCombat) {
            this.multiplayer.broadcastCombatEnd(this.partyCombatId, victory)
        }
        
        if (victory) {
            // Award loot only (XP/gold already awarded per enemy)
            const floor = this.inDungeon ? this.player.dungeonFloor : 1
            const loot = getLootDrop(floor, false)
            if (loot) this.addItemToInventory(loot)
            if (this.inDungeon) { this.dungeon.removeEnemy(this.enemyPosition.x, this.enemyPosition.y); this.dungeon.playerPos = { ...this.enemyPosition }; this.dungeon.revealAround(this.enemyPosition.x, this.enemyPosition.y) }
            else if (this.world && this.enemyPosition) { this.world.removeEnemy(this.enemyPosition.x, this.enemyPosition.y); this.world.playerPos = { ...this.enemyPosition } }
            this.log('Victory!', 'reward')
        } else this.log('💀 You died!', 'death')
        
        // Reset combat state
        this.inCombat = false
        this.currentEnemies = []
        this.targetIndex = 0
        this.enemyPosition = null
        this.combatBuffs = []
        this.combatDebuffs = []
        this.enemyDots = []
        this.isPartyCombat = false
        this.partyCombatId = null
        this.partyMembers = []
        this.saveGame()
    }
    
    // Join existing party combat
    joinPartyCombat(combatId, enemies, starterName) {
        this.log(`⚔️ Joining ${starterName}'s battle!`, 'info')
        this.startCombat(null, 0, 0, true, combatId, enemies)
    }

    addItemToInventory(item) {
        if (this.player.inventory.length >= 20) { this.log(`Found ${item.name} but inventory full!`, 'info'); return false }
        if (item.generated) { this.generatedItems[item.id] = item; this.player.inventory.push(item.id) }
        else this.player.inventory.push(item.id)
        this.log(`Found ${item.emoji} ${item.name}!`, 'reward'); return true
    }

    checkLevelUp() {
        while (this.player.xp >= this.player.xpToLevel) {
            this.player.xp -= this.player.xpToLevel; this.player.level++; this.player.xpToLevel = Math.floor(this.player.xpToLevel * 1.5)
            this.player.maxHp += 15; this.player.maxMana += 10; this.player.hp = this.getMaxHp(); this.player.mana = this.getMaxMana()
            this.player.basePhysicalPower += 2; this.player.baseMagicPower += 2; this.player.baseDefense += 1; this.player.baseMagicResist += 1; this.player.baseSpeed += 1
            this.log(`🎉 LEVEL UP! Now level ${this.player.level}`, 'levelup')
        }
    }

    useItem(index) {
        const itemId = this.player.inventory[index]; const item = this.getItem(itemId); if (!item) return false
        if (item.type === 'consumable') {
            if (item.effect.heal) { const old = this.player.hp; this.player.hp = Math.min(this.getMaxHp(), this.player.hp + item.effect.heal); this.log(`Used ${item.name}, healed ${this.player.hp - old} HP`, 'heal') }
            if (item.effect.restoreMana) { const old = this.player.mana; this.player.mana = Math.min(this.getMaxMana(), this.player.mana + item.effect.restoreMana); this.log(`Used ${item.name}, restored ${this.player.mana - old} mana`, 'heal') }
            if (item.effect.warp) { 
                // Teleport to castle (0,0)
                this.player.worldX = 0
                this.player.worldY = 0
                this.inDungeon = false
                this.dungeon = null
                this.world = new WorldArea(20, 15)
                this.world.generate(0, 0, this.player.level)
                this.log(`🌀 Warped back to the castle!`, 'info')
            }
            this.player.inventory.splice(index, 1); this.saveGame(); return item.effect.warp ? 'warp' : true
        }
        if (item.type === 'scroll') return this.learnSpell(index)
        return false
    }

    learnSpell(index) {
        const itemId = this.player.inventory[index]; const item = this.getItem(itemId); if (!item || item.type !== 'scroll') return false
        const spell = SPELLS[item.spellId]; if (!spell) return false
        if (this.player.level < spell.levelReq) { this.log(`Need level ${spell.levelReq}`, 'info'); return false }
        const playerClass = CLASSES[this.player.class]
        if (spell.class !== 'all' && !playerClass.canLearn.includes(spell.class)) { this.log(`Your class cannot learn this`, 'info'); return false }
        if (this.player.learnedSpells.includes(item.spellId)) { this.log(`Already know ${spell.name}`, 'info'); return false }
        this.player.learnedSpells.push(item.spellId); this.player.inventory.splice(index, 1)
        this.log(`Learned ${spell.emoji} ${spell.name}!`, 'reward'); this.saveGame(); return true
    }

    equipItem(index) {
        const itemId = this.player.inventory[index]; const item = this.getItem(itemId); if (!item) return false
        if (item.levelReq && this.player.level < item.levelReq) { this.log(`Need level ${item.levelReq}`, 'info'); return false }
        let slot = item.type; if (item.type === 'ring') slot = this.player.equipment.ring1 ? 'ring2' : 'ring1'
        if (!EQUIPMENT_SLOT_IDS.includes(slot)) return false
        const current = this.player.equipment[slot]; this.player.equipment[slot] = itemId; this.player.inventory.splice(index, 1)
        if (current) this.player.inventory.push(current)
        this.log(`Equipped ${item.emoji} ${item.name}`, 'info'); this.saveGame(); return true
    }

    unequipItem(slot) {
        const itemId = this.player.equipment[slot]; if (!itemId) return false
        if (this.player.inventory.length >= 20) { this.log('Inventory full!', 'info'); return false }
        const item = this.getItem(itemId); this.player.equipment[slot] = null; this.player.inventory.push(itemId)
        this.log(`Unequipped ${item.name}`, 'info'); this.saveGame(); return true
    }

    dropItem(index) {
        const itemId = this.player.inventory[index]; const item = this.getItem(itemId)
        this.player.inventory.splice(index, 1); if (this.generatedItems[itemId]) delete this.generatedItems[itemId]
        this.log(`Dropped ${item.name}`, 'info'); this.saveGame(); return true
    }

    log(message, type = '') { this.gameLog.push({ message, type, time: Date.now() }); if (this.gameLog.length > 100) this.gameLog.shift() }
}
