import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // During build time, env vars might not be available
  // Return a dummy client that will be replaced at runtime
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url') {
    // Return a placeholder during build - real client created at runtime
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
