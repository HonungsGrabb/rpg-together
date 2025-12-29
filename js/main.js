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
    const email = document.getElementById('login-email').value, password = document.getElementById('login-password').value
    if (!email || !password) return showAuthMsg('Fill all fields')
    try { await login(email, password) } catch (e) { showAuthMsg(e.message) }
})
document.getElementById('register-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('register-email').value, password = document.getElementById('register-password').value
    if (!email || !password) return showAuthMsg('Fill all fields')
    if (password.length < 6) return showAuthMsg('Password needs 6+ characters')
    try { await register(email, password); showAuthMsg('Account created! Login now.', false); document.getElementById('register-form').classList.add('hidden'); document.getElementById('login-form').classList.remove('hidden') } catch (e) { showAuthMsg(e.message) }
})
document.getElementById('logout-btn')?.addEventListener('click', logout)
function showAuthMsg(msg, isError = true) { const el = document.getElementById('auth-message'); el.textContent = msg; el.className = isError ? 'error' : 'success' }

// Save Screen
async function loadSaveScreen(userId) { 
    await game.disconnectMultiplayer()
    showScreen('save-screen')
    renderSaveSlots(await game.loadSaves(userId)) 
}

function renderSaveSlots(saves) {
    const container = document.getElementById('save-slots'); container.innerHTML = ''
    for (let slot = 1; slot <= 3; slot++) {
        const save = saves.find(s => s.slot === slot), div = document.createElement('div')
        div.className = 'save-slot' + (save ? '' : ' empty')
        if (save) {
            const p = save.player_data
            div.innerHTML = `<div class="save-info"><h3>${RACES[p.race]?.emoji || ''} ${p.name} - Lv.${p.level} ${CLASSES[p.class]?.name || ''}</h3><p>Gold: ${p.gold} · Kills: ${p.stats?.enemiesKilled || 0}</p></div><button class="delete-btn" data-slot="${slot}">✕</button>`
            div.onclick = e => { if (e.target.classList.contains('delete-btn')) { if (confirm('Delete this save?')) game.deleteGame(slot).then(() => loadSaveScreen(game.userId)); return } loadExistingGame(slot) }
        } else { div.innerHTML = `<span>[ Empty Slot ${slot} ]</span>`; div.onclick = () => startNewGame(slot) }
        container.appendChild(div)
    }
}
function startNewGame(slot) { selectedSlot = slot; selectedRace = null; selectedClass = null; showRaceScreen() }

async function loadExistingGame(slot) { 
    if (await game.loadGame(slot)) { 
        setupMultiplayerCallbacks()
        showScreen('game-screen')
        updateGameUI()
        renderMap()
        setupInput()
        updateOnlineCount()
        renderPartyPanel(game.multiplayer.party)
        renderPartyInvites(game.multiplayer.pendingInvites)
    } 
}

// Character Creation
function showRaceScreen() {
    showScreen('race-screen'); const container = document.getElementById('race-options'); container.innerHTML = ''
    for (const race of Object.values(RACES)) {
        const div = document.createElement('div'); div.className = 'selection-card'
        const bonuses = Object.entries(race.bonuses).filter(([_, v]) => v !== 0).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`).join(', ')
        div.innerHTML = `<div class="emoji">${race.emoji}</div><h3>${race.name}</h3><p>${race.description}</p><div class="bonuses">${bonuses}</div>`
        div.onclick = () => { selectedRace = race.id; showClassScreen() }
        container.appendChild(div)
    }
}
function showClassScreen() {
    showScreen('class-screen'); const container = document.getElementById('class-options'); container.innerHTML = ''
    for (const cls of Object.values(CLASSES)) {
        const div = document.createElement('div'); div.className = 'selection-card'
        const bonuses = Object.entries(cls.bonuses).filter(([_, v]) => v !== 0).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`).join(', ')
        div.innerHTML = `<div class="emoji">${cls.emoji}</div><h3>${cls.name}</h3><p>${cls.description}</p><div class="bonuses">${bonuses}</div>`
        div.onclick = () => { selectedClass = cls.id; showNameScreen() }
        container.appendChild(div)
    }
}
function showNameScreen() {
    showScreen('name-screen')
    document.getElementById('name-preview').textContent = `${RACES[selectedRace].emoji} ${RACES[selectedRace].name} ${CLASSES[selectedClass].emoji} ${CLASSES[selectedClass].name}`
    document.getElementById('character-name').value = ''; document.getElementById('character-name').focus()
}
document.getElementById('race-back-btn')?.addEventListener('click', () => showScreen('save-screen'))
document.getElementById('class-back-btn')?.addEventListener('click', showRaceScreen)
document.getElementById('name-back-btn')?.addEventListener('click', showClassScreen)
document.getElementById('start-game-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('character-name').value.trim()
    if (!name) return alert('Enter a name')
    await game.createNewGame(selectedSlot, name, selectedRace, selectedClass)
    setupMultiplayerCallbacks()
    showScreen('game-screen'); updateGameUI(); renderMap(); setupInput()
    updateOnlineCount()
})

