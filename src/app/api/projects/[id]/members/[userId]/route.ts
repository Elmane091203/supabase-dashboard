import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await context.params
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role } = updateRoleSchema.parse(body)

    await supabase.rpc('update_member_role' as any, {
      p_project_id: id,
      p_user_id: userId,
      p_new_role: role,
    } as any)

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
    logger.error('PATCH member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await context.params
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await supabase
      .from('project_members')
      .delete()
      .eq('project_id', id)
      .eq('user_id', userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('DELETE member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
