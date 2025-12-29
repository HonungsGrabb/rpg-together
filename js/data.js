// ============================================
// RACES
// ============================================
export const RACES = {
    human: {
        id: 'human',
        name: 'Human',
        emoji: '🧑',
        description: 'Versatile and adaptable. Balanced stats.',
        bonuses: { hp: 10, mana: 10, physicalPower: 2, magicPower: 2, defense: 2, magicResist: 2, speed: 2 }
    },
    elf: {
        id: 'elf',
        name: 'Elf',
        emoji: '🧝',
        description: 'Graceful and magical. High mana and magic power.',
        bonuses: { hp: 0, mana: 30, physicalPower: 1, magicPower: 5, defense: 1, magicResist: 3, speed: 4 }
    },
    dwarf: {
        id: 'dwarf',
        name: 'Dwarf',
        emoji: '⛏️',
        description: 'Sturdy and tough. High HP and defense.',
        bonuses: { hp: 25, mana: 5, physicalPower: 3, magicPower: 0, defense: 5, magicResist: 3, speed: 0 }
    },
    orc: {
        id: 'orc',
        name: 'Orc',
        emoji: '👹',
        description: 'Brutal and strong. High physical power.',
        bonuses: { hp: 15, mana: 0, physicalPower: 6, magicPower: 0, defense: 3, magicResist: 1, speed: 1 }
    },
    undead: {
        id: 'undead',
        name: 'Undead',
        emoji: '💀',
        description: 'Risen from death. High magic resist.',
        bonuses: { hp: 20, mana: 15, physicalPower: 2, magicPower: 3, defense: 3, magicResist: 6, speed: -2 }
    }
}

// ============================================
// CLASSES
// ============================================
export const CLASSES = {
    warrior: {
        id: 'warrior',
        name: 'Warrior',
        emoji: '⚔️',
        description: 'Masters of melee combat. High physical power.',
        bonuses: { hp: 30, mana: 10, physicalPower: 5, magicPower: 0, defense: 4, magicResist: 2, speed: 0 },
        startingWeapon: 'rusty_sword',
        canLearn: ['warrior', 'all'],
        primaryStat: 'physicalPower'
    },
    mage: {
        id: 'mage',
        name: 'Mage',
        emoji: '🔮',
        description: 'Wielders of arcane power. High magic power.',
        bonuses: { hp: 0, mana: 50, physicalPower: 0, magicPower: 6, defense: 1, magicResist: 4, speed: 2 },
        startingWeapon: 'wooden_staff',
        canLearn: ['mage', 'all'],
        primaryStat: 'magicPower'
    },
    hunter: {
        id: 'hunter',
        name: 'Hunter',
        emoji: '🏹',
        description: 'Swift and deadly. Balanced offense.',
        bonuses: { hp: 10, mana: 20, physicalPower: 4, magicPower: 2, defense: 2, magicResist: 2, speed: 4 },
        startingWeapon: 'shortbow',
        canLearn: ['hunter', 'all'],
        primaryStat: 'physicalPower'
    }
}

// ============================================
// EQUIPMENT SLOTS
// ============================================
export const EQUIPMENT_SLOTS = [
    { id: 'weapon', name: 'Weapon', emoji: '⚔️' },
    { id: 'offhand', name: 'Offhand', emoji: '🛡️' },
    { id: 'helmet', name: 'Helmet', emoji: '⛑️' },
    { id: 'chest', name: 'Chest', emoji: '🦺' },
    { id: 'leggings', name: 'Leggings', emoji: '👖' },
    { id: 'boots', name: 'Boots', emoji: '👢' },
    { id: 'amulet', name: 'Amulet', emoji: '📿' },
    { id: 'ring1', name: 'Ring', emoji: '💍' },
    { id: 'ring2', name: 'Ring', emoji: '💍' }
]

export const EQUIPMENT_SLOT_IDS = EQUIPMENT_SLOTS.map(s => s.id)

