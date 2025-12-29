import { register, login, logout, getSession, onAuthChange } from './auth.js'
import { Game } from './game.js'
import { RACES, CLASSES, ITEMS, SPELLS, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_IDS, RARITY_COLORS } from './data.js'

const game = new Game()
let selectedSlot = null, selectedRace = null, selectedClass = null

function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById(id)?.classList.remove('hidden') }
function showModal(id) { document.getElementById(id)?.classList.remove('hidden') }
function hideModal(id) { document.getElementById(id)?.classList.add('hidden') }
function hideAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')) }

// Auth
document.getElementById('show-register')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('login-form').classList.add('hidden'); document.getElementById('register-form').classList.remove('hidden') })
document.getElementById('show-login')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('register-form').classList.add('hidden'); document.getElementById('login-form').classList.remove('hidden') })

document.getElementById('login-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value
    const password = document.getElementById('login-password').value
    if (!email || !password) return showAuthMsg('Fill all fields')
    
    showAuthMsg('Logging in...', false)
    try { 
        const result = await login(email, password)
        if (result?.user) {
            showAuthMsg('Success!', false)
            await loadSaveScreen(result.user.id)
        }
    } catch (e) { 
        showAuthMsg(e.message || 'Login failed')
    }
})

document.getElementById('register-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('register-email').value
    const password = document.getElementById('register-password').value
    if (!email || !password) return showAuthMsg('Fill all fields')
    if (password.length < 6) return showAuthMsg('Password needs 6+ characters')
    try { 
        await register(email, password)
        showAuthMsg('Account created! Login now.', false)
        document.getElementById('register-form').classList.add('hidden')
        document.getElementById('login-form').classList.remove('hidden')
    } catch (e) { 
        showAuthMsg(e.message) 
    }
})

document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await logout()
    showScreen('auth-screen')
})

function showAuthMsg(msg, isError = true) { 
    const el = document.getElementById('auth-message')
    el.textContent = msg
    el.className = isError ? 'error' : 'success' 
}

// Save Screen
async function loadSaveScreen(userId) { 
    showScreen('save-screen')
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
            div.innerHTML = `<div class="save-info"><h3>${RACES[p.race]?.emoji || ''} ${p.name} - Lv.${p.level} ${CLASSES[p.class]?.name || ''}</h3><p>Gold: ${p.gold} · Kills: ${p.stats?.enemiesKilled || 0}</p></div><button class="delete-btn" data-slot="${slot}">✕</button>`
            div.onclick = e => { 
                if (e.target.classList.contains('delete-btn')) { 
                    if (confirm('Delete this save?')) game.deleteGame(slot).then(() => loadSaveScreen(game.userId))
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
    if (await game.loadGame(slot)) { 
        showScreen('game-screen')
        updateGameUI()
        renderMap()
        setupInput()
    } 
}

// Character Creation
function showRaceScreen() {
    showScreen('race-screen')
    const container = document.getElementById('race-options')
    container.innerHTML = ''
    for (const race of Object.values(RACES)) {
        const div = document.createElement('div')
        div.className = 'selection-card'
        const bonuses = Object.entries(race.bonuses).filter(([_, v]) => v !== 0).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`).join(', ')
        div.innerHTML = `<div class="emoji">${race.emoji}</div><h3>${race.name}</h3><p>${race.description}</p><div class="bonuses">${bonuses}</div>`
        div.onclick = () => { selectedRace = race.id; showClassScreen() }
        container.appendChild(div)
    }
}

function showClassScreen() {
    showScreen('class-screen')
    const container = document.getElementById('class-options')
    container.innerHTML = ''
    for (const cls of Object.values(CLASSES)) {
        const div = document.createElement('div')
        div.className = 'selection-card'
        const bonuses = Object.entries(cls.bonuses).filter(([_, v]) => v !== 0).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`).join(', ')
        div.innerHTML = `<div class="emoji">${cls.emoji}</div><h3>${cls.name}</h3><p>${cls.description}</p><div class="bonuses">${bonuses}</div>`
        div.onclick = () => { selectedClass = cls.id; showNameScreen() }
        container.appendChild(div)
    }
}

function showNameScreen() {
    showScreen('name-screen')
    document.getElementById('name-preview').textContent = `${RACES[selectedRace].emoji} ${RACES[selectedRace].name} ${CLASSES[selectedClass].emoji} ${CLASSES[selectedClass].name}`
    document.getElementById('character-name').value = ''
    document.getElementById('character-name').focus()
}

document.getElementById('race-back-btn')?.addEventListener('click', () => showScreen('save-screen'))
document.getElementById('class-back-btn')?.addEventListener('click', showRaceScreen)
document.getElementById('name-back-btn')?.addEventListener('click', showClassScreen)

document.getElementById('start-game-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('character-name').value.trim()
    if (!name) return alert('Enter a name')
    await game.createNewGame(selectedSlot, name, selectedRace, selectedClass)
    showScreen('game-screen')
    updateGameUI()
    renderMap()
    setupInput()
})

