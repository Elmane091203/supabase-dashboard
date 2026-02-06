import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
})

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

    const { data: members } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', id)

    return NextResponse.json({ members: members || [] })
  } catch (error) {
    logger.error('GET members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()
    const adminClient = await createSupabaseAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, role } = addMemberSchema.parse(body)

    const { data: users } = await adminClient.auth.admin.listUsers()
    const targetUser = (users?.users || []).find((u: any) => u.email === email)

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await supabase.rpc('add_project_member' as any, {
      p_project_id: id,
      p_user_id: targetUser.id,
      p_role: role,
      p_invited_by: user.id,
    } as any)

    const { data: member } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', targetUser.id)
      .single()

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    logger.error('POST members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
