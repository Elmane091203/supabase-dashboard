/**
 * Templates API Routes
 * GET /api/templates - Get all templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { DEFAULT_TEMPLATES } from '@/types/template'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

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

    // Try to fetch from database
    const { data: templates, error } = await supabase
      .from('project_templates')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    // If error or no templates, return defaults
    if (error || !templates || templates.length === 0) {
      return NextResponse.json({ templates: DEFAULT_TEMPLATES })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    logger.error('GET /api/templates error:', error)
    // Return default templates on error
    return NextResponse.json({ templates: DEFAULT_TEMPLATES })
  }
}