// ============================================
// MULTIPLAYER
// ============================================
let selectedPlayer = null // For player context menu
let pendingCombatInvite = null // For party combat

function setupMultiplayerCallbacks() {
    game.multiplayer.onPlayersUpdate = (players) => {
        renderMap()
        updateOnlineCount()
    }
    game.multiplayer.onChatMessage = (messages) => {
        renderChat(messages)
    }
    game.multiplayer.onPartyUpdate = (party) => {
        renderPartyPanel(party)
    }
    game.multiplayer.onPartyInvite = (invites) => {
        renderPartyInvites(invites)
    }
    game.multiplayer.onCombatInvite = (payload) => {
        showPartyCombatInvite(payload)
    }
    game.multiplayer.onPartyCombatUpdate = (combat) => {
        // Handle party combat updates
        if (combat) updatePartyCombatUI(combat)
    }
}

function updateOnlineCount() {
    const count = game.multiplayer.otherPlayers.size + 1
    const el = document.getElementById('online-count')
    if (el) el.textContent = `👥 ${count}`
}

function renderPartyPanel(party) {
    const panel = document.getElementById('party-panel')
    const status = document.getElementById('party-status')
    if (!panel) return

    if (!party || party.members.length === 0) {
        panel.innerHTML = '<p class="no-party">No party - click players on map to invite!</p>'
        if (status) status.textContent = ''
        return
    }

    if (status) status.textContent = `(${party.members.length}/4)`

    let html = ''
    for (const member of party.members) {
        const classes = ['party-member']
        if (member.isLeader) classes.push('is-leader')
        if (member.isMe) classes.push('is-me')
        
        const hpPercent = member.online ? Math.round((member.online.hp / member.online.max_hp) * 100) : '?'
        
        html += `
            <div class="${classes.join(' ')}">
                <span class="member-icon">${RACES[member.online?.race]?.emoji || '👤'}</span>
                <span class="member-name">${member.player_name}</span>
                ${member.isLeader ? '<span class="leader-badge">👑</span>' : ''}
                <span class="member-hp">${hpPercent}%</span>
            </div>
        `
    }

    if (party.members.length > 1) {
        html += '<button class="btn-leave-party" onclick="leaveParty()">Leave Party</button>'
    }

    panel.innerHTML = html
}

function renderPartyInvites(invites) {
    const container = document.getElementById('party-invites')
    if (!container) return

    if (!invites || invites.length === 0) {
        container.classList.add('hidden')
        container.innerHTML = ''
        return
    }

    container.classList.remove('hidden')
    container.innerHTML = '<h4 style="margin:0 0 6px 0;font-size:11px;">📨 Party Invites</h4>' + invites.map(inv => `
        <div class="party-invite">
            <p><strong>${inv.from_name}</strong> invited you to a party!</p>
            <div class="invite-buttons">
                <button class="btn-primary" onclick="respondToInvite('${inv.id}', true)">Accept</button>
                <button class="btn-danger" onclick="respondToInvite('${inv.id}', false)">Decline</button>
            </div>
        </div>
    `).join('')
}

