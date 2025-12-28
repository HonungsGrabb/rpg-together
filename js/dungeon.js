import { getEnemyForFloor, scaleEnemy } from './data.js'

// Tile types
export const TILES = {
    FLOOR: 0,
    WALL: 1,
    STAIRS: 2,
    ENEMY: 3,
    CHEST: 4
}

export const TILE_DISPLAY = {
    [TILES.FLOOR]: { char: '·', class: 'tile-floor' },
    [TILES.WALL]: { char: '#', class: 'tile-wall' },
    [TILES.STAIRS]: { char: '▼', class: 'tile-stairs' },
    [TILES.ENEMY]: { char: '?', class: 'tile-enemy' },
    [TILES.CHEST]: { char: '□', class: 'tile-chest' }
}

export class Dungeon {
    constructor(width = 15, height = 15) {
        this.width = width
        this.height = height
        this.grid = []
        this.enemies = new Map() // position -> enemy data
        this.floor = 1
        this.playerPos = { x: 0, y: 0 }
        this.stairsPos = { x: 0, y: 0 }
        this.revealed = new Set() // Fog of war - revealed tiles
    }

    // Generate a new floor
    generate(floor) {
        this.floor = floor
        this.enemies.clear()
        this.revealed.clear()
        
        // Initialize with walls
        this.grid = []
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = []
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = TILES.WALL
            }
        }
        
        // Generate rooms and corridors using simple BSP-like approach
        this.generateRooms()
        
        // Place player at starting position
        this.placePlayer()
        
        // Place stairs down (far from player)
        this.placeStairs()
        
        // Place enemies
        this.placeEnemies(floor)
        
        // Reveal area around player
        this.revealAround(this.playerPos.x, this.playerPos.y)
        
        return this
    }

    generateRooms() {
        const rooms = []
        const numRooms = 5 + Math.floor(Math.random() * 4) // 5-8 rooms
        
        for (let i = 0; i < numRooms; i++) {
            const roomW = 3 + Math.floor(Math.random() * 4) // 3-6 width
            const roomH = 3 + Math.floor(Math.random() * 4) // 3-6 height
            const roomX = 1 + Math.floor(Math.random() * (this.width - roomW - 2))
            const roomY = 1 + Math.floor(Math.random() * (this.height - roomH - 2))
            
            // Check overlap with existing rooms
            let overlaps = false
            for (const room of rooms) {
                if (roomX < room.x + room.w + 1 &&
                    roomX + roomW + 1 > room.x &&
                    roomY < room.y + room.h + 1 &&
                    roomY + roomH + 1 > room.y) {
                    overlaps = true
                    break
                }
            }
            
            if (!overlaps) {
                rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH })
                
                // Carve out room
                for (let y = roomY; y < roomY + roomH; y++) {
                    for (let x = roomX; x < roomX + roomW; x++) {
                        this.grid[y][x] = TILES.FLOOR
                    }
                }
            }
        }
        
        // Connect rooms with corridors
        for (let i = 1; i < rooms.length; i++) {
            const prev = rooms[i - 1]
            const curr = rooms[i]
            
            const prevCenterX = Math.floor(prev.x + prev.w / 2)
            const prevCenterY = Math.floor(prev.y + prev.h / 2)
            const currCenterX = Math.floor(curr.x + curr.w / 2)
            const currCenterY = Math.floor(curr.y + curr.h / 2)
            
            // Horizontal then vertical corridor
            if (Math.random() < 0.5) {
                this.carveHorizontalCorridor(prevCenterX, currCenterX, prevCenterY)
                this.carveVerticalCorridor(prevCenterY, currCenterY, currCenterX)
            } else {
                this.carveVerticalCorridor(prevCenterY, currCenterY, prevCenterX)
                this.carveHorizontalCorridor(prevCenterX, currCenterX, currCenterY)
            }
        }
        
        this.rooms = rooms
    }

    carveHorizontalCorridor(x1, x2, y) {
        const start = Math.min(x1, x2)
        const end = Math.max(x1, x2)
        for (let x = start; x <= end; x++) {
            if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1) {
                this.grid[y][x] = TILES.FLOOR
            }
        }
    }

    carveVerticalCorridor(y1, y2, x) {
        const start = Math.min(y1, y2)
        const end = Math.max(y1, y2)
        for (let y = start; y <= end; y++) {
            if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1) {
                this.grid[y][x] = TILES.FLOOR
            }
        }
    }

    placePlayer() {
        // Place in first room
        if (this.rooms && this.rooms.length > 0) {
            const room = this.rooms[0]
            this.playerPos = {
                x: Math.floor(room.x + room.w / 2),
                y: Math.floor(room.y + room.h / 2)
            }
        } else {
            // Fallback: find any floor tile
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (this.grid[y][x] === TILES.FLOOR) {
                        this.playerPos = { x, y }
                        return
                    }
                }
            }
        }
    }

    placeStairs() {
        // Place in last room (farthest from player)
        if (this.rooms && this.rooms.length > 1) {
            const room = this.rooms[this.rooms.length - 1]
            this.stairsPos = {
                x: Math.floor(room.x + room.w / 2),
                y: Math.floor(room.y + room.h / 2)
            }
        } else {
            // Find floor tile far from player
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
        const numEnemies = 3 + Math.floor(floor / 2) + Math.floor(Math.random() * 3)
        let placed = 0
        let attempts = 0
        
        while (placed < numEnemies && attempts < 100) {
            const x = 1 + Math.floor(Math.random() * (this.width - 2))
            const y = 1 + Math.floor(Math.random() * (this.height - 2))
            
            // Must be floor, not player start, not stairs
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

    revealAround(x, y, radius = 2) {
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

    movePlayer(dx, dy) {
        const newX = this.playerPos.x + dx
        const newY = this.playerPos.y + dy
        
        if (!this.isWalkable(newX, newY)) {
            return { moved: false, encounter: null }
        }
        
        const tile = this.getTile(newX, newY)
        
        // Check for enemy encounter
        if (tile === TILES.ENEMY) {
            const enemy = this.getEnemy(newX, newY)
            return { moved: false, encounter: { type: 'enemy', enemy, x: newX, y: newY } }
        }
        
        // Check for stairs
        if (tile === TILES.STAIRS) {
            this.playerPos = { x: newX, y: newY }
            this.revealAround(newX, newY)
            return { moved: true, encounter: { type: 'stairs' } }
        }
        
        // Normal move
        this.playerPos = { x: newX, y: newY }
        this.revealAround(newX, newY)
        return { moved: true, encounter: null }
    }

    // Render grid to HTML
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
                    tileChar = ' '
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
