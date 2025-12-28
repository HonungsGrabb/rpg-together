import { register, login, logout, getSession, onAuthChange } from './auth.js'
import { Game } from './game.js'
import { RACES, CLASSES, ITEMS, EQUIPMENT_SLOTS } from './data.js'

// =====================
// STATE
// =====================
const game = new Game()
let selectedSlot = null
let selectedRace = null
let selectedClass = null

// =====================
// DOM ELEMENTS
// =====================
const screens = {
    auth: document.getElementById('auth-screen'),
    save: document.getElementById('save-screen'),
    race: document.getElementById('race-screen'),
    class: document.getElementById('class-screen'),
    name: document.getElementById('name-screen'),
    game: document.getElementById('game-screen')
}

const overlays = {
    combat: document.getElementById('combat-overlay'),
    death: document.getElementById('death-overlay'),
    stairs: document.getElementById('stairs-overlay'),
    pause: document.getElementById('pause-overlay')
}

// =====================
// SCREEN MANAGEMENT
// =====================
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'))
    screens[screenName].classList.remove('hidden')
}

function showOverlay(overlayName) {
    overlays[overlayName].classList.remove('hidden')
}

function hideOverlay(overlayName) {
    overlays[overlayName].classList.add('hidden')
}

function hideAllOverlays() {
    Object.values(overlays).forEach(o => o.classList.add('hidden'))
}

// =====================
// AUTH HANDLERS
// =====================
const loginForm = document.getElementById('login-form')
const registerForm = document.getElementById('register-form')
const authMessage = document.getElementById('auth-message')

document.getElementById('show-register').onclick = (e) => {
    e.preventDefault()
    loginForm.classList.add('hidden')
    registerForm.classList.remove('hidden')
}

document.getElementById('show-login').onclick = (e) => {
    e.preventDefault()
    registerForm.classList.add('hidden')
    loginForm.classList.remove('hidden')
}

function showAuthMessage(msg, isError = true) {
    authMessage.textContent = msg
    authMessage.className = isError ? '' : 'success'
}

document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('login-email').value
    const password = document.getElementById('login-password').value
    
    if (!email || !password) {
        showAuthMessage('Please fill in all fields')
        return
    }
    
    try {
        await login(email, password)
    } catch (error) {
        showAuthMessage(error.message)
    }
}

document.getElementById('register-btn').onclick = async () => {
    const email = document.getElementById('register-email').value
    const password = document.getElementById('register-password').value
    
    if (!email || !password) {
        showAuthMessage('Please fill in all fields')
        return
    }
    
    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters')
        return
    }
    
    try {
        await register(email, password)
        showAuthMessage('Account created! You can now log in.', false)
        registerForm.classList.add('hidden')
        loginForm.classList.remove('hidden')
    } catch (error) {
        showAuthMessage(error.message)
    }
}

document.getElementById('logout-btn').onclick = async () => {
    await logout()
}

// =====================
// SAVE SCREEN
// =====================
async function loadSaveScreen(userId) {
    showScreen('save')
    const saves = await game.loadSaves(userId)
    renderSaveSlots(saves)
}

function renderSaveSlots(saves) {
    const container = document.getElementById('save-slots')
    container.innerHTML = ''
    
    for (let slot = 1; slot <= 3; slot++) {
        const save = saves.find(s => s.slot === slot)
        const div = document.createElement('div')
        div.className = 'save-slot' + (save ? '' : ' empty')
        
        if (save) {
            const p = save.player_data
            div.innerHTML = `
                <div class="save-info">
                    <h3>${RACES[p.race]?.emoji || ''} ${p.name} - ${CLASSES[p.class]?.name || ''}</h3>
                    <p>Level ${p.level} · Floor ${p.floor} · ${p.stats?.enemiesKilled || 0} kills</p>
                </div>
                <button class="delete-btn" data-slot="${slot}">Delete</button>
            `
            div.onclick = (e) => {
                if (e.target.classList.contains('delete-btn')) {
                    if (confirm('Delete this save?')) {
                        game.deleteGame(slot).then(() => loadSaveScreen(game.userId))
                    }
                    return
                }
                loadExistingGame(slot)
            }
        } else {
            div.innerHTML = `<span>[ Empty Slot ${slot} ]</span>`
            div.onclick = () => startNewGame(slot)
        }
        
        container.appendChild(div)
    }
}

