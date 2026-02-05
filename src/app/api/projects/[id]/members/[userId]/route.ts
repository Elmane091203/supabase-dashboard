/**
 * Project Member Detail API Routes
 * PATCH /api/projects/[id]/members/[userId] - Update member role
 * DELETE /api/projects/[id]/members/[userId] - Remove member
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface RouteContext {
  params: { id: string; userId: string }
}

const updateRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
})

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id, userId } = context.params
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role } = updateRoleSchema.parse(body)

    const { data, error } = await supabase.rpc('update_member_role', {
      p_project_id: id,
      p_user_id: userId,
      p_new_role: role,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: member } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single()

    return NextResponse.json({ member })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    console.error('PATCH member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id, userId } = context.params
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
