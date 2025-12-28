import { supabase } from './supabase-client.js'
import { RACES, CLASSES, ITEMS, SPELLS, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_IDS, getLootDrop } from './data.js'
import { Dungeon } from './dungeon.js'
import { WorldArea } from './world.js'

const BASE_STATS = {
    hp: 100,
    mana: 50,
    attack: 5,
    defense: 3,
    speed: 5
}

export class Game {
    constructor() {
        this.userId = null
        this.saves = []
        this.currentSlot = null
        this.player = null
        this.dungeon = null
        this.world = null
        this.inDungeon = false
        this.inCombat = false
        this.currentEnemy = null
        this.enemyPosition = null
        this.combatBuffs = []
        this.combatDebuffs = []
        this.enemyDot = null
        this.gameLog = []
    }

    // =====================
    // SAVE MANAGEMENT
    // =====================
    
    async loadSaves(userId) {
        this.userId = userId
        const { data, error } = await supabase
            .from('save_slots')
            .select('*')
            .eq('user_id', userId)
            .order('slot', { ascending: true })
        
        if (error) {
            console.error('Error loading saves:', error)
            return []
        }
        this.saves = data || []
        return this.saves
    }

    async createNewGame(slot, name, raceId, classId) {
        const race = RACES[raceId]
        const cls = CLASSES[classId]
        
        const maxHp = BASE_STATS.hp + race.bonuses.hp + cls.bonuses.hp
        const maxMana = BASE_STATS.mana + race.bonuses.mana + cls.bonuses.mana
        const startingWeapon = cls.startingWeapon
        
        const playerData = {
            name,
            race: raceId,
            class: classId,
            level: 1,
            xp: 0,
            xpToLevel: 100,
            hp: maxHp,
            maxHp: maxHp,
            mana: maxMana,
            maxMana: maxMana,
            baseAttack: BASE_STATS.attack + race.bonuses.attack + cls.bonuses.attack,
            baseDefense: BASE_STATS.defense + race.bonuses.defense + cls.bonuses.defense,
            baseSpeed: BASE_STATS.speed + race.bonuses.speed + cls.bonuses.speed,
            gold: 50,
            dungeonFloor: 0,
            worldX: 0,
            worldY: 0,
            equipment: {
                weapon: startingWeapon,
                offhand: null,
                helmet: null,
                chest: null,
                leggings: null,
                boots: null,
                amulet: null,
                ring1: null,
                ring2: null
            },
            inventory: ['health_potion', 'health_potion', 'mana_potion'],
            learnedSpells: [],
            stats: {
                enemiesKilled: 0,
                dungeonsCleared: 0,
                floorsExplored: 0,
                totalGold: 50
            }
        }
        
        const { error } = await supabase
            .from('save_slots')
            .upsert({
                user_id: this.userId,
                slot: slot,
                player_data: playerData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,slot' })
        
        if (error) {
            console.error('Error creating save:', error)
            return null
        }
        
        return this.loadGame(slot)
    }

    async loadGame(slot) {
        const { data, error } = await supabase
            .from('save_slots')
            .select('*')
            .eq('user_id', this.userId)
            .eq('slot', slot)
            .single()
        
        if (error || !data) {
            console.error('Error loading game:', error)
            return false
        }
        
        this.currentSlot = slot
        this.player = data.player_data
        this.gameLog = []
        this.inDungeon = false
        this.inCombat = false
        
        // Initialize world at castle
        this.world = new WorldArea(20, 15)
        this.world.generate(this.player.worldX, this.player.worldY, this.player.level)
        
        if (this.player.worldX === 0 && this.player.worldY === 0) {
            this.log('You stand in the castle courtyard. Explore the world to find dungeons!', 'info')
        } else {
            this.log(`You are in the ${this.world.biome}.`, 'info')
        }
        
        return true
    }

    async saveGame() {
        if (!this.currentSlot || !this.player) return
        
        const { error } = await supabase
            .from('save_slots')
            .update({
                player_data: this.player,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', this.userId)
            .eq('slot', this.currentSlot)
        
        if (error) console.error('Save error:', error)
    }

    async deleteGame(slot) {
        const { error } = await supabase
            .from('save_slots')
            .delete()
            .eq('user_id', this.userId)
            .eq('slot', slot)
        
        return !error
    }

    // =====================
    // PLAYER STATS
    // =====================
    
    getStat(statName) {
        let value = this.player[`base${statName.charAt(0).toUpperCase() + statName.slice(1)}`] || 0
        
        // Add equipment bonuses
        for (const slotId of EQUIPMENT_SLOT_IDS) {
            const itemId = this.player.equipment[slotId]
            if (itemId && ITEMS[itemId]?.stats?.[statName]) {
                value += ITEMS[itemId].stats[statName]
            }
        }
        
        // Add combat buffs
        for (const buff of this.combatBuffs) {
            if (buff[statName]) value += buff[statName]
        }
        
        return value
    }

    getAttack() { return this.getStat('attack') }
    getDefense() { return this.getStat('defense') }
    getSpeed() { return this.getStat('speed') }
    
    getMaxHp() {
        let hp = this.player.maxHp
        for (const slotId of EQUIPMENT_SLOT_IDS) {
            const itemId = this.player.equipment[slotId]
            if (itemId && ITEMS[itemId]?.stats?.hp) {
                hp += ITEMS[itemId].stats.hp
            }
        }
        return hp
    }

    getMaxMana() {
        let mana = this.player.maxMana
        for (const slotId of EQUIPMENT_SLOT_IDS) {
            const itemId = this.player.equipment[slotId]
            if (itemId && ITEMS[itemId]?.stats?.mana) {
                mana += ITEMS[itemId].stats.mana
            }
        }
        return mana
    }

    // =====================
    // MOVEMENT
    // =====================
    
    move(direction) {
        if (this.inCombat) return { success: false, message: 'In combat!' }
        
        const dirs = {
            'w': { dx: 0, dy: -1 },
            'a': { dx: -1, dy: 0 },
            's': { dx: 0, dy: 1 },
            'd': { dx: 1, dy: 0 }
        }
        
        const dir = dirs[direction.toLowerCase()]
        if (!dir) return { success: false }
        
        if (this.inDungeon) {
            return this.moveDungeon(dir.dx, dir.dy)
        } else {
            return this.moveWorld(dir.dx, dir.dy)
        }
    }

    moveDungeon(dx, dy) {
        const result = this.dungeon.movePlayer(dx, dy)
        
        if (result.encounter) {
            if (result.encounter.type === 'enemy') {
                this.startCombat(result.encounter.enemy, result.encounter.x, result.encounter.y)
                return { success: true, combat: true }
            } else if (result.encounter.type === 'stairs') {
                return { success: true, stairs: true }
            } else if (result.encounter.type === 'exit') {
                return { success: true, exit: true }
            } else if (result.encounter.type === 'chest') {
                if (result.encounter.loot) {
                    if (this.player.inventory.length < 20) {
                        this.player.inventory.push(result.encounter.loot.id)
                        this.log(`Opened chest: ${result.encounter.loot.emoji} ${result.encounter.loot.name}!`, 'reward')
                    } else {
                        this.log(`Chest contained ${result.encounter.loot.name} but inventory full!`, 'info')
                    }
                    this.saveGame()
                }
                return { success: true }
            }
        }
        
        return { success: result.moved }
    }

    moveWorld(dx, dy) {
        const result = this.world.movePlayer(dx, dy)
        
        if (result.transition) {
            // Move to new area
            this.player.worldX += result.transition.dx
            this.player.worldY += result.transition.dy
            this.world.generate(this.player.worldX, this.player.worldY, this.player.level)
            this.world.playerPos = { x: result.transition.newX, y: result.transition.newY }
            this.log(`Entered ${this.world.biome} (${this.player.worldX}, ${this.player.worldY})`, 'info')
            this.saveGame()
            return { success: true, newArea: true }
        }
        
        if (result.encounter) {
            if (result.encounter.type === 'enemy') {
                this.startCombat(result.encounter.enemy, result.encounter.x, result.encounter.y)
                return { success: true, combat: true }
            } else if (result.encounter.type === 'dungeon') {
                return { success: true, dungeon: true }
            }
        }
        
        return { success: result.moved }
    }

    enterDungeon() {
        this.inDungeon = true
        this.player.dungeonFloor = 1
        this.dungeon = new Dungeon(17, 13)
        this.dungeon.generate(this.player.dungeonFloor)
        this.log(`Entered dungeon - Floor ${this.player.dungeonFloor}`, 'info')
        this.saveGame()
    }

    exitDungeon() {
        this.inDungeon = false
        this.player.dungeonFloor = 0
        this.player.stats.dungeonsCleared++
        this.log('Exited dungeon, returned to overworld', 'info')
        this.saveGame()
    }

    descendDungeon() {
        this.player.dungeonFloor++
        this.player.stats.floorsExplored++
        this.dungeon.generate(this.player.dungeonFloor)
        this.log(`Descended to floor ${this.player.dungeonFloor}`, 'info')
        this.saveGame()
    }

    // =====================
    // COMBAT
    // =====================
    
    startCombat(enemy, x, y) {
        this.inCombat = true
        this.currentEnemy = { ...enemy }
        this.enemyPosition = { x, y }
        this.combatBuffs = []
        this.combatDebuffs = []
        this.enemyDot = null
        this.log(`⚔️ ${enemy.emoji} ${enemy.name} attacks!`, 'combat')
    }

    playerAttack() {
        if (!this.inCombat || !this.currentEnemy) return null
        
        const playerSpeed = this.getSpeed()
        let enemySpeed = this.currentEnemy.speed
        
        // Apply debuffs to enemy
        for (const debuff of this.combatDebuffs) {
            if (debuff.speed) enemySpeed += debuff.speed
        }
        
        const playerFirst = playerSpeed >= enemySpeed
        let result = { playerDamage: 0, enemyDamage: 0, enemyDefeated: false, playerDefeated: false }
        
        if (playerFirst) {
            result = this.executePlayerAttack(result)
            if (!result.enemyDefeated) {
                result = this.executeEnemyAttack(result)
            }
        } else {
            result = this.executeEnemyAttack(result)
            if (!result.playerDefeated) {
                result = this.executePlayerAttack(result)
            }
        }
        
        // Process DOT
        if (this.enemyDot && !result.enemyDefeated) {
            this.currentEnemy.hp -= this.enemyDot.damage
            this.log(`Poison deals ${this.enemyDot.damage}!`, 'combat')
            this.enemyDot.turns--
            if (this.enemyDot.turns <= 0) this.enemyDot = null
            if (this.currentEnemy.hp <= 0) {
                result.enemyDefeated = true
                this.endCombat(true)
            }
        }
        
        // Decrement buff/debuff turns
        this.combatBuffs = this.combatBuffs.filter(b => { b.turns--; return b.turns > 0 })
        this.combatDebuffs = this.combatDebuffs.filter(d => { d.turns--; return d.turns > 0 })
        
        return result
    }

    executePlayerAttack(result) {
        const attack = this.getAttack()
        const defense = this.currentEnemy.defense
        const damage = Math.max(1, attack - defense + Math.floor(Math.random() * 5) - 2)
        
        this.currentEnemy.hp -= damage
        result.playerDamage = damage
        this.log(`You deal ${damage} damage!`, 'combat')
        
        if (this.currentEnemy.hp <= 0) {
            result.enemyDefeated = true
            this.endCombat(true)
        }
        
        return result
    }

    executeEnemyAttack(result) {
        const attack = this.currentEnemy.attack
        const defense = this.getDefense()
        const damage = Math.max(1, attack - defense + Math.floor(Math.random() * 5) - 2)
        
        this.player.hp -= damage
        result.enemyDamage = damage
        this.log(`${this.currentEnemy.name} deals ${damage}!`, 'combat')
        
        if (this.player.hp <= 0) {
            result.playerDefeated = true
            this.player.hp = 0
            this.endCombat(false)
        }
        
        return result
    }

    castSpell(spellId) {
        if (!this.inCombat) return null
        
        const spell = SPELLS[spellId]
        if (!spell) return null
        
        if (this.player.mana < spell.manaCost) {
            this.log('Not enough mana!', 'info')
            return null
        }
        
        this.player.mana -= spell.manaCost
        this.log(`Cast ${spell.emoji} ${spell.name}!`, 'combat')
        
        let result = { playerDamage: 0, enemyDamage: 0, enemyDefeated: false, playerDefeated: false }
        
        const effect = spell.effect
        
        // Damage
        if (effect.damage) {
            this.currentEnemy.hp -= effect.damage
            result.playerDamage = effect.damage
            this.log(`Deals ${effect.damage} damage!`, 'combat')
        }
        
        // Damage multiplier
        if (effect.damageMultiplier) {
            const baseDamage = Math.max(1, this.getAttack() - this.currentEnemy.defense)
            const damage = Math.floor(baseDamage * effect.damageMultiplier)
            this.currentEnemy.hp -= damage
            result.playerDamage = damage
            this.log(`Deals ${damage} damage!`, 'combat')
        }
        
        // Multi-hit
        if (effect.hits) {
            let totalDamage = 0
            for (let i = 0; i < effect.hits; i++) {
                const baseDamage = Math.max(1, this.getAttack() - this.currentEnemy.defense)
                const damage = Math.floor(baseDamage * (effect.damageMultiplier || 1))
                totalDamage += damage
            }
            this.currentEnemy.hp -= totalDamage
            result.playerDamage = totalDamage
            this.log(`${effect.hits} hits for ${totalDamage} total!`, 'combat')
        }
        
        // Heal
        if (effect.heal) {
            const oldHp = this.player.hp
            this.player.hp = Math.min(this.getMaxHp(), this.player.hp + effect.heal)
            this.log(`Healed ${this.player.hp - oldHp} HP!`, 'heal')
        }
        
        // Buff
        if (effect.buff) {
            this.combatBuffs.push({ ...effect.buff })
            this.log(`Gained buff for ${effect.buff.turns} turns!`, 'info')
        }
        
        // Debuff enemy
        if (effect.debuff) {
            this.combatDebuffs.push({ ...effect.debuff })
            this.log(`Enemy debuffed for ${effect.debuff.turns} turns!`, 'info')
        }
        
        // DOT
        if (effect.dot) {
            this.enemyDot = { ...effect.dot }
            this.log(`Applied poison for ${effect.dot.turns} turns!`, 'info')
        }
        
        // Check enemy death
        if (this.currentEnemy.hp <= 0) {
            result.enemyDefeated = true
            this.endCombat(true)
            return result
        }
        
        // Enemy turn
        result = this.executeEnemyAttack(result)
        
        // Process DOT
        if (this.enemyDot && !result.enemyDefeated) {
            this.currentEnemy.hp -= this.enemyDot.damage
            this.log(`Poison deals ${this.enemyDot.damage}!`, 'combat')
            this.enemyDot.turns--
            if (this.enemyDot.turns <= 0) this.enemyDot = null
            if (this.currentEnemy.hp <= 0) {
                result.enemyDefeated = true
                this.endCombat(true)
            }
        }
        
        // Decrement buffs
        this.combatBuffs = this.combatBuffs.filter(b => { b.turns--; return b.turns > 0 })
        this.combatDebuffs = this.combatDebuffs.filter(d => { d.turns--; return d.turns > 0 })
        
        return result
    }

    flee() {
        if (!this.inCombat) return false
        
        let enemySpeed = this.currentEnemy.speed
        for (const debuff of this.combatDebuffs) {
            if (debuff.speed) enemySpeed += debuff.speed
        }
        
        const fleeChance = 0.4 + (this.getSpeed() - enemySpeed) * 0.05
        
        if (Math.random() < fleeChance) {
            this.log('You escaped!', 'info')
            this.inCombat = false
            this.currentEnemy = null
            this.enemyPosition = null
            this.combatBuffs = []
            this.combatDebuffs = []
            this.enemyDot = null
            return true
        } else {
            this.log('Failed to escape!', 'combat')
            this.executeEnemyAttack({ playerDamage: 0, enemyDamage: 0, enemyDefeated: false, playerDefeated: false })
            return false
        }
    }

    endCombat(victory) {
        if (victory) {
            const enemy = this.currentEnemy
            
            this.player.xp += enemy.xp
            this.log(`+${enemy.xp} XP`, 'reward')
            
            this.player.gold += enemy.gold
            this.player.stats.totalGold += enemy.gold
            this.log(`+${enemy.gold} gold`, 'reward')
            
            this.player.stats.enemiesKilled++
            this.checkLevelUp()
            
            // Loot drop
            const floor = this.inDungeon ? this.player.dungeonFloor : 1
            const loot = getLootDrop(floor, false)
            if (loot) {
                if (this.player.inventory.length < 20) {
                    this.player.inventory.push(loot.id)
                    this.log(`Found ${loot.emoji} ${loot.name}!`, 'reward')
                } else {
                    this.log(`Found ${loot.name} but inventory full!`, 'info')
                }
            }
            
            // Remove enemy from map
            if (this.inDungeon) {
                this.dungeon.removeEnemy(this.enemyPosition.x, this.enemyPosition.y)
                this.dungeon.playerPos = { ...this.enemyPosition }
                this.dungeon.revealAround(this.enemyPosition.x, this.enemyPosition.y)
            } else {
                this.world.removeEnemy(this.enemyPosition.x, this.enemyPosition.y)
                this.world.playerPos = { ...this.enemyPosition }
            }
        } else {
            this.log('💀 You died!', 'death')
        }
        
        this.inCombat = false
        this.currentEnemy = null
        this.enemyPosition = null
        this.combatBuffs = []
        this.combatDebuffs = []
        this.enemyDot = null
        this.saveGame()
    }

    checkLevelUp() {
        while (this.player.xp >= this.player.xpToLevel) {
            this.player.xp -= this.player.xpToLevel
            this.player.level++
            this.player.xpToLevel = Math.floor(this.player.xpToLevel * 1.5)
            
            this.player.maxHp += 15
            this.player.maxMana += 10
            this.player.hp = this.getMaxHp()
            this.player.mana = this.getMaxMana()
            this.player.baseAttack += 2
            this.player.baseDefense += 1
            this.player.baseSpeed += 1
            
            this.log(`🎉 LEVEL UP! Now level ${this.player.level}`, 'levelup')
        }
    }

    // =====================
    // INVENTORY & EQUIPMENT
    // =====================
    
    useItem(index) {
        const itemId = this.player.inventory[index]
        if (!itemId) return false
        
        const item = ITEMS[itemId]
        if (!item) return false
        
        if (item.type === 'consumable') {
            if (item.effect.heal) {
                const oldHp = this.player.hp
                this.player.hp = Math.min(this.getMaxHp(), this.player.hp + item.effect.heal)
                this.log(`Used ${item.name}, healed ${this.player.hp - oldHp} HP`, 'heal')
            }
            if (item.effect.restoreMana) {
                const oldMana = this.player.mana
                this.player.mana = Math.min(this.getMaxMana(), this.player.mana + item.effect.restoreMana)
                this.log(`Used ${item.name}, restored ${this.player.mana - oldMana} mana`, 'heal')
            }
            this.player.inventory.splice(index, 1)
            this.saveGame()
            return true
        }
        
        if (item.type === 'scroll') {
            return this.learnSpell(index)
        }
        
        return false
    }

    learnSpell(index) {
        const itemId = this.player.inventory[index]
        const item = ITEMS[itemId]
        if (!item || item.type !== 'scroll') return false
        
        const spell = SPELLS[item.spellId]
        if (!spell) return false
        
        // Check level requirement
        if (this.player.level < spell.levelReq) {
            this.log(`Need level ${spell.levelReq} to learn this spell`, 'info')
            return false
        }
        
        // Check class requirement
        const playerClass = CLASSES[this.player.class]
        if (spell.class !== 'all' && !playerClass.canLearn.includes(spell.class)) {
            this.log(`Your class cannot learn this spell`, 'info')
            return false
        }
        
        // Check if already learned
        if (this.player.learnedSpells.includes(item.spellId)) {
            this.log(`Already know ${spell.name}`, 'info')
            return false
        }
        
        // Learn the spell
        this.player.learnedSpells.push(item.spellId)
        this.player.inventory.splice(index, 1)
        this.log(`Learned ${spell.emoji} ${spell.name}!`, 'reward')
        this.saveGame()
        return true
    }

    equipItem(index) {
        const itemId = this.player.inventory[index]
        if (!itemId) return false
        
        const item = ITEMS[itemId]
        if (!item) return false
        
        // Determine slot
        let slot = item.type
        if (item.type === 'ring') {
            // Use ring1 first, then ring2
            slot = this.player.equipment.ring1 ? 'ring2' : 'ring1'
        }
        
        if (!EQUIPMENT_SLOT_IDS.includes(slot)) return false
        
        // Swap
        const currentEquipped = this.player.equipment[slot]
        this.player.equipment[slot] = itemId
        this.player.inventory.splice(index, 1)
        
        if (currentEquipped) {
            this.player.inventory.push(currentEquipped)
        }
        
        this.log(`Equipped ${item.emoji} ${item.name}`, 'info')
        this.saveGame()
        return true
    }

    unequipItem(slot) {
        const itemId = this.player.equipment[slot]
        if (!itemId) return false
        
        if (this.player.inventory.length >= 20) {
            this.log('Inventory full!', 'info')
            return false
        }
        
        const item = ITEMS[itemId]
        this.player.equipment[slot] = null
        this.player.inventory.push(itemId)
        this.log(`Unequipped ${item.name}`, 'info')
        this.saveGame()
        return true
    }

    dropItem(index) {
        const itemId = this.player.inventory[index]
        if (!itemId) return false
        
        const item = ITEMS[itemId]
        this.player.inventory.splice(index, 1)
        this.log(`Dropped ${item.name}`, 'info')
        this.saveGame()
        return true
    }

    // =====================
    // LOGGING
    // =====================
    
    log(message, type = '') {
        this.gameLog.push({ message, type, time: Date.now() })
        if (this.gameLog.length > 100) this.gameLog.shift()
    }
}