function startNewGame(slot) {
    selectedSlot = slot
    selectedRace = null
    selectedClass = null
    showRaceScreen()
}

async function loadExistingGame(slot) {
    const success = await game.loadGame(slot)
    if (success) {
        showScreen('game')
        updateGameUI()
        renderDungeon()
        setupGameLoop()
    }
}

// =====================
// RACE SELECTION
// =====================
function showRaceScreen() {
    showScreen('race')
    const container = document.getElementById('race-options')
    container.innerHTML = ''
    
    for (const race of Object.values(RACES)) {
        const div = document.createElement('div')
        div.className = 'selection-card'
        
        const bonusText = Object.entries(race.bonuses)
            .filter(([_, v]) => v !== 0)
            .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`)
            .join(', ')
        
        div.innerHTML = `
            <div class="emoji">${race.emoji}</div>
            <h3>${race.name}</h3>
            <p>${race.description}</p>
            <div class="bonuses">${bonusText}</div>
        `
        
        div.onclick = () => {
            selectedRace = race.id
            showClassScreen()
        }
        
        container.appendChild(div)
    }
}

document.getElementById('race-back-btn').onclick = () => showScreen('save')

// =====================
// CLASS SELECTION
// =====================
function showClassScreen() {
    showScreen('class')
    const container = document.getElementById('class-options')
    container.innerHTML = ''
    
    for (const cls of Object.values(CLASSES)) {
        const div = document.createElement('div')
        div.className = 'selection-card'
        
        const bonusText = Object.entries(cls.bonuses)
            .filter(([_, v]) => v !== 0)
            .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`)
            .join(', ')
        
        div.innerHTML = `
            <div class="emoji">${cls.emoji}</div>
            <h3>${cls.name}</h3>
            <p>${cls.description}</p>
            <div class="bonuses">${bonusText}</div>
        `
        
        div.onclick = () => {
            selectedClass = cls.id
            showNameScreen()
        }
        
        container.appendChild(div)
    }
}

document.getElementById('class-back-btn').onclick = () => showRaceScreen()

// =====================
// NAME SCREEN
// =====================
function showNameScreen() {
    showScreen('name')
    const race = RACES[selectedRace]
    const cls = CLASSES[selectedClass]
    document.getElementById('name-preview').textContent = 
        `${race.emoji} ${race.name} ${cls.emoji} ${cls.name}`
    document.getElementById('character-name').value = ''
    document.getElementById('character-name').focus()
}

document.getElementById('name-back-btn').onclick = () => showClassScreen()

document.getElementById('start-game-btn').onclick = async () => {
    const name = document.getElementById('character-name').value.trim()
    if (!name) {
        alert('Please enter a name')
        return
    }
    
    await game.createNewGame(selectedSlot, name, selectedRace, selectedClass)
    showScreen('game')
    updateGameUI()
    renderDungeon()
    setupGameLoop()
}

// =====================
// GAME UI
// =====================
function updateGameUI() {
    const p = game.player
    if (!p) return
    
    // Header
    document.getElementById('player-name-display').textContent = p.name
    document.getElementById('player-class-badge').textContent = CLASSES[p.class]?.name || ''
    document.getElementById('floor-display').textContent = `Floor ${p.floor}`
    document.getElementById('gold-display').textContent = `💰 ${p.gold}`
    
    // Stats
    const maxHp = game.getMaxHp()
    document.getElementById('hp-bar').style.width = `${(p.hp / maxHp) * 100}%`
    document.getElementById('hp-text').textContent = `${p.hp}/${maxHp}`
    
    document.getElementById('xp-bar').style.width = `${(p.xp / p.xpToLevel) * 100}%`
    document.getElementById('xp-text').textContent = `${p.xp}/${p.xpToLevel}`
    
    document.getElementById('stat-attack').textContent = game.getAttack()
    document.getElementById('stat-defense').textContent = game.getDefense()
    document.getElementById('stat-speed').textContent = game.getSpeed()
    document.getElementById('stat-level').textContent = p.level
    
    // Equipment
    renderEquipment()
    
    // Inventory
    renderInventory()
    
    // Log
    renderGameLog()
}