// Game UI
function updateGameUI() {
    const p = game.player
    if (!p) return
    document.getElementById('player-name-display').textContent = p.name
    document.getElementById('player-class-badge').textContent = `${RACES[p.race]?.emoji || ''} ${CLASSES[p.class]?.name || ''}`
    document.getElementById('floor-display').textContent = game.inDungeon ? `Floor ${p.dungeonFloor}` : `World (${p.worldX}, ${p.worldY})`
    document.getElementById('gold-display').textContent = `💰 ${p.gold}`
    
    const maxHp = game.getMaxHp(), maxMana = game.getMaxMana()
    document.getElementById('hp-bar').style.width = `${(p.hp / maxHp) * 100}%`
    document.getElementById('hp-text').textContent = `${p.hp}/${maxHp}`
    document.getElementById('mana-bar').style.width = `${(p.mana / maxMana) * 100}%`
    document.getElementById('mana-text').textContent = `${p.mana}/${maxMana}`
    document.getElementById('xp-bar').style.width = `${(p.xp / p.xpToLevel) * 100}%`
    document.getElementById('xp-text').textContent = `Lv.${p.level} (${p.xp}/${p.xpToLevel})`

    document.getElementById('stat-phys').textContent = game.getPhysicalPower()
    document.getElementById('stat-magic').textContent = game.getMagicPower()
    document.getElementById('stat-def').textContent = game.getDefense()
    document.getElementById('stat-mres').textContent = game.getMagicResist()
    document.getElementById('stat-spd').textContent = game.getSpeed()

    const wpnDmg = game.getWeaponDamage()
    document.getElementById('stat-pdmg').textContent = wpnDmg.physical
    document.getElementById('stat-mdmg').textContent = wpnDmg.magic

    renderEquipment()
    renderInventory()
    renderSkills()
    renderGameLog()
}

function renderMap() { 
    if (game.inDungeon && game.dungeon) game.dungeon.render('map-grid')
    else if (game.world) game.world.render('map-grid')
}

function renderGameLog() { 
    const c = document.getElementById('game-log')
    c.innerHTML = game.gameLog.slice(-12).map(e => `<p class="${e.type}">${e.message}</p>`).join('')
    c.scrollTop = c.scrollHeight 
}

function renderEquipment() {
    const container = document.getElementById('equipment-panel')
    container.innerHTML = ''
    for (const slot of EQUIPMENT_SLOTS) {
        const itemId = game.player.equipment[slot.id]
        const item = itemId ? game.getItem(itemId) : null
        const div = document.createElement('div')
        div.className = 'equip-slot' + (item ? '' : ' empty')
        div.innerHTML = `<span class="slot-icon">${item ? item.emoji : slot.emoji}</span><span class="slot-text">${item ? item.name : slot.name}</span>`
        if (item) {
            div.style.borderColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common
            div.onclick = () => showItemDetail(item, slot.id)
        }
        container.appendChild(div)
    }
}

function renderInventory() {
    const container = document.getElementById('inventory-panel')
    container.innerHTML = ''
    for (let i = 0; i < game.player.inventory.length; i++) {
        const itemId = game.player.inventory[i]
        const item = game.getItem(itemId)
        if (!item) continue
        const div = document.createElement('div')
        div.className = 'inv-slot'
        div.innerHTML = `<span class="item-emoji">${item.emoji}</span>`
        div.title = item.name
        div.style.borderColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common
        div.onclick = () => showItemDetail(item, null, i)
        container.appendChild(div)
    }
    for (let i = game.player.inventory.length; i < 20; i++) {
        const div = document.createElement('div')
        div.className = 'inv-slot empty'
        container.appendChild(div)
    }
}

function renderSkills() {
    const container = document.getElementById('skills-panel')
    container.innerHTML = ''
    for (const spellId of game.player.learnedSpells) {
        const spell = SPELLS[spellId]
        if (!spell) continue
        const div = document.createElement('div')
        div.className = 'skill-item'
        div.innerHTML = `<span>${spell.emoji}</span><span>${spell.name}</span>`
        div.title = `${spell.description}\nMana: ${spell.manaCost}`
        container.appendChild(div)
    }
    if (game.player.learnedSpells.length === 0) {
        container.innerHTML = '<p class="no-skills">No spells learned</p>'
    }
}

