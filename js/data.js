// ============================================
// RACES
// ============================================
export const RACES = {
    human: {
        id: 'human',
        name: 'Human',
        emoji: '🧑',
        description: 'Versatile and adaptable. Balanced stats.',
        bonuses: { hp: 10, mana: 10, attack: 2, defense: 2, speed: 2 }
    },
    elf: {
        id: 'elf',
        name: 'Elf',
        emoji: '🧝',
        description: 'Graceful and magical. High mana and speed.',
        bonuses: { hp: 0, mana: 30, attack: 2, defense: 1, speed: 4 }
    },
    dwarf: {
        id: 'dwarf',
        name: 'Dwarf',
        emoji: '⛏️',
        description: 'Sturdy and tough. High HP and defense.',
        bonuses: { hp: 25, mana: 5, attack: 2, defense: 4, speed: 0 }
    },
    orc: {
        id: 'orc',
        name: 'Orc',
        emoji: '👹',
        description: 'Brutal and strong. High attack power.',
        bonuses: { hp: 15, mana: 0, attack: 5, defense: 2, speed: 1 }
    },
    undead: {
        id: 'undead',
        name: 'Undead',
        emoji: '💀',
        description: 'Risen from death. Resistant but slow.',
        bonuses: { hp: 20, mana: 15, attack: 2, defense: 5, speed: -2 }
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
        bonuses: { hp: 30, mana: 10, attack: 4, defense: 4, speed: 0 },
        startingWeapon: 'rusty_sword',
        canLearn: ['warrior', 'all']
    },
    mage: {
        id: 'mage',
        name: 'Mage',
        emoji: '🔮',
        description: 'Wielders of arcane power. High mana and magic.',
        bonuses: { hp: 0, mana: 50, attack: 2, defense: 1, speed: 2 },
        startingWeapon: 'wooden_staff',
        canLearn: ['mage', 'all']
    },
    hunter: {
        id: 'hunter',
        name: 'Hunter',
        emoji: '🏹',
        description: 'Swift and deadly. Balanced offense and speed.',
        bonuses: { hp: 10, mana: 20, attack: 5, defense: 2, speed: 4 },
        startingWeapon: 'shortbow',
        canLearn: ['hunter', 'all']
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
// ITEMS / EQUIPMENT
// ============================================
export const ITEMS = {
    // === WEAPONS ===
    rusty_sword: {
        id: 'rusty_sword',
        name: 'Rusty Sword',
        type: 'weapon',
        weaponType: 'sword',
        emoji: '🗡️',
        description: 'A worn blade, still sharp enough to cut.',
        stats: { attack: 3 },
        tier: 1
    },
    iron_sword: {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: 'weapon',
        weaponType: 'sword',
        emoji: '🗡️',
        description: 'A reliable iron blade.',
        stats: { attack: 6 },
        tier: 2
    },
    steel_sword: {
        id: 'steel_sword',
        name: 'Steel Sword',
        type: 'weapon',
        weaponType: 'sword',
        emoji: '🗡️',
        description: 'Finely crafted steel, deadly in combat.',
        stats: { attack: 10 },
        tier: 3
    },
    flame_blade: {
        id: 'flame_blade',
        name: 'Flame Blade',
        type: 'weapon',
        weaponType: 'sword',
        emoji: '🔥',
        description: 'A blade wreathed in eternal fire.',
        stats: { attack: 14, mana: 10 },
        tier: 4
    },
    
    rusty_dagger: {
        id: 'rusty_dagger',
        name: 'Rusty Dagger',
        type: 'weapon',
        weaponType: 'dagger',
        emoji: '🔪',
        description: 'Quick but weak.',
        stats: { attack: 2, speed: 2 },
        tier: 1
    },
    iron_dagger: {
        id: 'iron_dagger',
        name: 'Iron Dagger',
        type: 'weapon',
        weaponType: 'dagger',
        emoji: '🔪',
        description: 'A swift iron blade.',
        stats: { attack: 4, speed: 3 },
        tier: 2
    },
    shadow_dagger: {
        id: 'shadow_dagger',
        name: 'Shadow Dagger',
        type: 'weapon',
        weaponType: 'dagger',
        emoji: '🗡️',
        description: 'Strikes from the shadows.',
        stats: { attack: 8, speed: 5 },
        tier: 3
    },
    
    shortbow: {
        id: 'shortbow',
        name: 'Shortbow',
        type: 'weapon',
        weaponType: 'bow',
        emoji: '🏹',
        description: 'A simple hunting bow.',
        stats: { attack: 4, speed: 1 },
        tier: 1
    },
    longbow: {
        id: 'longbow',
        name: 'Longbow',
        type: 'weapon',
        weaponType: 'bow',
        emoji: '🏹',
        description: 'Greater range and power.',
        stats: { attack: 7, speed: 1 },
        tier: 2
    },
    elven_bow: {
        id: 'elven_bow',
        name: 'Elven Bow',
        type: 'weapon',
        weaponType: 'bow',
        emoji: '🏹',
        description: 'Crafted by elven artisans.',
        stats: { attack: 11, speed: 3 },
        tier: 3
    },
    
    wooden_staff: {
        id: 'wooden_staff',
        name: 'Wooden Staff',
        type: 'weapon',
        weaponType: 'staff',
        emoji: '🪄',
        description: 'A basic magic conduit.',
        stats: { attack: 3, mana: 15 },
        tier: 1
    },
    arcane_staff: {
        id: 'arcane_staff',
        name: 'Arcane Staff',
        type: 'weapon',
        weaponType: 'staff',
        emoji: '🪄',
        description: 'Humming with arcane energy.',
        stats: { attack: 6, mana: 30 },
        tier: 2
    },
    staff_of_storms: {
        id: 'staff_of_storms',
        name: 'Staff of Storms',
        type: 'weapon',
        weaponType: 'staff',
        emoji: '⚡',
        description: 'Commands lightning itself.',
        stats: { attack: 10, mana: 50 },
        tier: 3
    },
    
    // === OFFHAND ===
    wooden_shield: {
        id: 'wooden_shield',
        name: 'Wooden Shield',
        type: 'offhand',
        emoji: '🛡️',
        description: 'Basic protection.',
        stats: { defense: 2 },
        tier: 1
    },
    iron_shield: {
        id: 'iron_shield',
        name: 'Iron Shield',
        type: 'offhand',
        emoji: '🛡️',
        description: 'Sturdy iron defense.',
        stats: { defense: 5, hp: 10 },
        tier: 2
    },
    tower_shield: {
        id: 'tower_shield',
        name: 'Tower Shield',
        type: 'offhand',
        emoji: '🛡️',
        description: 'Massive protective barrier.',
        stats: { defense: 10, hp: 25, speed: -2 },
        tier: 3
    },
    tome_of_wisdom: {
        id: 'tome_of_wisdom',
        name: 'Tome of Wisdom',
        type: 'offhand',
        emoji: '📖',
        description: 'Ancient magical knowledge.',
        stats: { mana: 40, attack: 3 },
        tier: 3
    },
    
    // === HELMETS ===
    leather_cap: {
        id: 'leather_cap',
        name: 'Leather Cap',
        type: 'helmet',
        emoji: '🎓',
        description: 'Light head protection.',
        stats: { defense: 1 },
        tier: 1
    },
    iron_helm: {
        id: 'iron_helm',
        name: 'Iron Helm',
        type: 'helmet',
        emoji: '⛑️',
        description: 'Solid iron protection.',
        stats: { defense: 3, hp: 5 },
        tier: 2
    },
    steel_helm: {
        id: 'steel_helm',
        name: 'Steel Helm',
        type: 'helmet',
        emoji: '⛑️',
        description: 'Knight-grade helmet.',
        stats: { defense: 5, hp: 10 },
        tier: 3
    },
    wizard_hat: {
        id: 'wizard_hat',
        name: 'Wizard Hat',
        type: 'helmet',
        emoji: '🎩',
        description: 'Enhances magical ability.',
        stats: { defense: 1, mana: 25 },
        tier: 2
    },
    
    // === CHEST ===
    cloth_shirt: {
        id: 'cloth_shirt',
        name: 'Cloth Shirt',
        type: 'chest',
        emoji: '👕',
        description: 'Basic clothing.',
        stats: { defense: 1 },
        tier: 1
    },
    leather_armor: {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: 'chest',
        emoji: '🦺',
        description: 'Light and flexible.',
        stats: { defense: 3, hp: 5 },
        tier: 2
    },
    chainmail: {
        id: 'chainmail',
        name: 'Chainmail',
        type: 'chest',
        emoji: '🦺',
        description: 'Interlocked metal rings.',
        stats: { defense: 6, hp: 15 },
        tier: 3
    },
    mage_robes: {
        id: 'mage_robes',
        name: 'Mage Robes',
        type: 'chest',
        emoji: '👘',
        description: 'Woven with magical thread.',
        stats: { defense: 2, mana: 35 },
        tier: 2
    },
    
    // === LEGGINGS ===
    cloth_pants: {
        id: 'cloth_pants',
        name: 'Cloth Pants',
        type: 'leggings',
        emoji: '👖',
        description: 'Simple trousers.',
        stats: { defense: 1 },
        tier: 1
    },
    leather_leggings: {
        id: 'leather_leggings',
        name: 'Leather Leggings',
        type: 'leggings',
        emoji: '👖',
        description: 'Flexible leather protection.',
        stats: { defense: 2, speed: 1 },
        tier: 2
    },
    iron_leggings: {
        id: 'iron_leggings',
        name: 'Iron Leggings',
        type: 'leggings',
        emoji: '👖',
        description: 'Heavy but protective.',
        stats: { defense: 4, hp: 5 },
        tier: 3
    },
    
    // === BOOTS ===
    sandals: {
        id: 'sandals',
        name: 'Sandals',
        type: 'boots',
        emoji: '👟',
        description: 'Light footwear.',
        stats: { speed: 1 },
        tier: 1
    },
    leather_boots: {
        id: 'leather_boots',
        name: 'Leather Boots',
        type: 'boots',
        emoji: '👢',
        description: 'Comfortable and quick.',
        stats: { defense: 1, speed: 2 },
        tier: 2
    },
    iron_boots: {
        id: 'iron_boots',
        name: 'Iron Boots',
        type: 'boots',
        emoji: '👢',
        description: 'Heavy but protective.',
        stats: { defense: 3, speed: -1 },
        tier: 3
    },
    swift_boots: {
        id: 'swift_boots',
        name: 'Swift Boots',
        type: 'boots',
        emoji: '👟',
        description: 'Enchanted for speed.',
        stats: { speed: 5 },
        tier: 3
    },
    
    // === AMULETS ===
    copper_amulet: {
        id: 'copper_amulet',
        name: 'Copper Amulet',
        type: 'amulet',
        emoji: '📿',
        description: 'A simple protective charm.',
        stats: { hp: 10 },
        tier: 1
    },
    silver_amulet: {
        id: 'silver_amulet',
        name: 'Silver Amulet',
        type: 'amulet',
        emoji: '📿',
        description: 'Blessed silver protection.',
        stats: { hp: 20, defense: 2 },
        tier: 2
    },
    amulet_of_power: {
        id: 'amulet_of_power',
        name: 'Amulet of Power',
        type: 'amulet',
        emoji: '💎',
        description: 'Radiates raw power.',
        stats: { attack: 5, mana: 20 },
        tier: 3
    },
    
    // === RINGS ===
    copper_ring: {
        id: 'copper_ring',
        name: 'Copper Ring',
        type: 'ring',
        emoji: '💍',
        description: 'A simple band.',
        stats: { hp: 5 },
        tier: 1
    },
    ring_of_strength: {
        id: 'ring_of_strength',
        name: 'Ring of Strength',
        type: 'ring',
        emoji: '💍',
        description: 'Empowers the wearer.',
        stats: { attack: 3 },
        tier: 2
    },
    ring_of_protection: {
        id: 'ring_of_protection',
        name: 'Ring of Protection',
        type: 'ring',
        emoji: '💍',
        description: 'Magical ward.',
        stats: { defense: 3, hp: 10 },
        tier: 2
    },
    ring_of_arcana: {
        id: 'ring_of_arcana',
        name: 'Ring of Arcana',
        type: 'ring',
        emoji: '💍',
        description: 'Pulses with mana.',
        stats: { mana: 30 },
        tier: 2
    },
    ring_of_haste: {
        id: 'ring_of_haste',
        name: 'Ring of Haste',
        type: 'ring',
        emoji: '💍',
        description: 'Quickens reflexes.',
        stats: { speed: 4 },
        tier: 3
    },
    
    // === CONSUMABLES ===
    health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        emoji: '🧪',
        description: 'Restores 30 HP.',
        effect: { heal: 30 },
        tier: 1
    },
    large_health_potion: {
        id: 'large_health_potion',
        name: 'Large Health Potion',
        type: 'consumable',
        emoji: '🧪',
        description: 'Restores 60 HP.',
        effect: { heal: 60 },
        tier: 2
    },
    mana_potion: {
        id: 'mana_potion',
        name: 'Mana Potion',
        type: 'consumable',
        emoji: '💧',
        description: 'Restores 25 mana.',
        effect: { restoreMana: 25 },
        tier: 1
    },
    large_mana_potion: {
        id: 'large_mana_potion',
        name: 'Large Mana Potion',
        type: 'consumable',
        emoji: '💧',
        description: 'Restores 50 mana.',
        effect: { restoreMana: 50 },
        tier: 2
    },
    elixir: {
        id: 'elixir',
        name: 'Elixir',
        type: 'consumable',
        emoji: '✨',
        description: 'Restores HP and Mana fully.',
        effect: { heal: 999, restoreMana: 999 },
        tier: 3
    }
}

// ============================================
// SPELLS / SKILLS
// ============================================
export const SPELLS = {
    // === WARRIOR SKILLS ===
    power_strike: {
        id: 'power_strike',
        name: 'Power Strike',
        emoji: '💥',
        description: 'A mighty blow dealing 150% damage.',
        class: 'warrior',
        manaCost: 10,
        levelReq: 2,
        effect: { damageMultiplier: 1.5 }
    },
    shield_bash: {
        id: 'shield_bash',
        name: 'Shield Bash',
        emoji: '🛡️',
        description: 'Stun enemy, dealing damage and reducing speed.',
        class: 'warrior',
        manaCost: 15,
        levelReq: 4,
        effect: { damage: 15, debuff: { speed: -3, turns: 2 } }
    },
    battle_cry: {
        id: 'battle_cry',
        name: 'Battle Cry',
        emoji: '📢',
        description: 'Boost attack by 5 for 3 turns.',
        class: 'warrior',
        manaCost: 20,
        levelReq: 6,
        effect: { buff: { attack: 5, turns: 3 } }
    },
    
    // === MAGE SKILLS ===
    fireball: {
        id: 'fireball',
        name: 'Fireball',
        emoji: '🔥',
        description: 'Hurl a ball of fire for 25 damage.',
        class: 'mage',
        manaCost: 15,
        levelReq: 2,
        effect: { damage: 25 }
    },
    ice_shard: {
        id: 'ice_shard',
        name: 'Ice Shard',
        emoji: '❄️',
        description: 'Pierce enemy with ice, slowing them.',
        class: 'mage',
        manaCost: 12,
        levelReq: 3,
        effect: { damage: 15, debuff: { speed: -2, turns: 2 } }
    },
    lightning_bolt: {
        id: 'lightning_bolt',
        name: 'Lightning Bolt',
        emoji: '⚡',
        description: 'Strike with lightning for 40 damage.',
        class: 'mage',
        manaCost: 25,
        levelReq: 5,
        effect: { damage: 40 }
    },
    arcane_shield: {
        id: 'arcane_shield',
        name: 'Arcane Shield',
        emoji: '🔮',
        description: 'Magical barrier, +10 defense for 3 turns.',
        class: 'mage',
        manaCost: 20,
        levelReq: 4,
        effect: { buff: { defense: 10, turns: 3 } }
    },
    
    // === HUNTER SKILLS ===
    aimed_shot: {
        id: 'aimed_shot',
        name: 'Aimed Shot',
        emoji: '🎯',
        description: 'Precise shot dealing 130% damage.',
        class: 'hunter',
        manaCost: 10,
        levelReq: 2,
        effect: { damageMultiplier: 1.3 }
    },
    poison_arrow: {
        id: 'poison_arrow',
        name: 'Poison Arrow',
        emoji: '☠️',
        description: 'Poison dealing 8 damage per turn for 3 turns.',
        class: 'hunter',
        manaCost: 15,
        levelReq: 4,
        effect: { damage: 10, dot: { damage: 8, turns: 3 } }
    },
    evasion: {
        id: 'evasion',
        name: 'Evasion',
        emoji: '💨',
        description: 'Boost speed by 5 for 2 turns.',
        class: 'hunter',
        manaCost: 12,
        levelReq: 3,
        effect: { buff: { speed: 5, turns: 2 } }
    },
    multi_shot: {
        id: 'multi_shot',
        name: 'Multi Shot',
        emoji: '🏹',
        description: 'Fire 3 arrows for 80% damage each.',
        class: 'hunter',
        manaCost: 25,
        levelReq: 6,
        effect: { hits: 3, damageMultiplier: 0.8 }
    },
    
    // === ALL CLASSES ===
    heal: {
        id: 'heal',
        name: 'Heal',
        emoji: '💚',
        description: 'Restore 25 HP.',
        class: 'all',
        manaCost: 15,
        levelReq: 3,
        effect: { heal: 25 }
    }
}

// ============================================
// SCROLLS (Learn spells from these)
// ============================================
export const SCROLLS = {}
for (const [id, spell] of Object.entries(SPELLS)) {
    SCROLLS[`scroll_${id}`] = {
        id: `scroll_${id}`,
        name: `Scroll: ${spell.name}`,
        type: 'scroll',
        emoji: '📜',
        description: `Learn ${spell.name}. Requires Level ${spell.levelReq}, ${spell.class === 'all' ? 'Any class' : CLASSES[spell.class]?.name}.`,
        spellId: id,
        tier: Math.ceil(spell.levelReq / 2)
    }
}

// Add scrolls to ITEMS
Object.assign(ITEMS, SCROLLS)

// ============================================
// ENEMIES
// ============================================
export const ENEMIES = {
    rat: { id: 'rat', name: 'Giant Rat', emoji: '🐀', baseHp: 15, baseAttack: 3, baseDefense: 1, baseSpeed: 3, xp: 10, gold: [2, 8], floors: [1, 5] },
    bat: { id: 'bat', name: 'Cave Bat', emoji: '🦇', baseHp: 12, baseAttack: 4, baseDefense: 0, baseSpeed: 5, xp: 12, gold: [3, 10], floors: [1, 6] },
    slime: { id: 'slime', name: 'Slime', emoji: '🟢', baseHp: 20, baseAttack: 2, baseDefense: 2, baseSpeed: 1, xp: 8, gold: [1, 5], floors: [1, 4] },
    goblin: { id: 'goblin', name: 'Goblin', emoji: '👺', baseHp: 25, baseAttack: 6, baseDefense: 2, baseSpeed: 3, xp: 20, gold: [8, 20], floors: [3, 8] },
    skeleton: { id: 'skeleton', name: 'Skeleton', emoji: '💀', baseHp: 22, baseAttack: 7, baseDefense: 3, baseSpeed: 2, xp: 25, gold: [10, 25], floors: [3, 10] },
    spider: { id: 'spider', name: 'Giant Spider', emoji: '🕷️', baseHp: 28, baseAttack: 8, baseDefense: 2, baseSpeed: 4, xp: 22, gold: [5, 18], floors: [4, 9] },
    orc_grunt: { id: 'orc_grunt', name: 'Orc Grunt', emoji: '👹', baseHp: 40, baseAttack: 10, baseDefense: 5, baseSpeed: 2, xp: 35, gold: [15, 35], floors: [6, 12] },
    zombie: { id: 'zombie', name: 'Zombie', emoji: '🧟', baseHp: 50, baseAttack: 8, baseDefense: 6, baseSpeed: 1, xp: 30, gold: [10, 30], floors: [5, 11] },
    ghost: { id: 'ghost', name: 'Ghost', emoji: '👻', baseHp: 30, baseAttack: 12, baseDefense: 8, baseSpeed: 4, xp: 40, gold: [20, 40], floors: [7, 15] },
    troll: { id: 'troll', name: 'Troll', emoji: '🧌', baseHp: 80, baseAttack: 15, baseDefense: 8, baseSpeed: 1, xp: 60, gold: [30, 60], floors: [10, 20] },
    dark_knight: { id: 'dark_knight', name: 'Dark Knight', emoji: '🖤', baseHp: 70, baseAttack: 18, baseDefense: 12, baseSpeed: 3, xp: 75, gold: [40, 80], floors: [12, 25] },
    demon: { id: 'demon', name: 'Demon', emoji: '😈', baseHp: 100, baseAttack: 22, baseDefense: 10, baseSpeed: 4, xp: 100, gold: [50, 100], floors: [15, 99] }
}

// Overworld enemies (weaker)
export const OVERWORLD_ENEMIES = {
    wolf: { id: 'wolf', name: 'Wild Wolf', emoji: '🐺', baseHp: 20, baseAttack: 5, baseDefense: 2, baseSpeed: 4, xp: 15, gold: [5, 15] },
    bandit: { id: 'bandit', name: 'Bandit', emoji: '🥷', baseHp: 30, baseAttack: 7, baseDefense: 3, baseSpeed: 3, xp: 25, gold: [15, 30] },
    boar: { id: 'boar', name: 'Wild Boar', emoji: '🐗', baseHp: 25, baseAttack: 6, baseDefense: 4, baseSpeed: 2, xp: 18, gold: [8, 20] }
}

// ============================================
// LOOT TABLES
// ============================================
export const LOOT_TABLES = {
    tier1: ['leather_cap', 'cloth_shirt', 'cloth_pants', 'sandals', 'rusty_dagger', 'health_potion', 'mana_potion', 'copper_ring', 'copper_amulet', 'wooden_shield'],
    tier2: ['iron_helm', 'leather_armor', 'leather_leggings', 'leather_boots', 'iron_sword', 'iron_dagger', 'longbow', 'arcane_staff', 'health_potion', 'large_health_potion', 'mana_potion', 'ring_of_strength', 'ring_of_protection', 'silver_amulet', 'iron_shield', 'wizard_hat', 'mage_robes'],
    tier3: ['steel_helm', 'chainmail', 'iron_leggings', 'iron_boots', 'steel_sword', 'large_health_potion', 'large_mana_potion', 'elixir', 'amulet_of_power', 'ring_of_haste', 'ring_of_arcana', 'tower_shield', 'tome_of_wisdom', 'swift_boots', 'elven_bow', 'shadow_dagger', 'staff_of_storms', 'flame_blade'],
    scrolls_early: ['scroll_power_strike', 'scroll_fireball', 'scroll_aimed_shot', 'scroll_heal'],
    scrolls_mid: ['scroll_shield_bash', 'scroll_ice_shard', 'scroll_poison_arrow', 'scroll_evasion', 'scroll_arcane_shield'],
    scrolls_late: ['scroll_battle_cry', 'scroll_lightning_bolt', 'scroll_multi_shot']
}

// ============================================
// BIOMES FOR OVERWORLD
// ============================================
export const BIOMES = {
    castle: { id: 'castle', name: 'Castle', groundChar: '░', color: '#4a4a6a' },
    plains: { id: 'plains', name: 'Plains', groundChar: '.', color: '#3d5c3d' },
    forest: { id: 'forest', name: 'Forest', groundChar: '"', color: '#2d4a2d' },
    mountains: { id: 'mountains', name: 'Mountains', groundChar: '^', color: '#5a5a5a' }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
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
    const scaling = 1 + (floor - 1) * 0.1
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

export function getLootDrop(floor, isChest = false) {
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
    if (roll < 0.05) {
        let scrollTable = floor >= 10 ? LOOT_TABLES.scrolls_late : floor >= 5 ? LOOT_TABLES.scrolls_mid : LOOT_TABLES.scrolls_early
        return ITEMS[scrollTable[Math.floor(Math.random() * scrollTable.length)]]
    }
    let table = floor >= 10 ? LOOT_TABLES.tier3 : floor >= 5 ? LOOT_TABLES.tier2 : LOOT_TABLES.tier1
    return ITEMS[table[Math.floor(Math.random() * table.length)]]
}