function renderEquipment() {
    const container = document.getElementById('equipment-slots')
    container.innerHTML = ''
    
    for (const slot of EQUIPMENT_SLOTS) {
        const itemId = game.player.equipment[slot]
        const item = itemId ? ITEMS[itemId] : null
        
        const div = document.createElement('div')
        div.className = 'equip-slot' + (item ? '' : ' empty')
        div.innerHTML = `
            <span class="slot-name">${slot}</span>
            <span class="item-name">${item ? `${item.emoji} ${item.name}` : '- empty -'}</span>
        `
        
        if (item) {
            div.onclick = () => {
                game.unequipItem(slot)
                updateGameUI()
            }
            div.title = 'Click to unequip'
        }
        
        container.appendChild(div)
    }
}

function renderInventory() {
    const container = document.getElementById('inventory-grid')
    container.innerHTML = ''
    
    for (let i = 0; i < 20; i++) {
        const itemId = game.player.inventory[i]
        const item = itemId ? ITEMS[itemId] : null
        
        const div = document.createElement('div')
        div.className = 'inv-slot' + (item ? '' : ' empty')
        div.textContent = item ? item.emoji : ''
        
        if (item) {
            div.title = `${item.name}\nClick: Use/Equip\nRight-click: Drop`
            div.onclick = () => {
                if (item.type === 'consumable') {
                    game.useItem(i)
                } else if (EQUIPMENT_SLOTS.includes(item.type)) {
                    game.equipItem(i)
                }
                updateGameUI()
                if (game.inCombat) updateCombatUI()
            }
            div.oncontextmenu = (e) => {
                e.preventDefault()
                if (confirm(`Drop ${item.name}?`)) {
                    game.dropItem(i)
                    updateGameUI()
                }
            }
        }
        
        container.appendChild(div)
    }
}

function renderGameLog() {
    const container = document.getElementById('game-log')
    container.innerHTML = game.gameLog
        .slice(-20)
        .map(entry => `<p class="${entry.type}">${entry.message}</p>`)
        .join('')
    container.scrollTop = container.scrollHeight
}

function renderDungeon() {
    if (game.dungeon) {
        game.dungeon.render('dungeon-grid')
    }
}

// =====================
// COMBAT UI
// =====================
function showCombatUI() {
    const p = game.player
    const e = game.currentEnemy
    
    document.getElementById('combat-player-name').textContent = p.name
    document.getElementById('combat-player-hp').style.width = `${(p.hp / game.getMaxHp()) * 100}%`
    document.getElementById('combat-player-hp-text').textContent = `${p.hp}/${game.getMaxHp()}`
    
    document.getElementById('combat-enemy-emoji').textContent = e.emoji
    document.getElementById('combat-enemy-name').textContent = e.name
    document.getElementById('combat-enemy-hp').style.width = `${(e.hp / e.maxHp) * 100}%`
    document.getElementById('combat-enemy-hp-text').textContent = `${e.hp}/${e.maxHp}`
    
    document.getElementById('combat-log').innerHTML = ''
    
    showOverlay('combat')
}

function updateCombatUI() {
    const p = game.player
    const e = game.currentEnemy
    
    document.getElementById('combat-player-hp').style.width = `${(p.hp / game.getMaxHp()) * 100}%`
    document.getElementById('combat-player-hp-text').textContent = `${p.hp}/${game.getMaxHp()}`
    
    if (e) {
        document.getElementById('combat-enemy-hp').style.width = `${(e.hp / e.maxHp) * 100}%`
        document.getElementById('combat-enemy-hp-text').textContent = `${e.hp}/${e.maxHp}`
    }
    
    // Update combat log
    const log = document.getElementById('combat-log')
    log.innerHTML = game.gameLog
        .slice(-5)
        .map(entry => `<p class="${entry.type}">${entry.message}</p>`)
        .join('')
    log.scrollTop = log.scrollHeight
}