function showItemDetail(item, equipSlot = null, invIndex = null) {
    document.getElementById('item-detail-emoji').textContent = item.emoji
    document.getElementById('item-detail-name').textContent = item.name
    document.getElementById('item-detail-name').style.color = RARITY_COLORS[item.rarity] || '#fff'
    document.getElementById('item-detail-type').textContent = `${item.rarity} ${item.type}`
    document.getElementById('item-detail-desc').textContent = item.description || ''
    const statsDiv = document.getElementById('item-detail-stats')
    statsDiv.innerHTML = ''
    if (item.stats) {
        for (const [stat, val] of Object.entries(item.stats)) {
            if (val) statsDiv.innerHTML += `<div class="stat-line">${stat}: +${val}</div>`
        }
    }
    if (item.levelReq) statsDiv.innerHTML += `<div class="stat-line req">Requires Lv.${item.levelReq}</div>`

    const actions = document.getElementById('item-detail-actions')
    actions.innerHTML = ''
    if (equipSlot) {
        const unequipBtn = document.createElement('button')
        unequipBtn.className = 'btn-secondary'
        unequipBtn.textContent = 'Unequip'
        unequipBtn.onclick = () => { game.unequipItem(equipSlot); hideModal('item-detail-modal'); updateGameUI() }
        actions.appendChild(unequipBtn)
    } else if (invIndex !== null) {
        if (EQUIPMENT_SLOT_IDS.includes(item.type) || item.type === 'ring') {
            const equipBtn = document.createElement('button')
            equipBtn.className = 'btn-primary'
            equipBtn.textContent = 'Equip'
            equipBtn.onclick = () => { game.equipItem(invIndex); hideModal('item-detail-modal'); updateGameUI() }
            actions.appendChild(equipBtn)
        }
        if (item.type === 'consumable') {
            const useBtn = document.createElement('button')
            useBtn.className = 'btn-primary'
            useBtn.textContent = 'Use'
            useBtn.onclick = () => { game.useItem(invIndex); hideModal('item-detail-modal'); updateGameUI() }
            actions.appendChild(useBtn)
        }
        if (item.type === 'scroll') {
            const learnBtn = document.createElement('button')
            learnBtn.className = 'btn-primary'
            learnBtn.textContent = 'Learn'
            learnBtn.onclick = () => { game.learnSpell(invIndex); hideModal('item-detail-modal'); updateGameUI() }
            actions.appendChild(learnBtn)
        }
        const dropBtn = document.createElement('button')
        dropBtn.className = 'btn-danger'
        dropBtn.textContent = 'Drop'
        dropBtn.onclick = () => { if (confirm(`Drop ${item.name}?`)) { game.dropItem(invIndex); hideModal('item-detail-modal'); updateGameUI() } }
        actions.appendChild(dropBtn)
    }
    const closeBtn = document.createElement('button')
    closeBtn.className = 'btn-secondary'
    closeBtn.textContent = 'Close'
    closeBtn.onclick = () => hideModal('item-detail-modal')
    actions.appendChild(closeBtn)
    showModal('item-detail-modal')
}

// Combat
function showCombatUI() {
    const p = game.player, e = game.currentEnemy
    document.getElementById('combat-player-name').textContent = p.name
    document.getElementById('combat-enemy-emoji').textContent = e.emoji
    document.getElementById('combat-enemy-name').textContent = e.name
    renderCombatSpells()
    document.getElementById('combat-log-modal').innerHTML = ''
    updateCombatUI()
    showModal('combat-modal')
}

function updateCombatUI() {
    const p = game.player, e = game.currentEnemy
    document.getElementById('combat-player-hp').style.width = `${(p.hp / game.getMaxHp()) * 100}%`
    document.getElementById('combat-player-hp-text').textContent = `HP: ${p.hp}/${game.getMaxHp()}`
    document.getElementById('combat-player-mana').style.width = `${(p.mana / game.getMaxMana()) * 100}%`
    document.getElementById('combat-player-mana-text').textContent = `MP: ${p.mana}/${game.getMaxMana()}`
    if (e) {
        document.getElementById('combat-enemy-hp').style.width = `${(e.hp / e.maxHp) * 100}%`
        document.getElementById('combat-enemy-hp-text').textContent = `HP: ${e.hp}/${e.maxHp}`
    }
    const log = document.getElementById('combat-log-modal')
    log.innerHTML = game.gameLog.slice(-6).map(e => `<p class="${e.type}">${e.message}</p>`).join('')
    log.scrollTop = log.scrollHeight
}

function renderCombatSpells() {
    const container = document.getElementById('combat-spells')
    container.innerHTML = ''
    for (const spellId of game.player.learnedSpells) {
        const spell = SPELLS[spellId]
        if (!spell) continue
        const btn = document.createElement('button')
        btn.className = 'spell-btn'
        btn.innerHTML = `${spell.emoji} ${spell.name} <small>(${spell.manaCost})</small>`
        btn.disabled = game.player.mana < spell.manaCost
        btn.onclick = () => handleCombatResult(game.castSpell(spellId))
        container.appendChild(btn)
    }
}

