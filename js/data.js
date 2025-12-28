// ============================================
// RACES
// ============================================
export const RACES = {
    human: {
        id: 'human',
        name: 'Human',
        emoji: '🧑',
        description: 'Versatile and adaptable. Balanced stats.',
        bonuses: { hp: 10, attack: 2, defense: 2, speed: 2 }
    },
    elf: {
        id: 'elf',
        name: 'Elf',
        emoji: '🧝',
        description: 'Graceful and quick. High speed and accuracy.',
        bonuses: { hp: 0, attack: 3, defense: 1, speed: 4 }
    },
    dwarf: {
        id: 'dwarf',
        name: 'Dwarf',
        emoji: '⛏️',
        description: 'Sturdy and tough. High HP and defense.',
        bonuses: { hp: 25, attack: 2, defense: 4, speed: 0 }
    },
    orc: {
        id: 'orc',
        name: 'Orc',
        emoji: '👹',
        description: 'Brutal and strong. High attack power.',
        bonuses: { hp: 15, attack: 5, defense: 2, speed: 1 }
    },
    undead: {
        id: 'undead',
        name: 'Undead',
        emoji: '💀',
        description: 'Risen from death. Resistant but slow.',
        bonuses: { hp: 20, attack: 2, defense: 5, speed: -2 }
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
        description: 'Masters of melee combat. High HP and defense.',
        bonuses: { hp: 30, attack: 4, defense: 4, speed: 0 },
        startingWeapon: 'rusty_sword'
    },
    mage: {
        id: 'mage',
        name: 'Mage',
        emoji: '🔮',
        description: 'Wielders of arcane power. High damage, fragile.',
        bonuses: { hp: 0, attack: 6, defense: 1, speed: 2 },
        startingWeapon: 'wooden_staff'
    },
    hunter: {
        id: 'hunter',
        name: 'Hunter',
        emoji: '🏹',
        description: 'Swift and deadly. Balanced offense and speed.',
        bonuses: { hp: 10, attack: 5, defense: 2, speed: 4 },
        startingWeapon: 'shortbow'
    }
}

// ============================================
// EQUIPMENT SLOTS
// ============================================
export const EQUIPMENT_SLOTS = ['weapon', 'helmet', 'chest', 'leggings', 'boots']

