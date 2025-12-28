import { getEnemyForFloor, scaleEnemy, getLootDrop } from './data.js'

export const TILES = {
    FLOOR: 0,
    WALL: 1,
    STAIRS: 2,
    ENEMY: 3,
    CHEST: 4,
    EXIT: 5
}

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
        this.width = width
        this.height = height
        this.grid = []
        this.enemies = new Map()
        this.chests = new Map()
        this.floor = 1
        this.playerPos = { x: 0, y: 0 }
        this.stairsPos = { x: 0, y: 0 }
        this.exitPos = { x: 0, y: 0 }
        this.revealed = new Set()
        this.rooms = []
    }

    generate(floor) {
        this.floor = floor
        this.enemies.clear()
        this.chests.clear()
        this.revealed.clear()
        
        // Initialize with walls
        this.grid = []
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = []
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = TILES.WALL
            }
        }
        
        this.generateRooms()
        this.placePlayer()
        this.placeStairs()
        this.placeExit()
        this.placeEnemies(floor)
        this.placeChests(floor)
        this.revealAround(this.playerPos.x, this.playerPos.y)
        
        return this
    }

    generateRooms() {
        this.rooms = []
        const numRooms = 5 + Math.floor(Math.random() * 4)
        
        for (let i = 0; i < numRooms; i++) {
            const roomW = 3 + Math.floor(Math.random() * 4)
            const roomH = 3 + Math.floor(Math.random() * 3)
            const roomX = 1 + Math.floor(Math.random() * (this.width - roomW - 2))
            const roomY = 1 + Math.floor(Math.random() * (this.height - roomH - 2))
            
            let overlaps = false
            for (const room of this.rooms) {
                if (roomX < room.x + room.w + 1 &&
                    roomX + roomW + 1 > room.x &&
                    roomY < room.y + room.h + 1 &&
                    roomY + roomH + 1 > room.y) {
                    overlaps = true
                    break
                }
            }
            
            if (!overlaps) {
                this.rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH })
                
                for (let y = roomY; y < roomY + roomH; y++) {
                    for (let x = roomX; x < roomX + roomW; x++) {
                        this.grid[y][x] = TILES.FLOOR
                    }
                }
            }
        }
        
        // Connect rooms
        for (let i = 1; i < this.rooms.length; i++) {
            const prev = this.rooms[i - 1]
            const curr = this.rooms[i]
            
            const prevCenterX = Math.floor(prev.x + prev.w / 2)
            const prevCenterY = Math.floor(prev.y + prev.h / 2)
            const currCenterX = Math.floor(curr.x + curr.w / 2)
            const currCenterY = Math.floor(curr.y + curr.h / 2)
            
            if (Math.random() < 0.5) {
                this.carveCorridor(prevCenterX, currCenterX, prevCenterY, 'h')
                this.carveCorridor(prevCenterY, currCenterY, currCenterX, 'v')
            } else {
                this.carveCorridor(prevCenterY, currCenterY, prevCenterX, 'v')
                this.carveCorridor(prevCenterX, currCenterX, currCenterY, 'h')
            }
        }
    }

    carveCorridor(from, to, fixed, dir) {
        const start = Math.min(from, to)
        const end = Math.max(from, to)
        for (let i = start; i <= end; i++) {
            const x = dir === 'h' ? i : fixed
            const y = dir === 'v' ? i : fixed
            if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1) {
                this.grid[y][x] = TILES.FLOOR
            }
        }
    }

    placePlayer() {
        if (this.rooms.length > 0) {
            const room = this.rooms[0]
            this.playerPos = {
                x: Math.floor(room.x + room.w / 2),
                y: Math.floor(room.y + room.h / 2)
            }
        }
    }

    placeExit() {
        // Exit back to overworld - place near player
        if (this.rooms.length > 0) {
            const room = this.rooms[0]
            // Find a floor tile near entrance
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const x = this.playerPos.x + dx
                    const y = this.playerPos.y + dy
                    if (this.grid[y]?.[x] === TILES.FLOOR && 
                        !(x === this.playerPos.x && y === this.playerPos.y)) {
                        this.grid[y][x] = TILES.EXIT
                        this.exitPos = { x, y }
                        return
                    }
                }
            }
        }
    }

    placeStairs() {
        if (this.rooms.length > 1) {
            const room = this.rooms[this.rooms.length - 1]
            this.stairsPos = {
                x: Math.floor(room.x + room.w / 2),
                y: Math.floor(room.y + room.h / 2)
            }
        } else {
            let maxDist = 0
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (this.grid[y][x] === TILES.FLOOR) {
                        const dist = Math.abs(x - this.playerPos.x) + Math.abs(y - this.playerPos.y)
                        if (dist > maxDist) {
                            maxDist = dist
                            this.stairsPos = { x, y }
                        }
                    }
                }
            }
        }
        this.grid[this.stairsPos.y][this.stairsPos.x] = TILES.STAIRS
    }

    placeEnemies(floor) {
        const numEnemies = 4 + Math.floor(floor / 2) + Math.floor(Math.random() * 3)
        let placed = 0
        let attempts = 0
        
        while (placed < numEnemies && attempts < 100) {
            const x = 1 + Math.floor(Math.random() * (this.width - 2))
            const y = 1 + Math.floor(Math.random() * (this.height - 2))
            
            if (this.grid[y][x] === TILES.FLOOR &&
                !(x === this.playerPos.x && y === this.playerPos.y) &&
                !(x === this.stairsPos.x && y === this.stairsPos.y)) {
                
                const key = `${x},${y}`
                if (!this.enemies.has(key)) {
                    const enemyTemplate = getEnemyForFloor(floor)
                    const enemy = scaleEnemy(enemyTemplate, floor)
                    this.enemies.set(key, enemy)
                    this.grid[y][x] = TILES.ENEMY
                    placed++
                }
            }
            attempts++
        }
    }

    placeChests(floor) {
        const numChests = 1 + Math.floor(Math.random() * 2) + Math.floor(floor / 5)
        let placed = 0
        let attempts = 0
        
        while (placed < numChests && attempts < 50) {
            const x = 1 + Math.floor(Math.random() * (this.width - 2))
            const y = 1 + Math.floor(Math.random() * (this.height - 2))
            
            if (this.grid[y][x] === TILES.FLOOR) {
                const key = `${x},${y}`
                // Generate loot for this chest
                const loot = getLootDrop(floor, true)
                if (loot) {
                    this.chests.set(key, { opened: false, loot })
                    this.grid[y][x] = TILES.CHEST
                    placed++
                }
            }
            attempts++
        }
    }

    revealAround(x, y, radius = 3) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx
                const ny = y + dy
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    this.revealed.add(`${nx},${ny}`)
                }
            }
        }
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false
        return this.grid[y][x] !== TILES.WALL
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return TILES.WALL
        return this.grid[y][x]
    }

    getEnemy(x, y) {
        return this.enemies.get(`${x},${y}`)
    }

    removeEnemy(x, y) {
        const key = `${x},${y}`
        if (this.enemies.has(key)) {
            this.enemies.delete(key)
            this.grid[y][x] = TILES.FLOOR
        }
    }

    getChest(x, y) {
        return this.chests.get(`${x},${y}`)
    }

    openChest(x, y) {
        const key = `${x},${y}`
        const chest = this.chests.get(key)
        if (chest && !chest.opened) {
            chest.opened = true
            this.grid[y][x] = TILES.FLOOR
            return chest.loot
        }
        return null
    }

    movePlayer(dx, dy) {
        const newX = this.playerPos.x + dx
        const newY = this.playerPos.y + dy
        
        if (!this.isWalkable(newX, newY)) {
            return { moved: false }
        }
        
        const tile = this.getTile(newX, newY)
        
        // Enemy encounter
        if (tile === TILES.ENEMY) {
            const enemy = this.getEnemy(newX, newY)
            return { moved: false, encounter: { type: 'enemy', enemy, x: newX, y: newY } }
        }
        
        // Chest
        if (tile === TILES.CHEST) {
            const loot = this.openChest(newX, newY)
            this.playerPos = { x: newX, y: newY }
            this.revealAround(newX, newY)
            return { moved: true, encounter: { type: 'chest', loot } }
        }
        
        // Stairs down
        if (tile === TILES.STAIRS) {
            this.playerPos = { x: newX, y: newY }
            this.revealAround(newX, newY)
            return { moved: true, encounter: { type: 'stairs' } }
        }
        
        // Exit to overworld
        if (tile === TILES.EXIT) {
            this.playerPos = { x: newX, y: newY }
            return { moved: true, encounter: { type: 'exit' } }
        }
        
        // Normal move
        this.playerPos = { x: newX, y: newY }
        this.revealAround(newX, newY)
        return { moved: true }
    }

    render(containerId) {
        const container = document.getElementById(containerId)
        if (!container) return
        
        let html = ''
        for (let y = 0; y < this.height; y++) {
            html += '<div class="grid-row">'
            for (let x = 0; x < this.width; x++) {
                const key = `${x},${y}`
                const isRevealed = this.revealed.has(key)
                const isPlayer = x === this.playerPos.x && y === this.playerPos.y
                
                let tileClass = 'tile'
                let tileChar = ' '
                
                if (!isRevealed) {
                    tileClass += ' tile-hidden'
                } else {
                    const tile = this.grid[y][x]
                    const display = TILE_DISPLAY[tile]
                    tileClass += ' ' + display.class
                    tileChar = display.char
                }
                
                if (isPlayer) {
                    tileClass += ' tile-player'
                    tileChar = '@'
                }
                
                html += `<div class="${tileClass}">${tileChar}</div>`
            }
            html += '</div>'
        }
        
        container.innerHTML = html
    }
}
