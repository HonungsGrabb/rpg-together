import { BIOMES, getOverworldEnemy, scaleEnemy } from './data.js'

export const WORLD_TILES = { GROUND: 0, WALL: 1, DUNGEON: 2, ENEMY: 3, TREE: 4, WATER: 5 }
export const WORLD_TILE_DISPLAY = {
    [WORLD_TILES.GROUND]: { char: '.', class: 'tile-ground' },
    [WORLD_TILES.WALL]: { char: '#', class: 'tile-wall' },
    [WORLD_TILES.DUNGEON]: { char: '▼', class: 'tile-dungeon' },
    [WORLD_TILES.ENEMY]: { char: '!', class: 'tile-enemy' },
    [WORLD_TILES.TREE]: { char: '♣', class: 'tile-tree' },
    [WORLD_TILES.WATER]: { char: '~', class: 'tile-water' }
}

// Seeded random number generator for consistent world generation
class SeededRandom {
    constructor(seed) {
        this.seed = seed
    }
    
    next() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
        return this.seed / 0x7fffffff
    }
    
    nextInt(max) {
        return Math.floor(this.next() * max)
    }
}

export class WorldArea {
    constructor(width = 20, height = 15) {
        this.width = width; this.height = height; this.grid = []; this.biome = 'plains'
        this.enemies = new Map(); this.dungeonPos = null; this.playerPos = { x: 0, y: 0 }
        this.worldX = 0; this.worldY = 0
        this.otherPlayers = new Map()
    }

    // Create seed from world coordinates - same coords = same world for all players
    getSeed(worldX, worldY) {
        return Math.abs(worldX * 73856093 ^ worldY * 19349663) + 1
    }

