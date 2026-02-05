/**
 * Environment Variable Debugging Utility
 * Run this in browser console to verify env vars are loaded
 */

export function debugEnvironmentVariables() {
  const env = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    isProduction: process.env.NODE_ENV === 'production',
  }

  console.log('=== SUPABASE ENV DEBUG ===')
  console.log('URL:', env.url)
  console.log('Anon Key:', env.anonKey?.substring(0, 20) + '...' || 'NOT SET')
  console.log('Node Env:', process.env.NODE_ENV)
  console.log('Is Production:', env.isProduction)

  // Check if values are the template placeholder
  if (env.url?.includes('your-project.supabase.co')) {
    console.error(
      '❌ ERROR: Still using template URL! Update .env.local with your actual Supabase URL'
    )
  } else if (!env.url) {
    console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is not set!')
  } else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL is set correctly')
  }

  if (!env.anonKey) {
    console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set!')
  } else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set correctly')
  }

  return env
}

// Auto-debug on module load (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Defer to allow browser console to be ready
  setTimeout(() => {
    console.log('📋 To debug environment variables, run: debugEnvironmentVariables()')
  }, 1000)
}