// Global functions for onclick handlers
window.respondToInvite = async (inviteId, accept) => {
    await game.multiplayer.respondToInvite(inviteId, accept)
}

window.leaveParty = async () => {
    if (confirm('Leave party?')) {
        await game.multiplayer.leaveParty()
    }
}

// Player click handling for invites
function handlePlayerClick(player, event) {
    selectedPlayer = player
    const menu = document.getElementById('player-menu')
    if (!menu) return

    // Position menu near click
    menu.style.left = `${event.clientX}px`
    menu.style.top = `${event.clientY}px`
    menu.classList.remove('hidden')

    // Update invite button based on party status
    const inviteBtn = document.getElementById('btn-invite-player')
    if (inviteBtn) {
        const inSameParty = game.multiplayer.party?.members.some(m => m.user_id === player.user_id)
        inviteBtn.textContent = inSameParty ? 'Already in party' : `Invite ${player.player_name}`
        inviteBtn.disabled = inSameParty
    }
}

document.getElementById('btn-invite-player')?.addEventListener('click', async () => {
    if (selectedPlayer) {
        await game.multiplayer.sendPartyInvite(selectedPlayer.user_id, selectedPlayer.player_name)
    }
    document.getElementById('player-menu')?.classList.add('hidden')
    selectedPlayer = null
})

document.getElementById('btn-close-menu')?.addEventListener('click', () => {
    document.getElementById('player-menu')?.classList.add('hidden')
    selectedPlayer = null
})

// Close menu when clicking elsewhere
document.addEventListener('click', (e) => {
    const menu = document.getElementById('player-menu')
    if (menu && !menu.contains(e.target) && !e.target.classList.contains('tile-other-player')) {
        menu.classList.add('hidden')
        selectedPlayer = null
    }
})

// Party combat invite
function showPartyCombatInvite(payload) {
    pendingCombatInvite = payload
    document.getElementById('combat-invite-text').textContent = 
        `${payload.initiatorName} started fighting ${payload.enemy.name}! Join them?`
    showModal('party-combat-modal')
}

document.getElementById('btn-join-combat')?.addEventListener('click', async () => {
    if (pendingCombatInvite) {
        await game.multiplayer.joinPartyCombat(pendingCombatInvite.combatId)
        // Start combat UI on our end too
        game.startCombat(pendingCombatInvite.enemy, 0, 0)
        hideModal('party-combat-modal')
        showCombatUI()
    }
    pendingCombatInvite = null
})

document.getElementById('btn-skip-combat')?.addEventListener('click', () => {
    hideModal('party-combat-modal')
    pendingCombatInvite = null
})

function updatePartyCombatUI(combat) {
    // Update combat UI with party info if in party combat
    console.log('Party combat update:', combat)
}

function renderChat(messages) {
    const container = document.getElementById('chat-messages')
    if (!container) return
    container.innerHTML = messages.slice(-20).map(m => {
        let cls = 'chat-nearby'
        if (m.isOwn) cls = 'chat-own'
        else if (m.isLocal) cls = 'chat-local'
        return `<p class="${cls}"><strong>${m.name}:</strong> ${m.message}</p>`
    }).join('')
    container.scrollTop = container.scrollHeight
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input')
    if (!input || !input.value.trim()) return
    await game.multiplayer.sendChat(input.value)
    input.value = ''
}

document.getElementById('chat-send')?.addEventListener('click', sendChatMessage)
document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); sendChatMessage() }
})

// ============================================
// GAME UI
// ============================================
function updateGameUI() {
    const p = game.player; if (!p) return
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
    
    renderEquipment(); renderInventory(); renderSkills(); renderGameLog()
}

function renderMap() { 
    if (game.inDungeon && game.dungeon) game.dungeon.render('map-grid')
    else if (game.world) game.world.render('map-grid')
    renderOtherPlayers()
}

