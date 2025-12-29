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
        this.currentEnemy = null; this.enemyPosition = null; this.combatBuffs = []; this.combatDebuffs = []
        this.enemyDot = null; this.gameLog = []; this.generatedItems = {}
        this.multiplayer = new Multiplayer(this)
    }

    async loadSaves(userId) {
        this.userId = userId
        const { data } = await supabase.from('save_slots').select('*').eq('user_id', userId).order('slot', { ascending: true })
        this.saves = data || []; return this.saves
    }

    async createNewGame(slot, name, raceId, classId) {
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
            equipment: { weapon: cls.startingWeapon, offhand: null, helmet: null, chest: null, leggings: null, boots: null, amulet: null, ring1: null, ring2: null },
            inventory: ['health_potion', 'health_potion', 'mana_potion'],
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
        // Update multiplayer presence
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
            if (result.encounter.type === 'enemy') { this.startCombat(result.encounter.enemy, result.encounter.x, result.encounter.y); return { success: true, combat: true } }
            if (result.encounter.type === 'stairs') return { success: true, stairs: true }
            if (result.encounter.type === 'exit') return { success: true, exit: true }
            if (result.encounter.type === 'chest' && result.encounter.loot) {
                this.addItemToInventory(result.encounter.loot)
                this.saveGame()
            }
        }
        if (result.moved) {
            this.multiplayer.broadcastMove(this.dungeon.playerPos.x, this.dungeon.playerPos.y)
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
            this.multiplayer.onAreaChange()
            return { success: true, newArea: true }
        }
        if (result.encounter) {
            if (result.encounter.type === 'enemy') { this.startCombat(result.encounter.enemy, result.encounter.x, result.encounter.y); return { success: true, combat: true } }
            if (result.encounter.type === 'dungeon') return { success: true, dungeon: true }
        }
        if (result.moved) {
            this.multiplayer.broadcastMove(this.world.playerPos.x, this.world.playerPos.y)
        }
        return { success: result.moved }
    }

    enterDungeon() { this.inDungeon = true; this.player.dungeonFloor = 1; this.dungeon = new Dungeon(17, 13); this.dungeon.generate(this.player.dungeonFloor); this.log(`Entered dungeon - Floor ${this.player.dungeonFloor}`, 'info'); this.saveGame(); this.multiplayer.onAreaChange() }
    exitDungeon() { this.inDungeon = false; this.player.dungeonFloor = 0; this.player.stats.dungeonsCleared++; this.log('Exited dungeon', 'info'); this.saveGame(); this.multiplayer.onAreaChange() }
    descendDungeon() { this.player.dungeonFloor++; this.player.stats.floorsExplored++; this.dungeon.generate(this.player.dungeonFloor); this.log(`Descended to floor ${this.player.dungeonFloor}`, 'info'); this.saveGame(); this.multiplayer.onAreaChange() }

    startCombat(enemy, x, y) {
        this.inCombat = true; this.currentEnemy = { ...enemy }; this.enemyPosition = { x, y }
        this.combatBuffs = []; this.combatDebuffs = []; this.enemyDot = null
        this.log(`⚔️ ${enemy.emoji} ${enemy.name} attacks!`, 'combat')
    }

    startPartyCombatAsJoiner(enemy) {
        this.inCombat = true
        this.currentEnemy = { 
            ...enemy, 
            maxHp: enemy.maxHp || enemy.hp,
            defense: enemy.defense || 5,
            magicResist: enemy.magicResist || 5,
            physicalDamage: enemy.physicalDamage || 10,
            magicDamage: enemy.magicDamage || 0,
            speed: enemy.speed || 5
        }
        this.enemyPosition = null
        this.combatBuffs = []; this.combatDebuffs = []; this.enemyDot = null
        this.log(`⚔️ You join the fight against ${enemy.emoji} ${enemy.name}!`, 'combat')
    }

    calculatePhysicalDamage(rawDamage, targetDefense) { return Math.max(1, Math.floor(rawDamage - targetDefense * 0.5) + Math.floor(Math.random() * 5) - 2) }
    calculateMagicDamage(rawDamage, targetMagicResist) { return Math.max(1, Math.floor(rawDamage - targetMagicResist * 0.5) + Math.floor(Math.random() * 5) - 2) }

    playerAttack() {
        if (!this.inCombat || !this.currentEnemy) return null
        const playerSpeed = this.getSpeed()
        let enemySpeed = this.currentEnemy.speed; for (const d of this.combatDebuffs) if (d.speed) enemySpeed += d.speed
        const playerFirst = playerSpeed >= enemySpeed
        let result = { playerDamage: 0, enemyDamage: 0, enemyDefeated: false, playerDefeated: false }
        if (playerFirst) { result = this.executePlayerAttack(result); if (!result.enemyDefeated) result = this.executeEnemyAttack(result) }
        else { result = this.executeEnemyAttack(result); if (!result.playerDefeated) result = this.executePlayerAttack(result) }
        this.processDot(result); this.tickBuffs(); return result
    }

    executePlayerAttack(result) {
        const wpnDmg = this.getWeaponDamage()
        const physRaw = wpnDmg.physical + this.getPhysicalPower() * 0.5
        const magRaw = wpnDmg.magic + this.getMagicPower() * 0.5
        const physDmg = this.calculatePhysicalDamage(physRaw, this.currentEnemy.defense)
        const magDmg = magRaw > 0 ? this.calculateMagicDamage(magRaw, this.currentEnemy.magicResist) : 0
        const totalDmg = physDmg + magDmg
        this.currentEnemy.hp -= totalDmg; result.playerDamage = totalDmg
        this.log(`You deal ${totalDmg} damage!${magDmg > 0 ? ` (${physDmg} phys + ${magDmg} magic)` : ''}`, 'combat')
        if (this.currentEnemy.hp <= 0) { result.enemyDefeated = true; this.endCombat(true) }
        return result
    }

    executeEnemyAttack(result) {
        const physDmg = this.calculatePhysicalDamage(this.currentEnemy.physicalDamage, this.getDefense())
        const magDmg = this.currentEnemy.magicDamage > 0 ? this.calculateMagicDamage(this.currentEnemy.magicDamage, this.getMagicResist()) : 0
        const totalDmg = physDmg + magDmg
        this.player.hp -= totalDmg; result.enemyDamage = totalDmg
        this.log(`${this.currentEnemy.name} deals ${totalDmg}!${magDmg > 0 ? ` (${physDmg} phys + ${magDmg} magic)` : ''}`, 'combat')
        if (this.player.hp <= 0) { result.playerDefeated = true; this.player.hp = 0; this.endCombat(false) }
        return result
    }

    castSpell(spellId) {
        if (!this.inCombat) return null
        const spell = SPELLS[spellId]; if (!spell || this.player.mana < spell.manaCost) { this.log('Not enough mana!', 'info'); return null }
        this.player.mana -= spell.manaCost; this.log(`Cast ${spell.emoji} ${spell.name}!`, 'combat')
        let result = { playerDamage: 0, enemyDamage: 0, enemyDefeated: false, playerDefeated: false }
        const eff = spell.effect
        let totalDmg = 0
        if (eff.basePhysical) {
            const raw = eff.basePhysical + this.getPhysicalPower() * (eff.physicalScaling || 1)
            const hits = eff.hits || 1
            for (let i = 0; i < hits; i++) totalDmg += this.calculatePhysicalDamage(raw, this.currentEnemy.defense)
        }
        if (eff.baseMagic) {
            const raw = eff.baseMagic + this.getMagicPower() * (eff.magicScaling || 1)
            totalDmg += this.calculateMagicDamage(raw, this.currentEnemy.magicResist)
        }
        if (totalDmg > 0) { this.currentEnemy.hp -= totalDmg; result.playerDamage = totalDmg; this.log(`Deals ${totalDmg} damage!`, 'combat') }
        if (eff.baseHeal) { const heal = Math.floor(eff.baseHeal + this.getMagicPower() * (eff.healScaling || 1)); const old = this.player.hp; this.player.hp = Math.min(this.getMaxHp(), this.player.hp + heal); this.log(`Healed ${this.player.hp - old} HP!`, 'heal') }
        if (eff.buff) { this.combatBuffs.push({ ...eff.buff }); this.log(`Buff for ${eff.buff.turns} turns!`, 'info') }
        if (eff.debuff) { this.combatDebuffs.push({ ...eff.debuff }); this.log(`Enemy debuffed!`, 'info') }
        if (eff.dot) { this.enemyDot = { ...eff.dot }; this.log(`Applied poison!`, 'info') }
        if (this.currentEnemy.hp <= 0) { result.enemyDefeated = true; this.endCombat(true); return result }
        result = this.executeEnemyAttack(result); this.processDot(result); this.tickBuffs(); return result
    }

    processDot(result) {
        if (this.enemyDot && !result.enemyDefeated) {
            this.currentEnemy.hp -= this.enemyDot.damage; this.log(`Poison deals ${this.enemyDot.damage}!`, 'combat')
            this.enemyDot.turns--; if (this.enemyDot.turns <= 0) this.enemyDot = null
            if (this.currentEnemy.hp <= 0) { result.enemyDefeated = true; this.endCombat(true) }
        }
    }

    tickBuffs() {
        this.combatBuffs = this.combatBuffs.filter(b => { b.turns--; return b.turns > 0 })
        this.combatDebuffs = this.combatDebuffs.filter(d => { d.turns--; return d.turns > 0 })
    }

    flee() {
        if (!this.inCombat) return false
        let enemySpeed = this.currentEnemy.speed; for (const d of this.combatDebuffs) if (d.speed) enemySpeed += d.speed
        if (Math.random() < 0.4 + (this.getSpeed() - enemySpeed) * 0.05) {
            this.log('You escaped!', 'info'); this.inCombat = false; this.currentEnemy = null; this.enemyPosition = null
            this.combatBuffs = []; this.combatDebuffs = []; this.enemyDot = null; return true
        }
        this.log('Failed to escape!', 'combat'); this.executeEnemyAttack({ playerDamage: 0, enemyDamage: 0, enemyDefeated: false, playerDefeated: false }); return false
    }

    endCombat(victory) {
        if (victory) {
            const enemy = this.currentEnemy
            this.player.xp += enemy.xp; this.log(`+${enemy.xp} XP`, 'reward')
            this.player.gold += enemy.gold; this.player.stats.totalGold += enemy.gold; this.log(`+${enemy.gold} gold`, 'reward')
            this.player.stats.enemiesKilled++; this.checkLevelUp()
            const floor = this.inDungeon ? this.player.dungeonFloor : 1
            const loot = getLootDrop(floor, false)
            if (loot) this.addItemToInventory(loot)
            if (this.inDungeon) { this.dungeon.removeEnemy(this.enemyPosition.x, this.enemyPosition.y); this.dungeon.playerPos = { ...this.enemyPosition }; this.dungeon.revealAround(this.enemyPosition.x, this.enemyPosition.y) }
            else { this.world.removeEnemy(this.enemyPosition.x, this.enemyPosition.y); this.world.playerPos = { ...this.enemyPosition } }
        } else this.log('💀 You died!', 'death')
        this.inCombat = false; this.currentEnemy = null; this.enemyPosition = null; this.combatBuffs = []; this.combatDebuffs = []; this.enemyDot = null; this.saveGame()
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
            this.player.inventory.splice(index, 1); this.saveGame(); return true
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
