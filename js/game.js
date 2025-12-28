import { supabase } from './supabase-client.js'

// Default player state
const DEFAULT_PLAYER = {
    level: 1,
    hp: 100,
    max_hp: 100,
    xp: 0,
    xp_to_level: 100,
    attack: 10,
    defense: 5,
    gold: 0,
    inventory: []
}

// Enemies by difficulty
const ENEMIES = [
    { name: 'Slime', hp: 20, attack: 5, xp: 15, gold: 5 },
    { name: 'Goblin', hp: 35, attack: 8, xp: 25, gold: 10 },
    { name: 'Wolf', hp: 45, attack: 12, xp: 35, gold: 15 },
    { name: 'Orc', hp: 70, attack: 18, xp: 50, gold: 25 },
    { name: 'Dark Knight', hp: 100, attack: 25, xp: 80, gold: 50 }
]

// Items
const ITEMS = [
    { id: 'potion', name: 'Health Potion', emoji: '🧪', effect: 'heal', value: 30, price: 20 },
    { id: 'sword', name: 'Iron Sword', emoji: '🗡️', effect: 'attack', value: 5, price: 50 },
    { id: 'shield', name: 'Wooden Shield', emoji: '🛡️', effect: 'defense', value: 3, price: 40 }
]

export class Game {
    constructor() {
        this.player = { ...DEFAULT_PLAYER }
        this.userId = null
        this.username = 'Hero'
        this.saveTimeout = null
    }

    // Initialize game for user
    async init(user) {
        this.userId = user.id
        this.username = user.user_metadata?.username || user.email.split('@')[0]
        await this.load()
        this.updateUI()
    }

    // Load player data from Supabase
    async load() {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('user_id', this.userId)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('Load error:', error)
            return
        }

