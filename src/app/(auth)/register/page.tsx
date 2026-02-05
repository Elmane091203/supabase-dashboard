/**
 * Register Page
 */

import { RegisterForm } from '@/components/auth/register-form'

export const metadata = {
  title: 'Sign Up - Supabase Dashboard',
  description: 'Create a new Supabase Dashboard account',
}

export default function RegisterPage() {
  return <RegisterForm />
}
