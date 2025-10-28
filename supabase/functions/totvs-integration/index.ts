import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TOTVSIntegrationRequest {
  action: 'sync_customer' | 'create_opportunity' | 'update_contact' | 'get_erp_data';
  data: {
    company_id?: string;
    contact_id?: string;
    cnpj?: string;
    customer_code?: string;
    opportunity_data?: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data }: TOTVSIntegrationRequest = await req.json();

    console.log(`TOTVS Integration - Action: ${action}`, data);

    let result;

    switch (action) {
      case 'sync_customer':
        result = await syncCustomerToTOTVS(supabase, data);
        break;

      case 'create_opportunity':
        result = await createOpportunityInTOTVS(supabase, data);
        break;

      case 'update_contact':
        result = await updateContactInTOTVS(supabase, data);
        break;

      case 'get_erp_data':
        result = await getERPData(supabase, data);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('TOTVS Integration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function syncCustomerToTOTVS(supabase: any, data: any) {
  const { company_id, cnpj } = data;

  // Get company data
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', company_id)
    .single();

  if (error) throw error;

  // Simulate TOTVS API call
  // In production, this would call the actual TOTVS Protheus API
  const totvsCustomer = {
    customerCode: `CUST${company.id.substring(0, 8)}`,
    cnpj: company.cnpj || cnpj,
    corporateName: company.name,
    tradeName: company.name,
    address: company.location?.address || '',
    city: company.location?.city || '',
    state: company.location?.state || '',
    zipCode: company.location?.zipCode || '',
    email: '',
    phone: '',
    industry: company.industry || '',
    revenue: company.revenue || '',
  };

  console.log('Syncing customer to TOTVS:', totvsCustomer);

  // Update company with TOTVS customer code
  await supabase
    .from('companies')
    .update({ 
      raw_data: {
        ...company.raw_data,
        totvs_customer_code: totvsCustomer.customerCode,
        totvs_synced_at: new Date().toISOString(),
      }
    })
    .eq('id', company_id);

  return {
    synced: true,
    customer_code: totvsCustomer.customerCode,
    message: 'Cliente sincronizado com TOTVS Protheus',
  };
}

async function createOpportunityInTOTVS(supabase: any, data: any) {
  const { company_id, contact_id, opportunity_data } = data;

  // Get company and contact data
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', company_id)
    .single();

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contact_id)
    .single();

  // Simulate TOTVS CRM opportunity creation
  const totvsOpportunity = {
    opportunityCode: `OPP${Date.now()}`,
    customerCode: company?.raw_data?.totvs_customer_code || `CUST${company_id.substring(0, 8)}`,
    description: opportunity_data.description || `Oportunidade ${company?.name}`,
    value: opportunity_data.value || 0,
    probability: opportunity_data.probability || 50,
    stage: opportunity_data.stage || 'Prospecção',
    contactName: contact?.name || '',
    contactEmail: contact?.email || '',
    contactPhone: contact?.phone || '',
    expectedCloseDate: opportunity_data.expected_close_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'STRATEVO Intelligence',
  };

  console.log('Creating opportunity in TOTVS:', totvsOpportunity);

  return {
    created: true,
    opportunity_code: totvsOpportunity.opportunityCode,
    message: 'Oportunidade criada no TOTVS CRM',
  };
}

async function updateContactInTOTVS(supabase: any, data: any) {
  const { contact_id } = data;

  const { data: contact } = await supabase
    .from('contacts')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('id', contact_id)
    .single();

  if (!contact) throw new Error('Contact not found');

  // Simulate TOTVS contact update
  const totvsContact = {
    contactCode: `CONT${contact_id.substring(0, 8)}`,
    customerCode: (contact.company as any)?.raw_data?.totvs_customer_code,
    name: contact.name,
    email: contact.email || '',
    phone: contact.phone || '',
    role: 'Contato Principal',
  };

  console.log('Updating contact in TOTVS:', totvsContact);

  return {
    updated: true,
    contact_code: totvsContact.contactCode,
    message: 'Contato atualizado no TOTVS',
  };
}

async function getERPData(supabase: any, data: any) {
  const { customer_code, cnpj } = data;

  // Simulate fetching data from TOTVS
  // In production, this would call the actual TOTVS API
  const erpData = {
    customer_code: customer_code || `CUST${Date.now()}`,
    financial_data: {
      credit_limit: 500000,
      available_credit: 450000,
      overdue_invoices: 0,
      total_debt: 0,
      payment_terms: '30 dias',
      last_purchase_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      total_purchased: 250000,
    },
    order_history: [
      {
        order_number: 'PED001',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        value: 75000,
        status: 'Entregue',
        products: ['Protheus ERP', 'Fluig BPM'],
      },
      {
        order_number: 'PED002',
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        value: 120000,
        status: 'Entregue',
        products: ['RM Labore'],
      },
    ],
    service_tickets: [
      {
        ticket_number: 'SUPP001',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'Suporte técnico - Integração',
        status: 'Resolvido',
        priority: 'Alta',
      },
    ],
  };

  console.log('Fetching ERP data from TOTVS:', erpData);

  return erpData;
}
