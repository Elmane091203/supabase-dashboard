/**
 * Project Credentials API Routes
 * GET /api/projects/[id]/credentials - Get project credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface RouteContext {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params
    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has access to project
    const { data: member } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Fetch project and credentials
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (projectError) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const { data: credentials, error: credError } = await supabase
      .from('project_credentials')
      .select('*')
      .eq('project_id', id)
      .eq('is_active', true)

    if (credError) {
      console.error('Fetch credentials error:', credError)
      return NextResponse.json(
        { error: credError.message },
        { status: 500 }
      )
    }

    const credentialsDisplay = {
      api_url: project.api_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
      anon_key: credentials?.find((c) => c.credential_type === 'anon_key'),
      service_key: credentials?.find((c) => c.credential_type === 'service_key'),
      jwt_secret: credentials?.find((c) => c.credential_type === 'jwt_secret'),
      database_url: project.database_url,
    }

    return NextResponse.json({ credentials: credentialsDisplay })
  } catch (error) {
    console.error('GET /api/projects/[id]/credentials error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
