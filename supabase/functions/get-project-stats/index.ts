import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.26.0?target=deno'

interface StatsRequest {
  project_id: string
  start_date?: string
  end_date?: string
}

interface StatsResponse {
  success: boolean
  data?: {
    users_count: number
    api_calls_count: number
    storage_usage_mb: number
    tables_count: number
    rows_count: number
  }
  message: string
  error?: string
}

serve(async (req: Request): Promise<Response> => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Parse request body
    const body: StatsRequest = await req.json()
    const { project_id, start_date, end_date } = body

    // Validate required fields
    if (!project_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required field: project_id',
        } as StatsResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing authorization header',
        } as StatsResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid or expired token',
        } as StatsResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call get_project_stats function
    const { data, error } = await supabase.rpc('get_project_stats', {
      p_project_id: project_id,
      p_start_date: start_date,
      p_end_date: end_date,
    })

    if (error) {
      console.error('Stats error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error retrieving project stats: ${error.message}`,
          error: error.message,
        } as StatsResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Return success response
    const response: StatsResponse = {
      success: true,
      data: data[0],
      message: 'Stats retrieved successfully',
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Get project stats error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: `Server error: ${error.message}`,
        error: error.message,
      } as StatsResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