    generateCastle() {
        this.biome = 'castle'; this.grid = []
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = []
            for (let x = 0; x < this.width; x++) {
                const midX = Math.floor(this.width / 2), midY = Math.floor(this.height / 2)
                if (y === 0 || y === this.height - 1 || x === 0 || x === this.width - 1) {
                    if ((y === 0 && x >= midX - 1 && x <= midX + 1) || (y === this.height - 1 && x >= midX - 1 && x <= midX + 1) || (x === 0 && y >= midY - 1 && y <= midY + 1) || (x === this.width - 1 && y >= midY - 1 && y <= midY + 1)) this.grid[y][x] = WORLD_TILES.GROUND
                    else this.grid[y][x] = WORLD_TILES.WALL
                } else this.grid[y][x] = WORLD_TILES.GROUND
            }
        }
        this.playerPos = { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) }
        return this
    }

    generate(worldX, worldY, playerLevel = 1) {
        this.worldX = worldX; this.worldY = worldY; this.enemies.clear(); this.dungeonPos = null
        const dist = Math.abs(worldX) + Math.abs(worldY)
        if (dist === 0) return this.generateCastle()
        
        // Use seeded random for consistent generation across all players
        const rng = new SeededRandom(this.getSeed(worldX, worldY))
        
        const biomes = ['plains', 'forest', 'mountains']
        this.biome = biomes[Math.abs(worldX * 1000 + worldY) % biomes.length]
        
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(WORLD_TILES.GROUND))
        
        if (this.biome === 'forest') this.addTrees(0.15, rng)
        else if (this.biome === 'mountains') this.addRocks(0.1, rng)
        
        // Dungeon placement is deterministic
        if (rng.next() < 0.1 + dist * 0.05) this.placeDungeon(rng)
        
        // Enemy placement is deterministic based on seed
        this.placeEnemies(2 + Math.floor(dist / 2) + rng.nextInt(3), playerLevel, rng)
        
        return this
    }

    addTrees(density, rng) { 
        for (let y = 1; y < this.height - 1; y++) 
            for (let x = 1; x < this.width - 1; x++) 
                if (rng.next() < density) this.grid[y][x] = WORLD_TILES.TREE 
    }
    
    addRocks(density, rng) { 
        for (let y = 1; y < this.height - 1; y++) 
            for (let x = 1; x < this.width - 1; x++) 
                if (rng.next() < density) this.grid[y][x] = WORLD_TILES.WALL 
    }

    placeDungeon(rng) {
        let attempts = 0
        while (attempts < 50) {
            const x = 2 + rng.nextInt(this.width - 4)
            const y = 2 + rng.nextInt(this.height - 4)
            if (this.grid[y][x] === WORLD_TILES.GROUND) { 
                this.grid[y][x] = WORLD_TILES.DUNGEON
                this.dungeonPos = { x, y }
                return 
            }
            attempts++
        }
    }

    placeEnemies(count, playerLevel, rng) {
        let placed = 0, attempts = 0
        while (placed < count && attempts < 100) {
            const x = 1 + rng.nextInt(this.width - 2)
            const y = 1 + rng.nextInt(this.height - 2)
            if (this.grid[y][x] === WORLD_TILES.GROUND && !this.enemies.has(`${x},${y}`)) {
                this.enemies.set(`${x},${y}`, scaleEnemy(getOverworldEnemy(rng), Math.max(1, playerLevel - 1)))
                this.grid[y][x] = WORLD_TILES.ENEMY
                placed++
            }
            attempts++
        }
    }

    setOtherPlayers(players) {
        this.otherPlayers = players
    }

    // Move enemies randomly
    moveEnemies() {
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]]
        const newEnemies = new Map()
        
        for (const [key, enemy] of this.enemies) {
            const [x, y] = key.split(',').map(Number)
            
            // 30% chance to move
            if (Math.random() < 0.3) {
                const dir = directions[Math.floor(Math.random() * directions.length)]
                const newX = x + dir[0]
                const newY = y + dir[1]
                
                // Check if new position is valid
                if (newX > 0 && newX < this.width - 1 && 
                    newY > 0 && newY < this.height - 1 &&
                    this.grid[newY][newX] === WORLD_TILES.GROUND &&
                    !newEnemies.has(`${newX},${newY}`) &&
                    !(newX === this.playerPos.x && newY === this.playerPos.y)) {
                    
                    this.grid[y][x] = WORLD_TILES.GROUND
                    this.grid[newY][newX] = WORLD_TILES.ENEMY
                    newEnemies.set(`${newX},${newY}`, enemy)
                } else {
                    newEnemies.set(key, enemy)
                }
            } else {
                newEnemies.set(key, enemy)
            }
        }
        
        this.enemies = newEnemies
    }

    isWalkable(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height && ![WORLD_TILES.WALL, WORLD_TILES.TREE, WORLD_TILES.WATER].includes(this.grid[y][x]) }
    isEdge(x, y) { return x <= 0 || x >= this.width - 1 || y <= 0 || y >= this.height - 1 }
    getEdgeDirection(x, y) {
        if (x <= 0) return { dx: -1, dy: 0, newX: this.width - 2 }
        if (x >= this.width - 1) return { dx: 1, dy: 0, newX: 1 }
        if (y <= 0) return { dx: 0, dy: -1, newY: this.height - 2 }
        if (y >= this.height - 1) return { dx: 0, dy: 1, newY: 1 }
        return null
    }
    getTile(x, y) { return (x < 0 || x >= this.width || y < 0 || y >= this.height) ? WORLD_TILES.WALL : this.grid[y][x] }
    getEnemy(x, y) { return this.enemies.get(`${x},${y}`) }
    removeEnemy(x, y) { const key = `${x},${y}`; if (this.enemies.has(key)) { this.enemies.delete(key); this.grid[y][x] = WORLD_TILES.GROUND } }

    movePlayer(dx, dy) {
        const newX = this.playerPos.x + dx, newY = this.playerPos.y + dy
        if (this.isEdge(newX, newY) && this.biome !== 'castle') {
            const dir = this.getEdgeDirection(newX, newY)
            if (dir) return { moved: true, transition: { dx: dir.dx, dy: dir.dy, newX: dir.newX ?? newX, newY: dir.newY ?? newY } }
        }
        if (this.biome === 'castle') {
            const midX = Math.floor(this.width / 2), midY = Math.floor(this.height / 2)
            if (newY < 0) return { moved: true, transition: { dx: 0, dy: -1, newX: midX, newY: this.height - 2 } }
            if (newY >= this.height) return { moved: true, transition: { dx: 0, dy: 1, newX: midX, newY: 1 } }
            if (newX < 0) return { moved: true, transition: { dx: -1, dy: 0, newX: this.width - 2, newY: midY } }
            if (newX >= this.width) return { moved: true, transition: { dx: 1, dy: 0, newX: 1, newY: midY } }
        }
        if (!this.isWalkable(newX, newY)) return { moved: false }
        const tile = this.getTile(newX, newY)
        if (tile === WORLD_TILES.ENEMY) {
            // 40% chance for group of 2, 15% chance for group of 3
            const roll = Math.random()
            const baseEnemy = this.getEnemy(newX, newY)
            let enemies = [baseEnemy]
            
            if (roll < 0.40) {
                // Add 1 more enemy
                enemies.push(scaleEnemy(getOverworldEnemy(), baseEnemy.level || 1))
            }
            if (roll < 0.15) {
                // Add another enemy (total 3)
                enemies.push(scaleEnemy(getOverworldEnemy(), baseEnemy.level || 1))
            }
            
            return { moved: false, encounter: { type: 'enemy', enemies, x: newX, y: newY } }
        }
        if (tile === WORLD_TILES.DUNGEON) { this.playerPos = { x: newX, y: newY }; return { moved: true, encounter: { type: 'dungeon' } } }
        this.playerPos = { x: newX, y: newY }; return { moved: true }
    }

    render(containerId, playerSymbol = '@', playerColor = '#4a9eff') {
        const container = document.getElementById(containerId); if (!container) return
        const biomeInfo = BIOMES[this.biome] || BIOMES.plains
        let html = ''
        for (let y = 0; y < this.height; y++) {
            html += '<div class="grid-row">'
            for (let x = 0; x < this.width; x++) {
                const isPlayer = x === this.playerPos.x && y === this.playerPos.y
                const tile = this.grid[y][x]
                const display = WORLD_TILE_DISPLAY[tile]
                let tileClass = 'tile ' + display.class
                let tileChar = display.char
                let dataAttr = ''
                let customStyle = ''
                
                // Check for other players at this position
                let otherPlayerHere = null
                for (const [id, player] of this.otherPlayers) {
                    if (player.pos_x === x && player.pos_y === y) {
                        otherPlayerHere = player
                        break
                    }
                }
                
                if (this.biome === 'castle' && tile === WORLD_TILES.GROUND) tileChar = '░'
                else if (tile === WORLD_TILES.GROUND) tileChar = biomeInfo.groundChar
                
                if (isPlayer) { 
                    tileClass += ' tile-player'
                    tileChar = playerSymbol
                    customStyle = `style="color:${playerColor}"`
                } else if (otherPlayerHere) {
                    tileClass += ' tile-other-player'
                    tileChar = otherPlayerHere.symbol || '☺'
                    const otherColor = otherPlayerHere.color || '#ffeb3b'
                    customStyle = `style="color:${otherColor}"`
                    dataAttr = `data-player-id="${otherPlayerHere.user_id}" data-player-name="${otherPlayerHere.player_name}"`
                }
                
                html += `<div class="${tileClass}" ${dataAttr} ${customStyle} title="${otherPlayerHere ? otherPlayerHere.player_name : ''}">${tileChar}</div>`
            }
            html += '</div>'
        }
        container.innerHTML = html
    }
}
