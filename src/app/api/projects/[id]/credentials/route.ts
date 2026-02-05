import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: credentials } = await supabase
      .from('project_credentials')
      .select('*')
      .eq('project_id', id)
      .eq('is_active', true)

    const credentialsDisplay = {
      api_url: (project as any).api_url || process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon_key: credentials?.find((c: any) => c.credential_type === 'anon_key'),
      service_key: credentials?.find((c: any) => c.credential_type === 'service_key'),
      jwt_secret: credentials?.find((c: any) => c.credential_type === 'jwt_secret'),
      database_url: (project as any).database_url,
    }

    return NextResponse.json({ credentials: credentialsDisplay })
  } catch (error) {
    console.error('GET credentials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