function renderOtherPlayers() {
    const container = document.getElementById('map-grid')
    if (!container) return
    const players = game.multiplayer.getPlayersInArea()
    for (const player of players) {
        const rows = container.querySelectorAll('.grid-row')
        if (rows[player.pos_y]) {
            const tiles = rows[player.pos_y].querySelectorAll('.tile')
            if (tiles[player.pos_x]) {
                const myPos = game.inDungeon ? game.dungeon?.playerPos : game.world?.playerPos
                if (myPos && player.pos_x === myPos.x && player.pos_y === myPos.y) continue
                const tile = tiles[player.pos_x]
                tile.classList.add('tile-other-player')
                tile.textContent = RACES[player.race]?.emoji || '👤'
                tile.title = `${player.player_name} (Lv.${player.level}) - Click to interact`
                // Add click handler for player interaction
                tile.onclick = (e) => {
                    e.stopPropagation()
                    handlePlayerClick(player, e)
                }
            }
        }
    }
}

function renderGameLog() { 
    const c = document.getElementById('game-log')
    c.innerHTML = game.gameLog.slice(-12).map(e => `<p class="${e.type}">${e.message}</p>`).join('')
    c.scrollTop = c.scrollHeight 
}

function renderEquipment() {
    const container = document.getElementById('equipment-panel'); container.innerHTML = ''
    for (const slot of EQUIPMENT_SLOTS) {
        const itemId = game.player.equipment[slot.id], item = itemId ? game.getItem(itemId) : null
        const div = document.createElement('div'); div.className = 'equip-slot' + (item ? '' : ' empty')
        div.innerHTML = `<span class="slot-icon">${item ? item.emoji : slot.emoji}</span><span class="slot-text">${item ? item.name : slot.name}</span>`
        if (item) {
            div.style.borderColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common
            div.onclick = () => showItemDetail(item, slot.id)
        }
        container.appendChild(div)
    }
}

function renderInventory() {
    const container = document.getElementById('inventory-panel'); container.innerHTML = ''
    for (let i = 0; i < 20; i++) {
        const itemId = game.player.inventory[i], item = itemId ? game.getItem(itemId) : null
        const div = document.createElement('div'); div.className = 'inv-slot' + (item ? '' : ' empty')
        div.textContent = item ? item.emoji : ''
        if (item) {
            div.style.borderColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common
            div.onclick = () => showItemDetail(item, null, i)
        }
        container.appendChild(div)
    }
}

function renderSkills() {
    const container = document.getElementById('skills-panel'); container.innerHTML = ''
    if (game.player.learnedSpells.length === 0) { container.innerHTML = '<p class="no-skills">No skills</p>'; return }
    for (const spellId of game.player.learnedSpells) {
        const spell = SPELLS[spellId]; if (!spell) continue
        const div = document.createElement('div'); div.className = 'skill-item'
        div.innerHTML = `<span>${spell.emoji}</span><span class="skill-name">${spell.name}</span><span class="skill-cost">${spell.manaCost}</span>`
        container.appendChild(div)
    }
}

