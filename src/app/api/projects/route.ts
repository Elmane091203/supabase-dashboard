/**
 * Projects API Routes
 * GET /api/projects - List all projects
 * POST /api/projects - Create a new project
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createProjectSchema = z.object({
  id: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  template_id: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user from session/cookies
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

    // Fetch projects for current user
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Fetch projects error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ projects })
  } catch (error) {
    logger.error('GET /api/projects error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Parse and validate request body
    const body = await request.json()
    logger.log('[POST /api/projects] Request body:', body)

    const validatedData = createProjectSchema.parse(body)
    logger.log('[POST /api/projects] Validated data:', validatedData)

    // Call PostgreSQL function directly to provision project
    const adminSupabase = await createSupabaseAdminClient()

    logger.log('[POST /api/projects] Calling provision_new_project with:', {
      p_project_id: validatedData.id,
      p_project_name: validatedData.name,
      p_template_id: validatedData.template_id,
      p_owner_id: user.id,
    })

    const { data: functionResult, error: functionError } = await adminSupabase.rpc(
      'provision_new_project' as any,
      {
        p_project_id: validatedData.id,
        p_project_name: validatedData.name,
        p_template_id: validatedData.template_id,
        p_owner_id: user.id,
      } as any
    )

    logger.log('[POST /api/projects] Function result:', { functionResult, functionError })

    if (functionError || !functionResult || !(functionResult as any)[0]?.success) {
      logger.error('[POST /api/projects] Provisioning failed:', {
        error: functionError,
        result: functionResult,
      })
      return NextResponse.json(
        {
          error: functionError?.message || (functionResult as any)?.[0]?.message || 'Failed to provision project'
        },
        { status: 400 }
      )
    }

    // Fetch the created project
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', validatedData.id)
      .single()

    if (fetchError) {
      logger.error('Fetch created project error:', fetchError)
      return NextResponse.json(
        { error: 'Project created but failed to retrieve' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, project },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[POST /api/projects] Validation error:', (error as z.ZodError).issues)
      return NextResponse.json(
        { error: 'Invalid input', details: (error as z.ZodError).issues },
        { status: 400 }
      )
    }

    logger.error('[POST /api/projects] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
