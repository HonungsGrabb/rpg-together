import { supabase } from './supabase-client.js'

export async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
}

export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
}

export async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => callback(event, session))
}
