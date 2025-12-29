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

export class WorldArea {
    constructor(width = 20, height = 15) {
        this.width = width; this.height = height; this.grid = []; this.biome = 'plains'
        this.enemies = new Map(); this.dungeonPos = null; this.playerPos = { x: 0, y: 0 }
        this.worldX = 0; this.worldY = 0
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
        const biomes = ['plains', 'forest', 'mountains']; this.biome = biomes[Math.abs(worldX * 1000 + worldY) % biomes.length]
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(WORLD_TILES.GROUND))
        if (this.biome === 'forest') this.addTrees(0.15)
        else if (this.biome === 'mountains') this.addRocks(0.1)
        if (Math.random() < 0.1 + dist * 0.05) this.placeDungeon()
        this.placeEnemies(2 + Math.floor(dist / 2) + Math.floor(Math.random() * 3), playerLevel)
        return this
    }

    addTrees(density) { for (let y = 1; y < this.height - 1; y++) for (let x = 1; x < this.width - 1; x++) if (Math.random() < density) this.grid[y][x] = WORLD_TILES.TREE }
    addRocks(density) { for (let y = 1; y < this.height - 1; y++) for (let x = 1; x < this.width - 1; x++) if (Math.random() < density) this.grid[y][x] = WORLD_TILES.WALL }

    placeDungeon() {
        let attempts = 0
        while (attempts < 50) {
            const x = 2 + Math.floor(Math.random() * (this.width - 4)), y = 2 + Math.floor(Math.random() * (this.height - 4))
            if (this.grid[y][x] === WORLD_TILES.GROUND) { this.grid[y][x] = WORLD_TILES.DUNGEON; this.dungeonPos = { x, y }; return }
            attempts++
        }
    }

    placeEnemies(count, playerLevel) {
        let placed = 0, attempts = 0
        while (placed < count && attempts < 100) {
            const x = 1 + Math.floor(Math.random() * (this.width - 2)), y = 1 + Math.floor(Math.random() * (this.height - 2))
            if (this.grid[y][x] === WORLD_TILES.GROUND && !this.enemies.has(`${x},${y}`)) {
                this.enemies.set(`${x},${y}`, scaleEnemy(getOverworldEnemy(), Math.max(1, playerLevel - 1)))
                this.grid[y][x] = WORLD_TILES.ENEMY; placed++
            }
            attempts++
        }
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
        if (tile === WORLD_TILES.ENEMY) return { moved: false, encounter: { type: 'enemy', enemy: this.getEnemy(newX, newY), x: newX, y: newY } }
        if (tile === WORLD_TILES.DUNGEON) { this.playerPos = { x: newX, y: newY }; return { moved: true, encounter: { type: 'dungeon' } } }
        this.playerPos = { x: newX, y: newY }; return { moved: true }
    }

    render(containerId) {
        const container = document.getElementById(containerId); if (!container) return
        const biomeInfo = BIOMES[this.biome] || BIOMES.plains
        let html = ''
        for (let y = 0; y < this.height; y++) {
            html += '<div class="grid-row">'
            for (let x = 0; x < this.width; x++) {
                const isPlayer = x === this.playerPos.x && y === this.playerPos.y, tile = this.grid[y][x], display = WORLD_TILE_DISPLAY[tile]
                let tileClass = 'tile ' + display.class, tileChar = display.char
                if (this.biome === 'castle' && tile === WORLD_TILES.GROUND) tileChar = '░'
                else if (tile === WORLD_TILES.GROUND) tileChar = biomeInfo.groundChar
                if (isPlayer) { tileClass += ' tile-player'; tileChar = '@' }
                html += `<div class="${tileClass}">${tileChar}</div>`
            }
            html += '</div>'
        }
        container.innerHTML = html
    }
}
