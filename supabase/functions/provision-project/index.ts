import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.26.0?target=deno'

interface ProvisionRequest {
  project_id: string
  name: string
  template_id?: string
  owner_id?: string
}

interface ProvisionResponse {
  success: boolean
  project_id: string
  schema_name?: string
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
    const body: ProvisionRequest = await req.json()

    const { project_id, name, template_id, owner_id } = body

    // Validate required fields
    if (!project_id || !name) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: project_id, name',
        } as ProvisionResponse),
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
        } as ProvisionResponse),
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
        } as ProvisionResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call provision_new_project function
    const { data, error } = await supabase.rpc('provision_new_project', {
      p_project_id: project_id,
      p_project_name: name,
      p_template_id: template_id,
      p_owner_id: owner_id || user.id,
    })

    if (error) {
      console.error('Provisioning error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          project_id,
          message: `Error provisioning project: ${error.message}`,
          error: error.message,
        } as ProvisionResponse),
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
    const response: ProvisionResponse = {
      success: data[0].success,
      project_id: data[0].project_id,
      schema_name: data[0].schema_name,
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
    console.error('Provision project error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        project_id: '',
        message: `Server error: ${error.message}`,
        error: error.message,
      } as ProvisionResponse),
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
