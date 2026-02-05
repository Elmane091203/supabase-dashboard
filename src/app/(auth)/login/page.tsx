/**
 * Login Page
 */

import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Sign In - Supabase Dashboard',
  description: 'Sign in to your Supabase Dashboard account',
}

export default function LoginPage() {
  return <LoginForm />
}
