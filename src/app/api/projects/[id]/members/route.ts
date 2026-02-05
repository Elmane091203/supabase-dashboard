/**
 * Project Members API Routes
 * GET /api/projects/[id]/members - Get project members
 * POST /api/projects/[id]/members - Add member
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface RouteContext {
  params: { id: string }
}

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
})

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: members, error } = await supabase
      .from('project_members')
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('project_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (error) {
    console.error('GET members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params
    const supabase = await createSupabaseServerClient()
    const adminClient = await createSupabaseAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, role } = addMemberSchema.parse(body)

    // Get user by email
    const { data: users } = await adminClient.auth.admin.listUsers()
    const targetUser = users?.find((u) => u.email === email)

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Add member via function
    const { data, error } = await supabase.rpc('add_project_member', {
      p_project_id: id,
      p_user_id: targetUser.id,
      p_role: role,
      p_invited_by: user.id,
    })

    if (error) {
      console.error('Add member error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Fetch the created member
    const { data: member } = await supabase
      .from('project_members')
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('project_id', id)
      .eq('user_id', targetUser.id)
      .single()

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('POST members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