// ============================================
// ITEMS / EQUIPMENT
// ============================================
export const ITEMS = {
    // === WEAPONS ===
    // Swords
    rusty_sword: {
        id: 'rusty_sword',
        name: 'Rusty Sword',
        type: 'weapon',
        weaponType: 'sword',
        emoji: '🗡️',
        stats: { attack: 3 },
        tier: 1
    },
    iron_sword: {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: 'weapon',
        weaponType: 'sword',
        emoji: '🗡️',
        stats: { attack: 6 },
        tier: 2
    },
    steel_sword: {
        id: 'steel_sword',
        name: 'Steel Sword',
        type: 'weapon',
        weaponType: 'sword',
        emoji: '🗡️',
        stats: { attack: 10 },
        tier: 3
    },
    
    // Daggers
    rusty_dagger: {
        id: 'rusty_dagger',
        name: 'Rusty Dagger',
        type: 'weapon',
        weaponType: 'dagger',
        emoji: '🔪',
        stats: { attack: 2, speed: 2 },
        tier: 1
    },
    iron_dagger: {
        id: 'iron_dagger',
        name: 'Iron Dagger',
        type: 'weapon',
        weaponType: 'dagger',
        emoji: '🔪',
        stats: { attack: 4, speed: 3 },
        tier: 2
    },
    
    // Bows
    shortbow: {
        id: 'shortbow',
        name: 'Shortbow',
        type: 'weapon',
        weaponType: 'bow',
        emoji: '🏹',
        stats: { attack: 4, speed: 1 },
        tier: 1
    },
    longbow: {
        id: 'longbow',
        name: 'Longbow',
        type: 'weapon',
        weaponType: 'bow',
        emoji: '🏹',
        stats: { attack: 7, speed: 1 },
        tier: 2
    },
    
    // Staffs
    wooden_staff: {
        id: 'wooden_staff',
        name: 'Wooden Staff',
        type: 'weapon',
        weaponType: 'staff',
        emoji: '🪄',
        stats: { attack: 5 },
        tier: 1
    },
    arcane_staff: {
        id: 'arcane_staff',
        name: 'Arcane Staff',
        type: 'weapon',
        weaponType: 'staff',
        emoji: '🪄',
        stats: { attack: 9 },
        tier: 2
    },
    
    // === HELMETS ===
    leather_cap: {
        id: 'leather_cap',
        name: 'Leather Cap',
        type: 'helmet',
        emoji: '🎓',
        stats: { defense: 1 },
        tier: 1
    },
    iron_helm: {
        id: 'iron_helm',
        name: 'Iron Helm',
        type: 'helmet',
        emoji: '⛑️',
        stats: { defense: 3, hp: 5 },
        tier: 2
    },
    steel_helm: {
        id: 'steel_helm',
        name: 'Steel Helm',
        type: 'helmet',
        emoji: '⛑️',
        stats: { defense: 5, hp: 10 },
        tier: 3
    },
    
    // === CHEST ===
    cloth_shirt: {
        id: 'cloth_shirt',
        name: 'Cloth Shirt',
        type: 'chest',
        emoji: '👕',
        stats: { defense: 1 },
        tier: 1
    },
    leather_armor: {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: 'chest',
        emoji: '🦺',
        stats: { defense: 3, hp: 5 },
        tier: 2
    },
    chainmail: {
        id: 'chainmail',
        name: 'Chainmail',
        type: 'chest',
        emoji: '🦺',
        stats: { defense: 6, hp: 15 },
        tier: 3
    },
    
    // === LEGGINGS ===
    cloth_pants: {
        id: 'cloth_pants',
        name: 'Cloth Pants',
        type: 'leggings',
        emoji: '👖',
        stats: { defense: 1 },
        tier: 1
    },
    leather_leggings: {
        id: 'leather_leggings',
        name: 'Leather Leggings',
        type: 'leggings',
        emoji: '👖',
        stats: { defense: 2, speed: 1 },
        tier: 2
    },
    iron_leggings: {
        id: 'iron_leggings',
        name: 'Iron Leggings',
        type: 'leggings',
        emoji: '👖',
        stats: { defense: 4, hp: 5 },
        tier: 3
    },
    
    // === BOOTS ===
    sandals: {
        id: 'sandals',
        name: 'Sandals',
        type: 'boots',
        emoji: '👟',
        stats: { speed: 1 },
        tier: 1
    },
    leather_boots: {
        id: 'leather_boots',
        name: 'Leather Boots',
        type: 'boots',
        emoji: '👢',
        stats: { defense: 1, speed: 2 },
        tier: 2
    },
    iron_boots: {
        id: 'iron_boots',
        name: 'Iron Boots',
        type: 'boots',
        emoji: '👢',
        stats: { defense: 3, speed: 1 },
        tier: 3
    },
    
    // === CONSUMABLES ===
    health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        emoji: '🧪',
        effect: { heal: 30 },
        tier: 1
    },
    large_health_potion: {
        id: 'large_health_potion',
        name: 'Large Health Potion',
        type: 'consumable',
        emoji: '🧪',
        effect: { heal: 60 },
        tier: 2
    }
}