document.getElementById('btn-attack').onclick = () => {
    const result = game.playerAttack()
    updateCombatUI()
    updateGameUI()
    
    if (result?.enemyDefeated) {
        setTimeout(() => {
            hideOverlay('combat')
            renderDungeon()
        }, 800)
    } else if (result?.playerDefeated) {
        setTimeout(() => {
            hideOverlay('combat')
            showDeathScreen()
        }, 800)
    }
}

document.getElementById('btn-use-potion').onclick = () => {
    // Find first health potion in inventory
    const potionIndex = game.player.inventory.findIndex(id => 
        ITEMS[id]?.type === 'consumable' && ITEMS[id]?.effect?.heal
    )
    
    if (potionIndex >= 0) {
        game.useItem(potionIndex)
        updateCombatUI()
        updateGameUI()
    } else {
        game.log('No potions!', 'info')
        updateCombatUI()
    }
}

document.getElementById('btn-flee').onclick = () => {
    const escaped = game.flee()
    updateCombatUI()
    updateGameUI()
    
    if (escaped) {
        setTimeout(() => {
            hideOverlay('combat')
            renderDungeon()
        }, 500)
    } else if (game.player.hp <= 0) {
        setTimeout(() => {
            hideOverlay('combat')
            showDeathScreen()
        }, 800)
    }
}

// =====================
// DEATH SCREEN
// =====================
function showDeathScreen() {
    const p = game.player
    document.getElementById('death-stats').innerHTML = `
        <p>You reached Floor ${p.floor}</p>
        <p>Level ${p.level} ${RACES[p.race]?.name} ${CLASSES[p.class]?.name}</p>
        <p>Enemies defeated: ${p.stats?.enemiesKilled || 0}</p>
        <p>Gold collected: ${p.stats?.totalGold || 0}</p>
    `
    showOverlay('death')
}

document.getElementById('btn-return-menu').onclick = async () => {
    // Delete the save
    await game.deleteGame(game.currentSlot)
    hideAllOverlays()
    loadSaveScreen(game.userId)
}

// =====================
// STAIRS PROMPT
// =====================
function showStairsPrompt() {
    document.getElementById('next-floor').textContent = game.player.floor + 1
    showOverlay('stairs')
}

document.getElementById('btn-descend').onclick = () => {
    hideOverlay('stairs')
    game.descend()
    updateGameUI()
    renderDungeon()
}

document.getElementById('btn-stay').onclick = () => {
    hideOverlay('stairs')
}

// =====================
// PAUSE MENU
// =====================
document.getElementById('menu-btn').onclick = () => {
    showOverlay('pause')
}

document.getElementById('btn-resume').onclick = () => {
    hideOverlay('pause')
}

document.getElementById('btn-save-quit').onclick = async () => {
    await game.saveGame()
    hideAllOverlays()
    loadSaveScreen(game.userId)
}

// =====================
// GAME LOOP / INPUT
// =====================
function setupGameLoop() {
    // Keyboard input
    document.onkeydown = (e) => {
        // Ignore if in overlay (except combat)
        if (overlays.pause.classList.contains('hidden') === false ||
            overlays.death.classList.contains('hidden') === false ||
            overlays.stairs.classList.contains('hidden') === false) {
            return
        }
        
        // Ignore if in combat
        if (game.inCombat) return
        
        const key = e.key.toLowerCase()
        
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            e.preventDefault()
            
            let dir
            if (key === 'w' || key === 'arrowup') dir = 'w'
            else if (key === 'a' || key === 'arrowleft') dir = 'a'
            else if (key === 's' || key === 'arrowdown') dir = 's'
            else if (key === 'd' || key === 'arrowright') dir = 'd'
            
            const result = game.move(dir)
            
            if (result.combat) {
                showCombatUI()
            } else if (result.stairs) {
                showStairsPrompt()
            }
            
            renderDungeon()
            updateGameUI()
        }
        
        // ESC for pause
        if (key === 'escape') {
            showOverlay('pause')
        }
    }
}

// =====================
// AUTH STATE
// =====================
onAuthChange(async (event, session) => {
    if (session?.user) {
        await loadSaveScreen(session.user.id)
    } else {
        showScreen('auth')
    }
})

// Initial check
async function init() {
    const session = await getSession()
    if (session?.user) {
        await loadSaveScreen(session.user.id)
    } else {
        showScreen('auth')
    }
}

init()
