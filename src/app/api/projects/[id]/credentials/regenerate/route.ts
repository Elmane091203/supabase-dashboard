/**
 * Regenerate Credentials API Route
 * POST /api/projects/[id]/credentials/regenerate - Regenerate a credential
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface RouteContext {
  params: { id: string }
}

const regenerateSchema = z.object({
  credential_type: z.enum(['anon_key', 'service_key', 'jwt_secret']),
})

export async function POST(
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

    // Check if user is project owner
    const { data: member } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .single()

    if (!member || member.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only project owner can regenerate credentials' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { credential_type } = regenerateSchema.parse(body)

    // Call PostgreSQL function to regenerate credentials
    const { data, error } = await supabase.rpc('regenerate_credentials', {
      p_project_id: id,
      p_credential_type: credential_type,
    })

    if (error) {
      console.error('Regenerate credentials error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: data[0].success,
      new_credential: data[0].new_credential,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('POST /api/projects/[id]/credentials/regenerate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