        if (data) {
            this.player = {
                level: data.level,
                hp: data.hp,
                max_hp: data.max_hp,
                xp: data.xp,
                xp_to_level: data.xp_to_level,
                attack: data.attack,
                defense: data.defense,
                gold: data.gold,
                inventory: data.inventory || []
            }
        } else {
            // Create new player record
            await this.save()
        }
    }

    // Save player data to Supabase (debounced)
    async save() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout)
        
        this.saveTimeout = setTimeout(async () => {
            const { error } = await supabase
                .from('players')
                .upsert({
                    user_id: this.userId,
                    username: this.username,
                    ...this.player,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })

            if (error) console.error('Save error:', error)
        }, 1000)
    }

    // Update all UI elements
    updateUI() {
        document.getElementById('player-name').textContent = this.username
        document.getElementById('player-level').textContent = `Lvl ${this.player.level}`
        
        // HP bar
        const hpPercent = (this.player.hp / this.player.max_hp) * 100
        document.getElementById('hp-fill').style.width = `${hpPercent}%`
        document.getElementById('hp-text').textContent = `${this.player.hp}/${this.player.max_hp}`
        
        // XP bar
        const xpPercent = (this.player.xp / this.player.xp_to_level) * 100
        document.getElementById('xp-fill').style.width = `${xpPercent}%`
        document.getElementById('xp-text').textContent = `${this.player.xp}/${this.player.xp_to_level}`
        
        // Stats
        document.getElementById('stat-attack').textContent = this.player.attack
        document.getElementById('stat-defense').textContent = this.player.defense
        document.getElementById('stat-gold').textContent = this.player.gold
        
        // Inventory
        this.updateInventory()
    }

    updateInventory() {
        const grid = document.getElementById('inventory-grid')
        grid.innerHTML = ''
        
        // Show 9 slots
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div')
            slot.className = 'inventory-slot'
            
            if (this.player.inventory[i]) {
                const item = ITEMS.find(it => it.id === this.player.inventory[i])
                if (item) {
                    slot.textContent = item.emoji
                    slot.title = item.name
                    slot.onclick = () => this.useItem(i)
                }
            } else {
                slot.classList.add('empty')
            }
            
            grid.appendChild(slot)
        }
    }

    // Log message to game area
    log(message, type = '') {
        const log = document.getElementById('game-log')
        const p = document.createElement('p')
        p.textContent = message
        if (type) p.className = type
        log.appendChild(p)
        log.scrollTop = log.scrollHeight
        
        // Keep last 50 messages
        while (log.children.length > 50) {
            log.removeChild(log.firstChild)
        }
    }

    // Explore action - random encounter
    explore() {
        if (this.player.hp <= 0) {
            this.log("You're too weak to explore! Rest first.")
            return
        }

        const roll = Math.random()
        
        if (roll < 0.6) {
            // Combat encounter
            const maxEnemyIndex = Math.min(this.player.level, ENEMIES.length) - 1
            const enemyIndex = Math.floor(Math.random() * (maxEnemyIndex + 1))
            const enemy = { ...ENEMIES[enemyIndex] }
            
            this.combat(enemy)
        } else if (roll < 0.8) {
            // Find gold
            const gold = Math.floor(Math.random() * 10 * this.player.level) + 5
            this.player.gold += gold
            this.log(`💰 You found ${gold} gold!`, 'reward')
        } else {
            // Find item
            const item = ITEMS[Math.floor(Math.random() * ITEMS.length)]
            if (this.player.inventory.length < 9) {
                this.player.inventory.push(item.id)
                this.log(`📦 You found a ${item.name}!`, 'reward')
            } else {
                this.log("You found something but your inventory is full!")
            }
        }
        
        this.updateUI()
        this.save()
    }

    // Combat system
    combat(enemy) {
        this.log(`⚔️ A wild ${enemy.name} appears!`, 'combat')
        
        while (enemy.hp > 0 && this.player.hp > 0) {
            // Player attacks
            const playerDmg = Math.max(1, this.player.attack - Math.floor(Math.random() * 5))
            enemy.hp -= playerDmg
            
            if (enemy.hp <= 0) {
                this.log(`You defeated the ${enemy.name}!`, 'combat')
                this.gainXP(enemy.xp)
                this.player.gold += enemy.gold
                this.log(`+${enemy.xp} XP, +${enemy.gold} gold`, 'reward')
                return
            }
            
            // Enemy attacks
            const enemyDmg = Math.max(1, enemy.attack - this.player.defense + Math.floor(Math.random() * 5))
            this.player.hp = Math.max(0, this.player.hp - enemyDmg)
            this.log(`${enemy.name} hits you for ${enemyDmg} damage!`, 'combat')
            
            if (this.player.hp <= 0) {
                this.log("💀 You were defeated! Rest to recover.", 'combat')
                this.player.hp = 0
            }
        }
    }

    // XP and leveling
    gainXP(amount) {
        this.player.xp += amount
        
        while (this.player.xp >= this.player.xp_to_level) {
            this.player.xp -= this.player.xp_to_level
            this.player.level++
            this.player.xp_to_level = Math.floor(this.player.xp_to_level * 1.5)
            this.player.max_hp += 20
            this.player.hp = this.player.max_hp
            this.player.attack += 3
            this.player.defense += 2
            
            this.log(`🎉 LEVEL UP! You are now level ${this.player.level}!`, 'reward')
        }
    }

    // Rest action
    rest() {
        const healAmount = Math.floor(this.player.max_hp * 0.3)
        const oldHp = this.player.hp
        this.player.hp = Math.min(this.player.max_hp, this.player.hp + healAmount)
        const healed = this.player.hp - oldHp
        
        this.log(`💤 You rest and recover ${healed} HP.`, 'heal')
        this.updateUI()
        this.save()
    }

    // Shop action
    shop() {
        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)]
        
        if (this.player.gold >= item.price) {
            if (this.player.inventory.length < 9) {
                this.player.gold -= item.price
                this.player.inventory.push(item.id)
                this.log(`🏪 Bought ${item.name} for ${item.price} gold!`, 'reward')
            } else {
                this.log("Your inventory is full!")
            }
        } else {
            this.log(`Not enough gold for ${item.name} (costs ${item.price})`)
        }
        
        this.updateUI()
        this.save()
    }

    // Use item from inventory
    useItem(index) {
        const itemId = this.player.inventory[index]
        const item = ITEMS.find(it => it.id === itemId)
        
        if (!item) return
        
        if (item.effect === 'heal') {
            const oldHp = this.player.hp
            this.player.hp = Math.min(this.player.max_hp, this.player.hp + item.value)
            this.log(`🧪 Used ${item.name}, restored ${this.player.hp - oldHp} HP!`, 'heal')
            this.player.inventory.splice(index, 1)
        } else if (item.effect === 'attack') {
            this.player.attack += item.value
            this.log(`🗡️ Equipped ${item.name}, +${item.value} Attack!`, 'reward')
            this.player.inventory.splice(index, 1)
        } else if (item.effect === 'defense') {
            this.player.defense += item.value
            this.log(`🛡️ Equipped ${item.name}, +${item.value} Defense!`, 'reward')
            this.player.inventory.splice(index, 1)
        }
        
        this.updateUI()
        this.save()
    }
}
