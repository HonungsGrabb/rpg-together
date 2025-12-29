import { supabase } from './supabase-client.js'

export async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
}

export async function login(email, password) {
    console.log('Attempting login for:', email)
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        console.log('Login result - data:', data, 'error:', error)
        if (error) throw error
        return data
    } catch (e) {
        console.error('Login exception:', e)
        throw e
    }
}

export async function logout() {
    try {
        await supabase.auth.signOut()
    } catch (e) {
        console.log('Logout error:', e)
    }
}

export async function getSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        return session
    } catch (e) {
        console.log('Session check failed:', e)
        return null
    }
}

export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => callback(event, session))
}
