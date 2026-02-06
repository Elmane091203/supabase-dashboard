import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const regenerateSchema = z.object({
  credential_type: z.enum(['anon_key', 'service_key', 'jwt_secret']),
})

export async function POST(
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
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!project || (project as any).owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only project owner can regenerate' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { credential_type } = regenerateSchema.parse(body)

    const { data, error } = await supabase.rpc('regenerate_credentials' as any, {
      p_project_id: id,
      p_credential_type: credential_type,
    } as any)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: (data as any)?.[0]?.success,
      new_credential: (data as any)?.[0]?.new_credential,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    logger.error('Regenerate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