function showItemDetail(item, equipSlot = null, invIndex = null) {
    document.getElementById('item-detail-emoji').textContent = item.emoji
    document.getElementById('item-detail-name').textContent = item.name
    document.getElementById('item-detail-name').style.color = RARITY_COLORS[item.rarity] || RARITY_COLORS.common
    document.getElementById('item-detail-type').textContent = `${item.rarity || 'common'} ${item.type}`
    document.getElementById('item-detail-desc').textContent = item.description || ''
    if (item.levelReq) document.getElementById('item-detail-desc').textContent += ` (Req: Lv.${item.levelReq})`
    
    let statsHtml = ''
    if (item.stats) statsHtml = Object.entries(item.stats).map(([k, v]) => `<span class="stat-bonus">${v > 0 ? '+' : ''}${v} ${k}</span>`).join('')
    document.getElementById('item-detail-stats').innerHTML = statsHtml
    
    const actions = document.getElementById('item-detail-actions'); actions.innerHTML = ''
    if (equipSlot !== null) {
        const btn = document.createElement('button'); btn.textContent = 'Unequip'
        btn.onclick = () => { game.unequipItem(equipSlot); hideModal('item-detail-modal'); updateGameUI() }
        actions.appendChild(btn)
    } else if (invIndex !== null) {
        if (item.type === 'consumable') {
            const btn = document.createElement('button'); btn.textContent = 'Use'
            btn.onclick = () => { game.useItem(invIndex); hideModal('item-detail-modal'); updateGameUI() }
            actions.appendChild(btn)
        } else if (item.type === 'scroll') {
            const btn = document.createElement('button'); btn.textContent = 'Learn'
            btn.onclick = () => { game.learnSpell(invIndex); hideModal('item-detail-modal'); updateGameUI() }
            actions.appendChild(btn)
        } else if (EQUIPMENT_SLOT_IDS.includes(item.type) || item.type === 'ring') {
            const btn = document.createElement('button'); btn.textContent = 'Equip'
            btn.onclick = () => { game.equipItem(invIndex); hideModal('item-detail-modal'); updateGameUI() }
            actions.appendChild(btn)
        }
        const dropBtn = document.createElement('button'); dropBtn.className = 'btn-danger'; dropBtn.textContent = 'Drop'
        dropBtn.onclick = () => { if (confirm(`Drop ${item.name}?`)) { game.dropItem(invIndex); hideModal('item-detail-modal'); updateGameUI() } }
        actions.appendChild(dropBtn)
    }
    const closeBtn = document.createElement('button'); closeBtn.className = 'btn-secondary'; closeBtn.textContent = 'Close'
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
    game.multiplayer.broadcastCombat('is fighting', e.name)
    
    // If in party, start party combat session
    if (game.multiplayer.isInParty()) {
        game.multiplayer.startPartyCombat(e, game.enemyPosition?.x || 0, game.enemyPosition?.y || 0)
    }
    
    renderCombatSpells(); document.getElementById('combat-log-modal').innerHTML = ''
    updateCombatUI(); showModal('combat-modal')
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
    const container = document.getElementById('combat-spells'); container.innerHTML = ''
    for (const spellId of game.player.learnedSpells) {
        const spell = SPELLS[spellId]; if (!spell) continue
        const btn = document.createElement('button'); btn.className = 'spell-btn'
        btn.innerHTML = `${spell.emoji} ${spell.name} <small>(${spell.manaCost})</small>`
        btn.disabled = game.player.mana < spell.manaCost
        btn.onclick = () => handleCombatResult(game.castSpell(spellId))
        container.appendChild(btn)
    }
}

document.getElementById('btn-attack')?.addEventListener('click', () => handleCombatResult(game.playerAttack()))
document.getElementById('btn-use-potion')?.addEventListener('click', () => {
    const potionIndex = game.player.inventory.findIndex(id => { const item = game.getItem(id); return item?.type === 'consumable' && (item?.effect?.heal || item?.effect?.restoreMana) })
    if (potionIndex >= 0) { game.useItem(potionIndex); updateCombatUI(); updateGameUI() }
    else { game.log('No potions!', 'info'); updateCombatUI() }
})
document.getElementById('btn-flee')?.addEventListener('click', () => {
    const escaped = game.flee(); updateCombatUI(); updateGameUI()
    if (escaped) setTimeout(() => { hideModal('combat-modal'); renderMap() }, 500)
    else if (game.player.hp <= 0) setTimeout(() => { hideModal('combat-modal'); showDeathScreen() }, 800)
})

function handleCombatResult(result) {
    if (!result) return
    updateCombatUI(); updateGameUI(); renderCombatSpells()
    if (result.enemyDefeated) {
        game.multiplayer.broadcastCombat('defeated', game.currentEnemy?.name || 'an enemy')
        setTimeout(() => { hideModal('combat-modal'); renderMap() }, 800)
    }
    else if (result.playerDefeated) setTimeout(() => { hideModal('combat-modal'); showDeathScreen() }, 800)
}

// Death
function showDeathScreen() {
    const p = game.player
    document.getElementById('death-stats').innerHTML = `<p>Level ${p.level} ${RACES[p.race]?.name} ${CLASSES[p.class]?.name}</p><p>Enemies: ${p.stats?.enemiesKilled || 0}</p><p>Floors: ${p.stats?.floorsExplored || 0}</p>`
    showModal('death-modal')
}
document.getElementById('btn-return-menu')?.addEventListener('click', async () => { 
    await game.disconnectMultiplayer()
    await game.deleteGame(game.currentSlot)
    hideAllModals()
    loadSaveScreen(game.userId) 
})