// ============================================
// ENEMIES
// ============================================
export const ENEMIES = {
    // Floor 1-5
    rat: {
        id: 'rat',
        name: 'Giant Rat',
        emoji: '🐀',
        baseHp: 15,
        baseAttack: 3,
        baseDefense: 1,
        baseSpeed: 3,
        xp: 10,
        gold: [2, 8],
        floors: [1, 5]
    },
    bat: {
        id: 'bat',
        name: 'Cave Bat',
        emoji: '🦇',
        baseHp: 12,
        baseAttack: 4,
        baseDefense: 0,
        baseSpeed: 5,
        xp: 12,
        gold: [3, 10],
        floors: [1, 6]
    },
    slime: {
        id: 'slime',
        name: 'Slime',
        emoji: '🟢',
        baseHp: 20,
        baseAttack: 2,
        baseDefense: 2,
        baseSpeed: 1,
        xp: 8,
        gold: [1, 5],
        floors: [1, 4]
    },
    
    // Floor 3-8
    goblin: {
        id: 'goblin',
        name: 'Goblin',
        emoji: '👺',
        baseHp: 25,
        baseAttack: 6,
        baseDefense: 2,
        baseSpeed: 3,
        xp: 20,
        gold: [8, 20],
        floors: [3, 8]
    },
    skeleton: {
        id: 'skeleton',
        name: 'Skeleton',
        emoji: '💀',
        baseHp: 22,
        baseAttack: 7,
        baseDefense: 3,
        baseSpeed: 2,
        xp: 25,
        gold: [10, 25],
        floors: [3, 10]
    },
    spider: {
        id: 'spider',
        name: 'Giant Spider',
        emoji: '🕷️',
        baseHp: 28,
        baseAttack: 8,
        baseDefense: 2,
        baseSpeed: 4,
        xp: 22,
        gold: [5, 18],
        floors: [4, 9]
    },
    
    // Floor 6-12
    orc_grunt: {
        id: 'orc_grunt',
        name: 'Orc Grunt',
        emoji: '👹',
        baseHp: 40,
        baseAttack: 10,
        baseDefense: 5,
        baseSpeed: 2,
        xp: 35,
        gold: [15, 35],
        floors: [6, 12]
    },
    zombie: {
        id: 'zombie',
        name: 'Zombie',
        emoji: '🧟',
        baseHp: 50,
        baseAttack: 8,
        baseDefense: 6,
        baseSpeed: 1,
        xp: 30,
        gold: [10, 30],
        floors: [5, 11]
    },
    ghost: {
        id: 'ghost',
        name: 'Ghost',
        emoji: '👻',
        baseHp: 30,
        baseAttack: 12,
        baseDefense: 8,
        baseSpeed: 4,
        xp: 40,
        gold: [20, 40],
        floors: [7, 15]
    },
    
    // Floor 10+
    troll: {
        id: 'troll',
        name: 'Troll',
        emoji: '🧌',
        baseHp: 80,
        baseAttack: 15,
        baseDefense: 8,
        baseSpeed: 1,
        xp: 60,
        gold: [30, 60],
        floors: [10, 20]
    },
    dark_knight: {
        id: 'dark_knight',
        name: 'Dark Knight',
        emoji: '🖤',
        baseHp: 70,
        baseAttack: 18,
        baseDefense: 12,
        baseSpeed: 3,
        xp: 75,
        gold: [40, 80],
        floors: [12, 25]
    },
    demon: {
        id: 'demon',
        name: 'Demon',
        emoji: '😈',
        baseHp: 100,
        baseAttack: 22,
        baseDefense: 10,
        baseSpeed: 4,
        xp: 100,
        gold: [50, 100],
        floors: [15, 99]
    }
}

// ============================================
// LOOT TABLES
// ============================================
export const LOOT_TABLES = {
    tier1: ['leather_cap', 'cloth_shirt', 'cloth_pants', 'sandals', 'rusty_dagger', 'health_potion'],
    tier2: ['iron_helm', 'leather_armor', 'leather_leggings', 'leather_boots', 'iron_sword', 'iron_dagger', 'longbow', 'arcane_staff', 'health_potion', 'large_health_potion'],
    tier3: ['steel_helm', 'chainmail', 'iron_leggings', 'iron_boots', 'steel_sword', 'large_health_potion']
}

// Get random enemy for floor
export function getEnemyForFloor(floor) {
    const available = Object.values(ENEMIES).filter(e => 
        floor >= e.floors[0] && floor <= e.floors[1]
    )
    
    if (available.length === 0) {
        // Fallback to highest floor enemies
        return Object.values(ENEMIES).reduce((a, b) => 
            b.floors[1] > a.floors[1] ? b : a
        )
    }
    
    return available[Math.floor(Math.random() * available.length)]
}

// Scale enemy stats based on floor
export function scaleEnemy(enemy, floor) {
    const scaling = 1 + (floor - enemy.floors[0]) * 0.1
    return {
        ...enemy,
        hp: Math.floor(enemy.baseHp * scaling),
        maxHp: Math.floor(enemy.baseHp * scaling),
        attack: Math.floor(enemy.baseAttack * scaling),
        defense: Math.floor(enemy.baseDefense * scaling),
        speed: enemy.baseSpeed,
        xp: Math.floor(enemy.xp * scaling),
        gold: Math.floor((enemy.gold[0] + Math.random() * (enemy.gold[1] - enemy.gold[0])) * scaling)
    }
}

// Get loot drop
export function getLootDrop(floor) {
    const roll = Math.random()
    
    // 30% chance for loot
    if (roll > 0.3) return null
    
    let table
    if (floor >= 10) table = LOOT_TABLES.tier3
    else if (floor >= 5) table = LOOT_TABLES.tier2
    else table = LOOT_TABLES.tier1
    
    const itemId = table[Math.floor(Math.random() * table.length)]
    return ITEMS[itemId]
}
