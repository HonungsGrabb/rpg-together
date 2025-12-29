import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://ptztgvxdbrjmggpmewtz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0enRndnhkYnJqbWdncG1ld3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDk5NzQsImV4cCI6MjA4MjUyNTk3NH0.gMmqzXW87vQwnqt2qjTVIGJN96uZ8yAh6qQdXXesCzw'

// Don't persist session - user must login each time they visit
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
})