// Prompts
function showDungeonPrompt() { showModal('dungeon-prompt-modal') }
document.getElementById('btn-enter-dungeon')?.addEventListener('click', async () => { 
    game.enterDungeon()
    await game.multiplayer.onAreaChange()
    hideModal('dungeon-prompt-modal'); renderMap(); updateGameUI() 
})
document.getElementById('btn-stay-outside')?.addEventListener('click', () => hideModal('dungeon-prompt-modal'))

function showStairsPrompt() { document.getElementById('next-floor').textContent = game.player.dungeonFloor + 1; showModal('stairs-modal') }
document.getElementById('btn-descend')?.addEventListener('click', async () => { 
    game.descendDungeon()
    await game.multiplayer.onAreaChange()
    hideModal('stairs-modal'); renderMap(); updateGameUI() 
})
document.getElementById('btn-stay')?.addEventListener('click', () => hideModal('stairs-modal'))

function showExitPrompt() { showModal('exit-modal') }
document.getElementById('btn-exit-dungeon')?.addEventListener('click', async () => { 
    game.exitDungeon()
    await game.multiplayer.onAreaChange()
    hideModal('exit-modal'); renderMap(); updateGameUI() 
})
document.getElementById('btn-stay-dungeon')?.addEventListener('click', () => hideModal('exit-modal'))

// Pause
document.getElementById('menu-btn')?.addEventListener('click', () => showModal('pause-modal'))
document.getElementById('btn-resume')?.addEventListener('click', () => hideModal('pause-modal'))
document.getElementById('btn-save-quit')?.addEventListener('click', async () => { 
    await game.saveGame()
    await game.disconnectMultiplayer()
    hideAllModals(); loadSaveScreen(game.userId) 
})

// Input
function setupInput() {
    document.onkeydown = async e => {
        if (document.activeElement?.id === 'chat-input') {
            if (e.key === 'Escape') document.activeElement.blur()
            return
        }
        const openModals = document.querySelectorAll('.modal:not(.hidden)')
        if (openModals.length > 0) { if (e.key === 'Escape') hideAllModals(); return }
        if (game.inCombat) return
        const key = e.key.toLowerCase()
        if (key === 'enter') {
            const chatInput = document.getElementById('chat-input')
            if (chatInput) { chatInput.focus(); e.preventDefault(); return }
        }
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            e.preventDefault()
            let dir; 
            if (key === 'w' || key === 'arrowup') dir = 'w'
            else if (key === 'a' || key === 'arrowleft') dir = 'a'
            else if (key === 's' || key === 'arrowdown') dir = 's'
            else if (key === 'd' || key === 'arrowright') dir = 'd'
            const result = game.move(dir)
            const pos = game.inDungeon ? game.dungeon?.playerPos : game.world?.playerPos
            if (pos) game.multiplayer.broadcastMove(pos.x, pos.y)
            if (result.newArea) await game.multiplayer.onAreaChange()
            if (result.combat) showCombatUI()
            else if (result.dungeon) showDungeonPrompt()
            else if (result.stairs) showStairsPrompt()
            else if (result.exit) showExitPrompt()
            renderMap(); updateGameUI()
        }
        if (key === 'escape') showModal('pause-modal')
    }
}

// Init
onAuthChange(async (event, session) => { 
    console.log('Auth state changed:', event)
    if (session?.user) await loadSaveScreen(session.user.id)
    else { await game.disconnectMultiplayer(); showScreen('auth-screen') }
})

async function init() { 
    try {
        const session = await getSession()
        console.log('Initial session check:', session ? 'logged in' : 'not logged in')
        if (session?.user) await loadSaveScreen(session.user.id)
        else showScreen('auth-screen')
    } catch (e) {
        console.error('Init error:', e)
        showScreen('auth-screen')
    }
}
init()