document.getElementById('btn-attack')?.addEventListener('click', () => handleCombatResult(game.playerAttack()))
document.getElementById('btn-use-potion')?.addEventListener('click', () => {
    const potionIndex = game.player.inventory.findIndex(id => { 
        const item = game.getItem(id)
        return item?.type === 'consumable' && (item?.effect?.heal || item?.effect?.restoreMana) 
    })
    if (potionIndex >= 0) { 
        game.useItem(potionIndex)
        updateCombatUI()
        updateGameUI() 
    } else { 
        game.log('No potions!', 'info')
        updateCombatUI() 
    }
})
document.getElementById('btn-flee')?.addEventListener('click', () => {
    const escaped = game.flee()
    updateCombatUI()
    updateGameUI()
    if (escaped) setTimeout(() => { hideModal('combat-modal'); renderMap() }, 500)
    else if (game.player.hp <= 0) setTimeout(() => { hideModal('combat-modal'); showDeathScreen() }, 800)
})

function handleCombatResult(result) {
    if (!result) return
    updateCombatUI()
    updateGameUI()
    renderCombatSpells()
    if (result.enemyDefeated) {
        setTimeout(() => { hideModal('combat-modal'); renderMap() }, 800)
    } else if (result.playerDefeated) {
        setTimeout(() => { hideModal('combat-modal'); showDeathScreen() }, 800)
    }
}

// Death
function showDeathScreen() {
    const p = game.player
    document.getElementById('death-stats').innerHTML = `<p>Level ${p.level} ${RACES[p.race]?.name} ${CLASSES[p.class]?.name}</p><p>Enemies: ${p.stats?.enemiesKilled || 0}</p><p>Floors: ${p.stats?.floorsExplored || 0}</p>`
    showModal('death-modal')
}
document.getElementById('btn-return-menu')?.addEventListener('click', async () => { 
    await game.deleteGame(game.currentSlot)
    hideAllModals()
    loadSaveScreen(game.userId) 
})

// Prompts
function showDungeonPrompt() { showModal('dungeon-prompt-modal') }
document.getElementById('btn-enter-dungeon')?.addEventListener('click', () => { 
    game.enterDungeon()
    hideModal('dungeon-prompt-modal')
    renderMap()
    updateGameUI() 
})
document.getElementById('btn-stay-outside')?.addEventListener('click', () => hideModal('dungeon-prompt-modal'))

function showStairsPrompt() { 
    document.getElementById('next-floor').textContent = game.player.dungeonFloor + 1
    showModal('stairs-modal') 
}
document.getElementById('btn-descend')?.addEventListener('click', () => { 
    game.descendDungeon()
    hideModal('stairs-modal')
    renderMap()
    updateGameUI() 
})
document.getElementById('btn-stay')?.addEventListener('click', () => hideModal('stairs-modal'))

function showExitPrompt() { showModal('exit-modal') }
document.getElementById('btn-exit-dungeon')?.addEventListener('click', () => { 
    game.exitDungeon()
    hideModal('exit-modal')
    renderMap()
    updateGameUI() 
})
document.getElementById('btn-stay-dungeon')?.addEventListener('click', () => hideModal('exit-modal'))

// Pause
document.getElementById('menu-btn')?.addEventListener('click', () => showModal('pause-modal'))
document.getElementById('btn-resume')?.addEventListener('click', () => hideModal('pause-modal'))
document.getElementById('btn-save-quit')?.addEventListener('click', async () => { 
    await game.saveGame()
    hideAllModals()
    loadSaveScreen(game.userId) 
})

// Input
function setupInput() {
    document.onkeydown = e => {
        const openModals = document.querySelectorAll('.modal:not(.hidden)')
        if (openModals.length > 0) { 
            if (e.key === 'Escape') hideAllModals()
            return 
        }
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
            if (result.combat) showCombatUI()
            else if (result.dungeon) showDungeonPrompt()
            else if (result.stairs) showStairsPrompt()
            else if (result.exit) showExitPrompt()
            renderMap()
            updateGameUI()
        }
        if (key === 'escape') showModal('pause-modal')
    }
}

// Init
onAuthChange(async (event, session) => { 
    if (session?.user) {
        await loadSaveScreen(session.user.id)
    } else {
        showScreen('auth-screen')
    }
})

async function init() { 
    const session = await getSession()
    if (session?.user) {
        await loadSaveScreen(session.user.id)
    } else {
        showScreen('auth-screen')
    }
}
init()
