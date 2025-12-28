import { register, login, logout, getSession, onAuthChange } from './auth.js'
import { Game } from './game.js'

// DOM Elements
const authScreen = document.getElementById('auth-screen')
const gameScreen = document.getElementById('game-screen')
const loginForm = document.getElementById('login-form')
const registerForm = document.getElementById('register-form')
const authMessage = document.getElementById('auth-message')

// Game instance
const game = new Game()

// Show/hide forms
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

// Display messages
function showMessage(msg, isError = true) {
    authMessage.textContent = msg
    authMessage.className = isError ? '' : 'success'
}

// Login handler
document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('login-email').value
    const password = document.getElementById('login-password').value
    
    if (!email || !password) {
        showMessage('Please fill in all fields')
        return
    }
    
    try {
        await login(email, password)
        showMessage('Logged in!', false)
    } catch (error) {
        showMessage(error.message)
    }
}

// Register handler
document.getElementById('register-btn').onclick = async () => {
    const username = document.getElementById('register-username').value
    const email = document.getElementById('register-email').value
    const password = document.getElementById('register-password').value
    
    if (!username || !email || !password) {
        showMessage('Please fill in all fields')
        return
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters')
        return
    }
    
    try {
        await register(email, password, username)
        showMessage('Account created! You can now log in.', false)
        registerForm.classList.add('hidden')
        loginForm.classList.remove('hidden')
    } catch (error) {
        showMessage(error.message)
    }
}

// Logout handler
document.getElementById('logout-btn').onclick = async () => {
    await logout()
}

// Game action handlers
document.getElementById('btn-explore').onclick = () => game.explore()
document.getElementById('btn-rest').onclick = () => game.rest()
document.getElementById('btn-shop').onclick = () => game.shop()

// Handle auth state changes
onAuthChange(async (event, session) => {
    if (session?.user) {
        authScreen.classList.add('hidden')
        gameScreen.classList.remove('hidden')
        await game.init(session.user)
    } else {
        gameScreen.classList.add('hidden')
        authScreen.classList.remove('hidden')
    }
})

// Check initial session
async function init() {
    const session = await getSession()
    if (session?.user) {
        authScreen.classList.add('hidden')
        gameScreen.classList.remove('hidden')
        await game.init(session.user)
    }
}

init()
