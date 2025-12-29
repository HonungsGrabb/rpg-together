import { supabase } from './supabase-client.js'

export async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
}

export async function login(email, password) {
    // Clear any stale session first
    try {
        await supabase.auth.signOut()
    } catch (e) {
        // Ignore signout errors
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
}

export async function logout() {
    const { error } = await supabase.auth.signOut()
    // Clear local storage as backup
    localStorage.removeItem('rpg-auth')
    if (error) throw error
}

export async function getSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
            console.log('Session error, clearing:', error)
            localStorage.removeItem('rpg-auth')
            return null
        }
        return session
    } catch (e) {
        console.log('Session check failed:', e)
        localStorage.removeItem('rpg-auth')
        return null
    }
}

export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => callback(event, session))
}