// ============================================
// ITEMS
// ============================================
export const ITEMS = {
    // === WEAPONS ===
    rusty_sword: { id: 'rusty_sword', name: 'Rusty Sword', type: 'weapon', weaponType: 'sword', emoji: '🗡️', description: 'A worn blade.', stats: { physicalDamage: 5 }, levelReq: 1, tier: 1, rarity: 'common' },
    iron_sword: { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', weaponType: 'sword', emoji: '🗡️', description: 'A reliable iron blade.', stats: { physicalDamage: 10 }, levelReq: 3, tier: 2, rarity: 'common' },
    steel_sword: { id: 'steel_sword', name: 'Steel Sword', type: 'weapon', weaponType: 'sword', emoji: '🗡️', description: 'Finely crafted steel.', stats: { physicalDamage: 18, speed: 1 }, levelReq: 6, tier: 3, rarity: 'uncommon' },
    flame_blade: { id: 'flame_blade', name: 'Flame Blade', type: 'weapon', weaponType: 'sword', emoji: '🔥', description: 'Wreathed in fire.', stats: { physicalDamage: 15, magicDamage: 12, mana: 10 }, levelReq: 10, tier: 4, rarity: 'rare' },
    
    rusty_dagger: { id: 'rusty_dagger', name: 'Rusty Dagger', type: 'weapon', weaponType: 'dagger', emoji: '🔪', description: 'Quick but weak.', stats: { physicalDamage: 3, speed: 3 }, levelReq: 1, tier: 1, rarity: 'common' },
    iron_dagger: { id: 'iron_dagger', name: 'Iron Dagger', type: 'weapon', weaponType: 'dagger', emoji: '🔪', description: 'A swift iron blade.', stats: { physicalDamage: 6, speed: 4 }, levelReq: 3, tier: 2, rarity: 'common' },
    shadow_dagger: { id: 'shadow_dagger', name: 'Shadow Dagger', type: 'weapon', weaponType: 'dagger', emoji: '🗡️', description: 'Strikes from shadows.', stats: { physicalDamage: 12, magicDamage: 5, speed: 6 }, levelReq: 8, tier: 3, rarity: 'rare' },
    
    shortbow: { id: 'shortbow', name: 'Shortbow', type: 'weapon', weaponType: 'bow', emoji: '🏹', description: 'A simple bow.', stats: { physicalDamage: 6, speed: 2 }, levelReq: 1, tier: 1, rarity: 'common' },
    longbow: { id: 'longbow', name: 'Longbow', type: 'weapon', weaponType: 'bow', emoji: '🏹', description: 'Greater power.', stats: { physicalDamage: 12, speed: 1 }, levelReq: 4, tier: 2, rarity: 'common' },
    elven_bow: { id: 'elven_bow', name: 'Elven Bow', type: 'weapon', weaponType: 'bow', emoji: '🏹', description: 'Elven crafted.', stats: { physicalDamage: 16, magicDamage: 6, speed: 4 }, levelReq: 9, tier: 3, rarity: 'rare' },
    
    wooden_staff: { id: 'wooden_staff', name: 'Wooden Staff', type: 'weapon', weaponType: 'staff', emoji: '🪄', description: 'A basic conduit.', stats: { physicalDamage: 2, magicDamage: 8, mana: 15 }, levelReq: 1, tier: 1, rarity: 'common' },
    arcane_staff: { id: 'arcane_staff', name: 'Arcane Staff', type: 'weapon', weaponType: 'staff', emoji: '🪄', description: 'Arcane energy.', stats: { magicDamage: 18, mana: 30 }, levelReq: 5, tier: 2, rarity: 'uncommon' },
    staff_of_storms: { id: 'staff_of_storms', name: 'Staff of Storms', type: 'weapon', weaponType: 'staff', emoji: '⚡', description: 'Commands lightning.', stats: { magicDamage: 28, mana: 50, speed: 2 }, levelReq: 10, tier: 3, rarity: 'rare' },
    
    // === OFFHAND ===
    wooden_shield: { id: 'wooden_shield', name: 'Wooden Shield', type: 'offhand', emoji: '🛡️', description: 'Basic protection.', stats: { defense: 3 }, levelReq: 1, tier: 1, rarity: 'common' },
    iron_shield: { id: 'iron_shield', name: 'Iron Shield', type: 'offhand', emoji: '🛡️', description: 'Sturdy iron.', stats: { defense: 6, hp: 10 }, levelReq: 4, tier: 2, rarity: 'common' },
    tower_shield: { id: 'tower_shield', name: 'Tower Shield', type: 'offhand', emoji: '🛡️', description: 'Massive barrier.', stats: { defense: 12, hp: 25, speed: -2 }, levelReq: 8, tier: 3, rarity: 'uncommon' },
    tome_of_wisdom: { id: 'tome_of_wisdom', name: 'Tome of Wisdom', type: 'offhand', emoji: '📖', description: 'Ancient knowledge.', stats: { mana: 40, magicPower: 5, magicDamage: 5 }, levelReq: 7, tier: 3, rarity: 'rare' },
    
    // === ARMOR ===
    leather_cap: { id: 'leather_cap', name: 'Leather Cap', type: 'helmet', emoji: '🎓', description: 'Light protection.', stats: { defense: 2 }, levelReq: 1, tier: 1, rarity: 'common' },
    iron_helm: { id: 'iron_helm', name: 'Iron Helm', type: 'helmet', emoji: '⛑️', description: 'Solid iron.', stats: { defense: 5, hp: 5 }, levelReq: 4, tier: 2, rarity: 'common' },
    steel_helm: { id: 'steel_helm', name: 'Steel Helm', type: 'helmet', emoji: '⛑️', description: 'Knight-grade.', stats: { defense: 8, hp: 15, magicResist: 2 }, levelReq: 8, tier: 3, rarity: 'uncommon' },
    wizard_hat: { id: 'wizard_hat', name: 'Wizard Hat', type: 'helmet', emoji: '🎩', description: 'Magical.', stats: { defense: 2, mana: 25, magicPower: 3 }, levelReq: 4, tier: 2, rarity: 'uncommon' },
    
    cloth_shirt: { id: 'cloth_shirt', name: 'Cloth Shirt', type: 'chest', emoji: '👕', description: 'Basic clothing.', stats: { defense: 2 }, levelReq: 1, tier: 1, rarity: 'common' },
    leather_armor: { id: 'leather_armor', name: 'Leather Armor', type: 'chest', emoji: '🦺', description: 'Light and flexible.', stats: { defense: 5, hp: 10 }, levelReq: 3, tier: 2, rarity: 'common' },
    chainmail: { id: 'chainmail', name: 'Chainmail', type: 'chest', emoji: '🦺', description: 'Metal rings.', stats: { defense: 10, hp: 20, magicResist: 3 }, levelReq: 7, tier: 3, rarity: 'uncommon' },
    mage_robes: { id: 'mage_robes', name: 'Mage Robes', type: 'chest', emoji: '👘', description: 'Magical thread.', stats: { defense: 3, mana: 35, magicPower: 4, magicResist: 5 }, levelReq: 5, tier: 2, rarity: 'uncommon' },
    
    cloth_pants: { id: 'cloth_pants', name: 'Cloth Pants', type: 'leggings', emoji: '👖', description: 'Simple trousers.', stats: { defense: 1 }, levelReq: 1, tier: 1, rarity: 'common' },
    leather_leggings: { id: 'leather_leggings', name: 'Leather Leggings', type: 'leggings', emoji: '👖', description: 'Flexible leather.', stats: { defense: 3, speed: 1 }, levelReq: 3, tier: 2, rarity: 'common' },
    iron_leggings: { id: 'iron_leggings', name: 'Iron Leggings', type: 'leggings', emoji: '👖', description: 'Heavy but protective.', stats: { defense: 6, hp: 10 }, levelReq: 6, tier: 3, rarity: 'common' },
    
    sandals: { id: 'sandals', name: 'Sandals', type: 'boots', emoji: '👟', description: 'Light footwear.', stats: { speed: 2 }, levelReq: 1, tier: 1, rarity: 'common' },
    leather_boots: { id: 'leather_boots', name: 'Leather Boots', type: 'boots', emoji: '👢', description: 'Comfortable.', stats: { defense: 2, speed: 3 }, levelReq: 3, tier: 2, rarity: 'common' },
    iron_boots: { id: 'iron_boots', name: 'Iron Boots', type: 'boots', emoji: '👢', description: 'Heavy.', stats: { defense: 5, speed: -1 }, levelReq: 6, tier: 3, rarity: 'common' },
    swift_boots: { id: 'swift_boots', name: 'Swift Boots', type: 'boots', emoji: '👟', description: 'Enchanted speed.', stats: { speed: 6, mana: 10 }, levelReq: 8, tier: 3, rarity: 'rare' },
    
    // === ACCESSORIES ===
    copper_amulet: { id: 'copper_amulet', name: 'Copper Amulet', type: 'amulet', emoji: '📿', description: 'Simple charm.', stats: { hp: 10, magicResist: 2 }, levelReq: 1, tier: 1, rarity: 'common' },
    silver_amulet: { id: 'silver_amulet', name: 'Silver Amulet', type: 'amulet', emoji: '📿', description: 'Blessed silver.', stats: { hp: 20, defense: 2, magicResist: 4 }, levelReq: 5, tier: 2, rarity: 'uncommon' },
    amulet_of_power: { id: 'amulet_of_power', name: 'Amulet of Power', type: 'amulet', emoji: '💎', description: 'Raw power.', stats: { physicalPower: 5, magicPower: 5, mana: 20 }, levelReq: 10, tier: 3, rarity: 'rare' },
    
    copper_ring: { id: 'copper_ring', name: 'Copper Ring', type: 'ring', emoji: '💍', description: 'A simple band.', stats: { hp: 5 }, levelReq: 1, tier: 1, rarity: 'common' },
    ring_of_strength: { id: 'ring_of_strength', name: 'Ring of Strength', type: 'ring', emoji: '💍', description: 'Empowers.', stats: { physicalPower: 4 }, levelReq: 4, tier: 2, rarity: 'uncommon' },
    ring_of_protection: { id: 'ring_of_protection', name: 'Ring of Protection', type: 'ring', emoji: '💍', description: 'Magical ward.', stats: { defense: 3, magicResist: 3, hp: 10 }, levelReq: 5, tier: 2, rarity: 'uncommon' },
    ring_of_arcana: { id: 'ring_of_arcana', name: 'Ring of Arcana', type: 'ring', emoji: '💍', description: 'Pulses with mana.', stats: { mana: 30, magicPower: 3 }, levelReq: 5, tier: 2, rarity: 'uncommon' },
    ring_of_haste: { id: 'ring_of_haste', name: 'Ring of Haste', type: 'ring', emoji: '💍', description: 'Quickens.', stats: { speed: 5 }, levelReq: 7, tier: 3, rarity: 'rare' },
    
    // === CONSUMABLES ===
    health_potion: { id: 'health_potion', name: 'Health Potion', type: 'consumable', emoji: '🧪', description: 'Restores 30 HP.', effect: { heal: 30 }, tier: 1, rarity: 'common' },
    large_health_potion: { id: 'large_health_potion', name: 'Large Health Potion', type: 'consumable', emoji: '🧪', description: 'Restores 60 HP.', effect: { heal: 60 }, tier: 2, rarity: 'common' },
    mana_potion: { id: 'mana_potion', name: 'Mana Potion', type: 'consumable', emoji: '💧', description: 'Restores 25 mana.', effect: { restoreMana: 25 }, tier: 1, rarity: 'common' },
    large_mana_potion: { id: 'large_mana_potion', name: 'Large Mana Potion', type: 'consumable', emoji: '💧', description: 'Restores 50 mana.', effect: { restoreMana: 50 }, tier: 2, rarity: 'common' },
    elixir: { id: 'elixir', name: 'Elixir', type: 'consumable', emoji: '✨', description: 'Full restore.', effect: { heal: 999, restoreMana: 999 }, tier: 3, rarity: 'rare' }
}

// ============================================
// SPELLS
// ============================================
export const SPELLS = {
    power_strike: { id: 'power_strike', name: 'Power Strike', emoji: '💥', description: 'Physical attack scaling.', class: 'warrior', manaCost: 10, levelReq: 2, damageType: 'physical', effect: { basePhysical: 15, physicalScaling: 1.5 } },
    shield_bash: { id: 'shield_bash', name: 'Shield Bash', emoji: '🛡️', description: 'Stuns and damages.', class: 'warrior', manaCost: 15, levelReq: 4, damageType: 'physical', effect: { basePhysical: 10, physicalScaling: 0.8, debuff: { speed: -3, turns: 2 } } },
    battle_cry: { id: 'battle_cry', name: 'Battle Cry', emoji: '📢', description: '+8 Physical Power 3 turns.', class: 'warrior', manaCost: 20, levelReq: 6, damageType: 'none', effect: { buff: { physicalPower: 8, turns: 3 } } },
    
    fireball: { id: 'fireball', name: 'Fireball', emoji: '🔥', description: 'Magic damage scaling.', class: 'mage', manaCost: 15, levelReq: 2, damageType: 'magic', effect: { baseMagic: 20, magicScaling: 1.8 } },
    ice_shard: { id: 'ice_shard', name: 'Ice Shard', emoji: '❄️', description: 'Damage and slow.', class: 'mage', manaCost: 12, levelReq: 3, damageType: 'magic', effect: { baseMagic: 12, magicScaling: 1.2, debuff: { speed: -2, turns: 2 } } },
    lightning_bolt: { id: 'lightning_bolt', name: 'Lightning Bolt', emoji: '⚡', description: 'High magic scaling.', class: 'mage', manaCost: 25, levelReq: 5, damageType: 'magic', effect: { baseMagic: 25, magicScaling: 2.2 } },
    arcane_shield: { id: 'arcane_shield', name: 'Arcane Shield', emoji: '🔮', description: '+10 Magic Resist 3 turns.', class: 'mage', manaCost: 20, levelReq: 4, damageType: 'none', effect: { buff: { magicResist: 10, turns: 3 } } },
    
    aimed_shot: { id: 'aimed_shot', name: 'Aimed Shot', emoji: '🎯', description: 'Physical scaling.', class: 'hunter', manaCost: 10, levelReq: 2, damageType: 'physical', effect: { basePhysical: 12, physicalScaling: 1.4 } },
    poison_arrow: { id: 'poison_arrow', name: 'Poison Arrow', emoji: '☠️', description: 'Damage over time.', class: 'hunter', manaCost: 15, levelReq: 4, damageType: 'magic', effect: { baseMagic: 8, magicScaling: 0.5, dot: { damage: 8, turns: 3 } } },
    evasion: { id: 'evasion', name: 'Evasion', emoji: '💨', description: '+5 Speed/Defense 2 turns.', class: 'hunter', manaCost: 12, levelReq: 3, damageType: 'none', effect: { buff: { speed: 5, defense: 5, turns: 2 } } },
    multi_shot: { id: 'multi_shot', name: 'Multi Shot', emoji: '🏹', description: '3 arrows.', class: 'hunter', manaCost: 25, levelReq: 6, damageType: 'physical', effect: { hits: 3, basePhysical: 8, physicalScaling: 0.7 } },
    
    heal: { id: 'heal', name: 'Heal', emoji: '💚', description: 'HP scaling with Magic.', class: 'all', manaCost: 15, levelReq: 3, damageType: 'none', effect: { baseHeal: 15, healScaling: 1.5 } }
}

// Generate scrolls
export const SCROLLS = {}
for (const [id, spell] of Object.entries(SPELLS)) {
    SCROLLS[`scroll_${id}`] = { id: `scroll_${id}`, name: `Scroll: ${spell.name}`, type: 'scroll', emoji: '📜', description: `Learn ${spell.name}. Req Lv${spell.levelReq}.`, spellId: id, tier: Math.ceil(spell.levelReq / 2), rarity: 'uncommon' }
}
Object.assign(ITEMS, SCROLLS)

// ============================================
// ENEMIES
// ============================================
export const ENEMIES = {
    rat: { id: 'rat', name: 'Giant Rat', emoji: '🐀', baseHp: 15, basePhysicalDamage: 4, baseMagicDamage: 0, baseDefense: 1, baseMagicResist: 0, baseSpeed: 3, xp: 10, gold: [2, 8], floors: [1, 5] },
    bat: { id: 'bat', name: 'Cave Bat', emoji: '🦇', baseHp: 12, basePhysicalDamage: 5, baseMagicDamage: 0, baseDefense: 0, baseMagicResist: 1, baseSpeed: 5, xp: 12, gold: [3, 10], floors: [1, 6] },
    slime: { id: 'slime', name: 'Slime', emoji: '🟢', baseHp: 20, basePhysicalDamage: 2, baseMagicDamage: 3, baseDefense: 3, baseMagicResist: 3, baseSpeed: 1, xp: 8, gold: [1, 5], floors: [1, 4] },
    goblin: { id: 'goblin', name: 'Goblin', emoji: '👺', baseHp: 25, basePhysicalDamage: 8, baseMagicDamage: 0, baseDefense: 3, baseMagicResist: 1, baseSpeed: 3, xp: 20, gold: [8, 20], floors: [3, 8] },
    skeleton: { id: 'skeleton', name: 'Skeleton', emoji: '💀', baseHp: 22, basePhysicalDamage: 9, baseMagicDamage: 0, baseDefense: 4, baseMagicResist: 2, baseSpeed: 2, xp: 25, gold: [10, 25], floors: [3, 10] },
    spider: { id: 'spider', name: 'Giant Spider', emoji: '🕷️', baseHp: 28, basePhysicalDamage: 7, baseMagicDamage: 4, baseDefense: 2, baseMagicResist: 2, baseSpeed: 4, xp: 22, gold: [5, 18], floors: [4, 9] },
    orc_grunt: { id: 'orc_grunt', name: 'Orc Grunt', emoji: '👹', baseHp: 40, basePhysicalDamage: 14, baseMagicDamage: 0, baseDefense: 6, baseMagicResist: 2, baseSpeed: 2, xp: 35, gold: [15, 35], floors: [6, 12] },
    zombie: { id: 'zombie', name: 'Zombie', emoji: '🧟', baseHp: 50, basePhysicalDamage: 10, baseMagicDamage: 0, baseDefense: 8, baseMagicResist: 0, baseSpeed: 1, xp: 30, gold: [10, 30], floors: [5, 11] },
    ghost: { id: 'ghost', name: 'Ghost', emoji: '👻', baseHp: 30, basePhysicalDamage: 0, baseMagicDamage: 14, baseDefense: 2, baseMagicResist: 10, baseSpeed: 4, xp: 40, gold: [20, 40], floors: [7, 15] },
    troll: { id: 'troll', name: 'Troll', emoji: '🧌', baseHp: 80, basePhysicalDamage: 18, baseMagicDamage: 0, baseDefense: 10, baseMagicResist: 4, baseSpeed: 1, xp: 60, gold: [30, 60], floors: [10, 20] },
    dark_knight: { id: 'dark_knight', name: 'Dark Knight', emoji: '🖤', baseHp: 70, basePhysicalDamage: 16, baseMagicDamage: 8, baseDefense: 14, baseMagicResist: 8, baseSpeed: 3, xp: 75, gold: [40, 80], floors: [12, 25] },
    demon: { id: 'demon', name: 'Demon', emoji: '😈', baseHp: 100, basePhysicalDamage: 12, baseMagicDamage: 18, baseDefense: 10, baseMagicResist: 12, baseSpeed: 4, xp: 100, gold: [50, 100], floors: [15, 99] }
}

export const OVERWORLD_ENEMIES = {
    wolf: { id: 'wolf', name: 'Wild Wolf', emoji: '🐺', baseHp: 20, basePhysicalDamage: 6, baseMagicDamage: 0, baseDefense: 2, baseMagicResist: 1, baseSpeed: 4, xp: 15, gold: [5, 15] },
    bandit: { id: 'bandit', name: 'Bandit', emoji: '🥷', baseHp: 30, basePhysicalDamage: 8, baseMagicDamage: 0, baseDefense: 4, baseMagicResist: 2, baseSpeed: 3, xp: 25, gold: [15, 30] },
    boar: { id: 'boar', name: 'Wild Boar', emoji: '🐗', baseHp: 25, basePhysicalDamage: 7, baseMagicDamage: 0, baseDefense: 5, baseMagicResist: 1, baseSpeed: 2, xp: 18, gold: [8, 20] }
}

export const RARITY_COLORS = { common: '#9d9d9d', uncommon: '#1eff00', rare: '#0070dd', epic: '#a335ee', legendary: '#ff8000' }

export const LOOT_TABLES = {
    tier1: ['leather_cap', 'cloth_shirt', 'cloth_pants', 'sandals', 'rusty_dagger', 'health_potion', 'mana_potion', 'copper_ring', 'copper_amulet', 'wooden_shield'],
    tier2: ['iron_helm', 'leather_armor', 'leather_leggings', 'leather_boots', 'iron_sword', 'iron_dagger', 'longbow', 'arcane_staff', 'health_potion', 'large_health_potion', 'mana_potion', 'ring_of_strength', 'ring_of_protection', 'silver_amulet', 'iron_shield', 'wizard_hat', 'mage_robes'],
    tier3: ['steel_helm', 'chainmail', 'iron_leggings', 'iron_boots', 'steel_sword', 'large_health_potion', 'large_mana_potion', 'elixir', 'amulet_of_power', 'ring_of_haste', 'ring_of_arcana', 'tower_shield', 'tome_of_wisdom', 'swift_boots', 'elven_bow', 'shadow_dagger', 'staff_of_storms', 'flame_blade'],
    scrolls_early: ['scroll_power_strike', 'scroll_fireball', 'scroll_aimed_shot', 'scroll_heal'],
    scrolls_mid: ['scroll_shield_bash', 'scroll_ice_shard', 'scroll_poison_arrow', 'scroll_evasion', 'scroll_arcane_shield'],
    scrolls_late: ['scroll_battle_cry', 'scroll_lightning_bolt', 'scroll_multi_shot']
}

export const BIOMES = {
    castle: { id: 'castle', name: 'Castle', groundChar: '░', color: '#4a4a6a' },
    plains: { id: 'plains', name: 'Plains', groundChar: '.', color: '#3d5c3d' },
    forest: { id: 'forest', name: 'Forest', groundChar: '"', color: '#2d4a2d' },
    mountains: { id: 'mountains', name: 'Mountains', groundChar: '^', color: '#5a5a5a' }
}

// Helper functions
export function getEnemyForFloor(floor) {
    const available = Object.values(ENEMIES).filter(e => floor >= e.floors[0] && floor <= e.floors[1])
    if (available.length === 0) return Object.values(ENEMIES).reduce((a, b) => b.floors[1] > a.floors[1] ? b : a)
    return available[Math.floor(Math.random() * available.length)]
}

export function getOverworldEnemy() {
    const enemies = Object.values(OVERWORLD_ENEMIES)
    return enemies[Math.floor(Math.random() * enemies.length)]
}

export function scaleEnemy(enemy, floor = 1) {
    const scaling = 1 + (floor - 1) * 0.12
    return { ...enemy, hp: Math.floor(enemy.baseHp * scaling), maxHp: Math.floor(enemy.baseHp * scaling), physicalDamage: Math.floor(enemy.basePhysicalDamage * scaling), magicDamage: Math.floor(enemy.baseMagicDamage * scaling), defense: Math.floor(enemy.baseDefense * scaling), magicResist: Math.floor(enemy.baseMagicResist * scaling), speed: enemy.baseSpeed, xp: Math.floor(enemy.xp * scaling), gold: Math.floor((enemy.gold[0] + Math.random() * (enemy.gold[1] - enemy.gold[0])) * scaling) }
}

export function getLootDrop(floor, isChest = false) {
    // 30% chance for AI-generated item on floor 5+
    if (floor >= 5 && Math.random() < 0.30) {
        return generateRandomItem(floor)
    }
    if (isChest) {
        const roll = Math.random()
        let table
        if (roll < 0.15 && floor >= 10) table = LOOT_TABLES.scrolls_late
        else if (roll < 0.25 && floor >= 5) table = LOOT_TABLES.scrolls_mid
        else if (roll < 0.35) table = LOOT_TABLES.scrolls_early
        else if (floor >= 10) table = LOOT_TABLES.tier3
        else if (floor >= 5) table = LOOT_TABLES.tier2
        else table = LOOT_TABLES.tier1
        return ITEMS[table[Math.floor(Math.random() * table.length)]]
    }
    const roll = Math.random()
    if (roll > 0.25) return null
    let table = floor >= 10 ? LOOT_TABLES.tier3 : floor >= 5 ? LOOT_TABLES.tier2 : LOOT_TABLES.tier1
    return ITEMS[table[Math.floor(Math.random() * table.length)]]
}

// Random item generator
export function generateRandomItem(floor, forceRarity = null) {
    const types = ['weapon', 'helmet', 'chest', 'leggings', 'boots', 'amulet', 'ring', 'offhand']
    const weaponTypes = ['sword', 'dagger', 'bow', 'staff', 'axe', 'mace']
    const prefixes = ['Ancient', 'Cursed', 'Blessed', 'Mystic', 'Shadow', 'Flame', 'Frost', 'Storm', 'Void', 'Divine', 'Corrupted', 'Ethereal']
    const suffixes = ['of Power', 'of the Bear', 'of the Eagle', 'of Wisdom', 'of Destruction', 'of Protection', 'of Haste', 'of the Mage', 'of Fury']
    const emojis = { weapon: { sword: '🗡️', dagger: '🔪', bow: '🏹', staff: '🪄', axe: '🪓', mace: '🔨' }, helmet: '⛑️', chest: '🦺', leggings: '👖', boots: '👢', amulet: '📿', ring: '💍', offhand: '🛡️' }
    
    let rarity = forceRarity
    if (!rarity) {
        const roll = Math.random()
        if (floor >= 15 && roll < 0.05) rarity = 'legendary'
        else if (floor >= 10 && roll < 0.15) rarity = 'epic'
        else if (floor >= 5 && roll < 0.30) rarity = 'rare'
        else if (roll < 0.50) rarity = 'uncommon'
        else rarity = 'common'
    }
    
    const rarityMult = { common: 1, uncommon: 1.3, rare: 1.6, epic: 2, legendary: 2.5 }[rarity]
    const type = types[Math.floor(Math.random() * types.length)]
    const levelReq = Math.max(1, floor - Math.floor(Math.random() * 3))
    
    let name = '', stats = {}, emoji = '', weaponType = null
    
    if (['rare', 'epic', 'legendary'].includes(rarity)) name = prefixes[Math.floor(Math.random() * prefixes.length)] + ' '
    
    if (type === 'weapon') {
        weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)]
        name += weaponType.charAt(0).toUpperCase() + weaponType.slice(1)
        emoji = emojis.weapon[weaponType]
        const baseDmg = 5 + floor * 2
        if (['staff'].includes(weaponType)) {
            stats.magicDamage = Math.floor(baseDmg * rarityMult)
            stats.mana = Math.floor((10 + floor * 3) * rarityMult)
            if (Math.random() > 0.5) stats.magicPower = Math.floor((2 + floor * 0.5) * rarityMult)
        } else {
            stats.physicalDamage = Math.floor(baseDmg * rarityMult)
            if (Math.random() > 0.7) stats.magicDamage = Math.floor(baseDmg * 0.3 * rarityMult)
            if (weaponType === 'dagger') stats.speed = Math.floor((3 + floor * 0.3) * rarityMult)
        }
    } else {
        const typeNames = { helmet: 'Helm', chest: 'Armor', leggings: 'Leggings', boots: 'Boots', amulet: 'Amulet', ring: 'Ring', offhand: 'Shield' }
        name += typeNames[type]
        emoji = emojis[type]
        stats.defense = Math.floor((2 + floor) * rarityMult)
        if (type === 'amulet' || type === 'ring') {
            stats.defense = 0
            if (Math.random() > 0.5) stats.hp = Math.floor((5 + floor * 2) * rarityMult)
            if (Math.random() > 0.5) stats.mana = Math.floor((10 + floor * 2) * rarityMult)
            if (Math.random() > 0.7) stats.physicalPower = Math.floor((2 + floor * 0.4) * rarityMult)
            if (Math.random() > 0.7) stats.magicPower = Math.floor((2 + floor * 0.4) * rarityMult)
        } else {
            if (Math.random() > 0.6) stats.hp = Math.floor((5 + floor * 2) * rarityMult)
            if (Math.random() > 0.7) stats.magicResist = Math.floor((2 + floor * 0.5) * rarityMult)
        }
        if (type === 'boots' && Math.random() > 0.5) stats.speed = Math.floor((2 + floor * 0.3) * rarityMult)
    }
    
    if (['uncommon', 'rare', 'epic', 'legendary'].includes(rarity)) name += ' ' + suffixes[Math.floor(Math.random() * suffixes.length)]
    
    return { id: 'gen_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), name, type, weaponType, emoji, description: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} item from floor ${floor}.`, stats, levelReq, tier: Math.ceil(floor / 5), rarity, generated: true }
}
