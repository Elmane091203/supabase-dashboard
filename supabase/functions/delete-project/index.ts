import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.26.0?target=deno'

interface DeleteRequest {
  project_id: string
}

interface DeleteResponse {
  success: boolean
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
    const body: DeleteRequest = await req.json()
    const { project_id } = body

    // Validate required fields
    if (!project_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required field: project_id',
        } as DeleteResponse),
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
        } as DeleteResponse),
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
        } as DeleteResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call delete_project function
    const { data, error } = await supabase.rpc('delete_project', {
      p_project_id: project_id,
    })

    if (error) {
      console.error('Delete error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error deleting project: ${error.message}`,
          error: error.message,
        } as DeleteResponse),
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
    const response: DeleteResponse = {
      success: data[0].success,
      message: data[0].message,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Delete project error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: `Server error: ${error.message}`,
        error: error.message,
      } as DeleteResponse),
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
