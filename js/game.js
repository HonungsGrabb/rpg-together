import { supabase } from './supabase-client.js'
import { RACES, CLASSES, ITEMS, EQUIPMENT_SLOTS, getLootDrop } from './data.js'
import { Dungeon } from './dungeon.js'

// Base stats before race/class bonuses
const BASE_STATS = {
    hp: 100,
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
        this.inCombat = false
        this.currentEnemy = null
        this.enemyPosition = null
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
        
        // Calculate starting stats
        const maxHp = BASE_STATS.hp + race.bonuses.hp + cls.bonuses.hp
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
            baseAttack: BASE_STATS.attack + race.bonuses.attack + cls.bonuses.attack,
            baseDefense: BASE_STATS.defense + race.bonuses.defense + cls.bonuses.defense,
            baseSpeed: BASE_STATS.speed + race.bonuses.speed + cls.bonuses.speed,
            gold: 0,
            floor: 1,
            equipment: {
                weapon: startingWeapon,
                helmet: null,
                chest: null,
                leggings: null,
                boots: null
            },
            inventory: ['health_potion', 'health_potion'],
            stats: {
                enemiesKilled: 0,
                floorsCleared: 0,
                totalGold: 0
            }
        }
        
        const { data, error } = await supabase
            .from('save_slots')
            .upsert({
                user_id: this.userId,
                slot: slot,
                player_data: playerData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,slot' })
            .select()
            .single()
        
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
        
        // Initialize dungeon
        this.dungeon = new Dungeon(15, 15)
        this.dungeon.generate(this.player.floor)
        
        this.log(`Entered floor ${this.player.floor}`)
        
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
        
        if (error) console.error('Delete error:', error)
        return !error
    }

    // =====================
    // PLAYER STATS
    // =====================
    
    getAttack() {
        let attack = this.player.baseAttack
        for (const slotId of EQUIPMENT_SLOTS) {
            const itemId = this.player.equipment[slotId]
            if (itemId && ITEMS[itemId]?.stats?.attack) {
                attack += ITEMS[itemId].stats.attack
            }
        }
        return attack
    }

    getDefense() {
        let defense = this.player.baseDefense
        for (const slotId of EQUIPMENT_SLOTS) {
            const itemId = this.player.equipment[slotId]
            if (itemId && ITEMS[itemId]?.stats?.defense) {
                defense += ITEMS[itemId].stats.defense
            }
        }
        return defense
    }

    getSpeed() {
        let speed = this.player.baseSpeed
        for (const slotId of EQUIPMENT_SLOTS) {
            const itemId = this.player.equipment[slotId]
            if (itemId && ITEMS[itemId]?.stats?.speed) {
                speed += ITEMS[itemId].stats.speed
            }
        }
        return speed
    }

    getMaxHp() {
        let hp = this.player.maxHp
        for (const slotId of EQUIPMENT_SLOTS) {
            const itemId = this.player.equipment[slotId]
            if (itemId && ITEMS[itemId]?.stats?.hp) {
                hp += ITEMS[itemId].stats.hp
            }
        }
        return hp
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
        
        const result = this.dungeon.movePlayer(dir.dx, dir.dy)
        
        if (result.encounter) {
            if (result.encounter.type === 'enemy') {
                this.startCombat(result.encounter.enemy, result.encounter.x, result.encounter.y)
                return { success: true, combat: true }
            } else if (result.encounter.type === 'stairs') {
                return { success: true, stairs: true }
            }
        }
        
        return { success: result.moved }
    }

    descend() {
        this.player.floor++
        this.player.stats.floorsCleared++
        this.dungeon.generate(this.player.floor)
        this.log(`Descended to floor ${this.player.floor}`)
        this.saveGame()
    }

    // =====================
    // COMBAT
    // =====================
    
    startCombat(enemy, x, y) {
        this.inCombat = true
        this.currentEnemy = { ...enemy }
        this.enemyPosition = { x, y }
        this.log(`⚔️ ${enemy.name} attacks!`, 'combat')
    }

    playerAttack() {
        if (!this.inCombat || !this.currentEnemy) return null
        
        const playerSpeed = this.getSpeed()
        const enemySpeed = this.currentEnemy.speed
        
        // Determine who goes first
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
        this.log(`${this.currentEnemy.name} deals ${damage} damage!`, 'combat')
        
        if (this.player.hp <= 0) {
            result.playerDefeated = true
            this.player.hp = 0
            this.endCombat(false)
        }
        
        return result
    }

    flee() {
        if (!this.inCombat) return false
        
        const fleeChance = 0.4 + (this.getSpeed() - this.currentEnemy.speed) * 0.05
        
        if (Math.random() < fleeChance) {
            this.log('You escaped!', 'info')
            this.inCombat = false
            this.currentEnemy = null
            this.enemyPosition = null
            return true
        } else {
            this.log('Failed to escape!', 'combat')
            // Enemy gets a free hit
            const result = { playerDamage: 0, enemyDamage: 0, enemyDefeated: false, playerDefeated: false }
            this.executeEnemyAttack(result)
            return false
        }
    }

    endCombat(victory) {
        if (victory) {
            const enemy = this.currentEnemy
            
            // XP
            this.player.xp += enemy.xp
            this.log(`+${enemy.xp} XP`, 'reward')
            
            // Gold
            this.player.gold += enemy.gold
            this.player.stats.totalGold += enemy.gold
            this.log(`+${enemy.gold} gold`, 'reward')
            
            // Stats
            this.player.stats.enemiesKilled++
            
            // Check level up
            this.checkLevelUp()
            
            // Loot drop
            const loot = getLootDrop(this.player.floor)
            if (loot) {
                if (this.player.inventory.length < 20) {
                    this.player.inventory.push(loot.id)
                    this.log(`Found ${loot.emoji} ${loot.name}!`, 'reward')
                } else {
                    this.log(`Found ${loot.name} but inventory full!`, 'info')
                }
            }
            
            // Remove enemy from dungeon
            this.dungeon.removeEnemy(this.enemyPosition.x, this.enemyPosition.y)
            
            // Move player to enemy position
            this.dungeon.playerPos = { ...this.enemyPosition }
            this.dungeon.revealAround(this.enemyPosition.x, this.enemyPosition.y)
        } else {
            this.log('💀 You died!', 'death')
        }
        
        this.inCombat = false
        this.currentEnemy = null
        this.enemyPosition = null
        this.saveGame()
    }

    checkLevelUp() {
        while (this.player.xp >= this.player.xpToLevel) {
            this.player.xp -= this.player.xpToLevel
            this.player.level++
            this.player.xpToLevel = Math.floor(this.player.xpToLevel * 1.5)
            
            // Stat increases
            this.player.maxHp += 15
            this.player.hp = this.getMaxHp()
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
            this.player.inventory.splice(index, 1)
            this.saveGame()
            return true
        }
        
        return false
    }

    equipItem(index) {
        const itemId = this.player.inventory[index]
        if (!itemId) return false
        
        const item = ITEMS[itemId]
        if (!item || !EQUIPMENT_SLOTS.includes(item.type)) return false
        
        // Swap with current equipment
        const currentEquipped = this.player.equipment[item.type]
        this.player.equipment[item.type] = itemId
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
        if (this.gameLog.length > 100) {
            this.gameLog.shift()
        }
    }
}
