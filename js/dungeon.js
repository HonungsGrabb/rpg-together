import { getEnemyForFloor, scaleEnemy, getLootDrop } from './data.js'

export const TILES = { FLOOR: 0, WALL: 1, STAIRS: 2, ENEMY: 3, CHEST: 4, EXIT: 5 }
export const TILE_DISPLAY = {
    [TILES.FLOOR]: { char: '·', class: 'tile-floor' },
    [TILES.WALL]: { char: '#', class: 'tile-wall' },
    [TILES.STAIRS]: { char: '▼', class: 'tile-stairs' },
    [TILES.ENEMY]: { char: '?', class: 'tile-enemy' },
    [TILES.CHEST]: { char: '□', class: 'tile-chest' },
    [TILES.EXIT]: { char: '▲', class: 'tile-exit' }
}

export class Dungeon {
    constructor(width = 17, height = 13) {
        this.width = width; this.height = height
        this.grid = []; this.enemies = new Map(); this.chests = new Map()
        this.floor = 1; this.playerPos = { x: 0, y: 0 }
        this.stairsPos = { x: 0, y: 0 }; this.exitPos = { x: 0, y: 0 }
        this.revealed = new Set(); this.rooms = []
    }

    generate(floor) {
        this.floor = floor; this.enemies.clear(); this.chests.clear(); this.revealed.clear()
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILES.WALL))
        this.generateRooms(); this.placePlayer(); this.placeStairs(); this.placeExit()
        this.placeEnemies(floor); this.placeChests(floor)
        this.revealAround(this.playerPos.x, this.playerPos.y)
        return this
    }

    generateRooms() {
        this.rooms = []
        for (let i = 0; i < 8; i++) {
            const roomW = 3 + Math.floor(Math.random() * 4), roomH = 3 + Math.floor(Math.random() * 3)
            const roomX = 1 + Math.floor(Math.random() * (this.width - roomW - 2))
            const roomY = 1 + Math.floor(Math.random() * (this.height - roomH - 2))
            let overlaps = this.rooms.some(r => roomX < r.x + r.w + 1 && roomX + roomW + 1 > r.x && roomY < r.y + r.h + 1 && roomY + roomH + 1 > r.y)
            if (!overlaps) {
                this.rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH })
                for (let y = roomY; y < roomY + roomH; y++) for (let x = roomX; x < roomX + roomW; x++) this.grid[y][x] = TILES.FLOOR
            }
        }
        for (let i = 1; i < this.rooms.length; i++) {
            const prev = this.rooms[i - 1], curr = this.rooms[i]
            const [px, py] = [Math.floor(prev.x + prev.w / 2), Math.floor(prev.y + prev.h / 2)]
            const [cx, cy] = [Math.floor(curr.x + curr.w / 2), Math.floor(curr.y + curr.h / 2)]
            if (Math.random() < 0.5) { this.carveCorridor(px, cx, py, 'h'); this.carveCorridor(py, cy, cx, 'v') }
            else { this.carveCorridor(py, cy, px, 'v'); this.carveCorridor(px, cx, cy, 'h') }
        }
    }

    carveCorridor(from, to, fixed, dir) {
        for (let i = Math.min(from, to); i <= Math.max(from, to); i++) {
            const [x, y] = dir === 'h' ? [i, fixed] : [fixed, i]
            if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1) this.grid[y][x] = TILES.FLOOR
        }
    }

    placePlayer() {
        if (this.rooms.length > 0) this.playerPos = { x: Math.floor(this.rooms[0].x + this.rooms[0].w / 2), y: Math.floor(this.rooms[0].y + this.rooms[0].h / 2) }
    }

    placeExit() {
        if (this.rooms.length > 0) {
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const x = this.playerPos.x + dx, y = this.playerPos.y + dy
                if (this.grid[y]?.[x] === TILES.FLOOR && !(x === this.playerPos.x && y === this.playerPos.y)) {
                    this.grid[y][x] = TILES.EXIT; this.exitPos = { x, y }; return
                }
            }
        }
    }

    placeStairs() {
        if (this.rooms.length > 1) this.stairsPos = { x: Math.floor(this.rooms[this.rooms.length - 1].x + this.rooms[this.rooms.length - 1].w / 2), y: Math.floor(this.rooms[this.rooms.length - 1].y + this.rooms[this.rooms.length - 1].h / 2) }
        else { let maxDist = 0; for (let y = 1; y < this.height - 1; y++) for (let x = 1; x < this.width - 1; x++) if (this.grid[y][x] === TILES.FLOOR) { const dist = Math.abs(x - this.playerPos.x) + Math.abs(y - this.playerPos.y); if (dist > maxDist) { maxDist = dist; this.stairsPos = { x, y } } } }
        this.grid[this.stairsPos.y][this.stairsPos.x] = TILES.STAIRS
    }

    placeEnemies(floor) {
        const num = 4 + Math.floor(floor / 2) + Math.floor(Math.random() * 3); let placed = 0, attempts = 0
        while (placed < num && attempts < 100) {
            const x = 1 + Math.floor(Math.random() * (this.width - 2)), y = 1 + Math.floor(Math.random() * (this.height - 2))
            if (this.grid[y][x] === TILES.FLOOR && !(x === this.playerPos.x && y === this.playerPos.y) && !(x === this.stairsPos.x && y === this.stairsPos.y)) {
                const key = `${x},${y}`
                if (!this.enemies.has(key)) { this.enemies.set(key, scaleEnemy(getEnemyForFloor(floor), floor)); this.grid[y][x] = TILES.ENEMY; placed++ }
            }
            attempts++
        }
    }

    placeChests(floor) {
        const num = 1 + Math.floor(Math.random() * 2) + Math.floor(floor / 5); let placed = 0, attempts = 0
        while (placed < num && attempts < 50) {
            const x = 1 + Math.floor(Math.random() * (this.width - 2)), y = 1 + Math.floor(Math.random() * (this.height - 2))
            if (this.grid[y][x] === TILES.FLOOR) {
                const loot = getLootDrop(floor, true)
                if (loot) { this.chests.set(`${x},${y}`, { opened: false, loot }); this.grid[y][x] = TILES.CHEST; placed++ }
            }
            attempts++
        }
    }

    revealAround(x, y, radius = 3) {
        for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx, ny = y + dy
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) this.revealed.add(`${nx},${ny}`)
        }
    }

    isWalkable(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height && this.grid[y][x] !== TILES.WALL }
    getTile(x, y) { return (x < 0 || x >= this.width || y < 0 || y >= this.height) ? TILES.WALL : this.grid[y][x] }
    getEnemy(x, y) { return this.enemies.get(`${x},${y}`) }
    removeEnemy(x, y) { const key = `${x},${y}`; if (this.enemies.has(key)) { this.enemies.delete(key); this.grid[y][x] = TILES.FLOOR } }
    openChest(x, y) { const key = `${x},${y}`, chest = this.chests.get(key); if (chest && !chest.opened) { chest.opened = true; this.grid[y][x] = TILES.FLOOR; return chest.loot } return null }

    movePlayer(dx, dy) {
        const newX = this.playerPos.x + dx, newY = this.playerPos.y + dy
        if (!this.isWalkable(newX, newY)) return { moved: false }
        const tile = this.getTile(newX, newY)
        if (tile === TILES.ENEMY) {
            // Dungeons: 30% chance for 2 enemies, 10% chance for 3
            const roll = Math.random()
            const baseEnemy = this.getEnemy(newX, newY)
            let enemies = [baseEnemy]
            
            if (roll < 0.30) {
                enemies.push(scaleEnemy(getEnemyForFloor(this.floor), this.floor))
            }
            if (roll < 0.10) {
                enemies.push(scaleEnemy(getEnemyForFloor(this.floor), this.floor))
            }
            
            return { moved: false, encounter: { type: 'enemy', enemies, x: newX, y: newY } }
        }
        if (tile === TILES.CHEST) { const loot = this.openChest(newX, newY); this.playerPos = { x: newX, y: newY }; this.revealAround(newX, newY); return { moved: true, encounter: { type: 'chest', loot } } }
        if (tile === TILES.STAIRS) { this.playerPos = { x: newX, y: newY }; this.revealAround(newX, newY); return { moved: true, encounter: { type: 'stairs' } } }
        if (tile === TILES.EXIT) { this.playerPos = { x: newX, y: newY }; return { moved: true, encounter: { type: 'exit' } } }
        this.playerPos = { x: newX, y: newY }; this.revealAround(newX, newY); return { moved: true }
    }

    render(containerId, playerSymbol = '@', playerColor = '#4a9eff') {
        const container = document.getElementById(containerId); if (!container) return
        let html = ''
        for (let y = 0; y < this.height; y++) {
            html += '<div class="grid-row">'
            for (let x = 0; x < this.width; x++) {
                const key = `${x},${y}`, isRevealed = this.revealed.has(key), isPlayer = x === this.playerPos.x && y === this.playerPos.y
                let tileClass = 'tile', tileChar = ' ', customStyle = ''
                if (!isRevealed) tileClass += ' tile-hidden'
                else { const tile = this.grid[y][x], display = TILE_DISPLAY[tile]; tileClass += ' ' + display.class; tileChar = display.char }
                if (isPlayer) { 
                    tileClass += ' tile-player'
                    tileChar = playerSymbol
                    customStyle = `style="color:${playerColor}"`
                }
                html += `<div class="${tileClass}" ${customStyle}>${tileChar}</div>`
            }
            html += '</div>'
        }
        container.innerHTML = html
    }
}
