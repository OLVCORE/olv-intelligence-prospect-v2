import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, filters } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Build query
    let queryBuilder = supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    // Apply search filter
    if (query) {
      queryBuilder = queryBuilder.or(`company_name.ilike.%${query}%,fantasy_name.ilike.%${query}%,cnpj.ilike.%${query}%`)
    }

    // Apply city filter
    if (filters?.city) {
      queryBuilder = queryBuilder.eq('city', filters.city)
    }

    // Apply state filter
    if (filters?.state) {
      queryBuilder = queryBuilder.eq('state', filters.state)
    }

    // Apply company size filter
    if (filters?.company_size) {
      queryBuilder = queryBuilder.eq('company_size', filters.company_size)
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        companies: data,
        count: data?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
