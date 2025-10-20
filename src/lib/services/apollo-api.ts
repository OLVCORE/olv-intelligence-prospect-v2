/**
 * APOLLO.IO API - Sales Intelligence
 * Dados reais de empresas e decisores B2B
 */

export interface ApolloCompany {
  id: string
  name: string
  website: string
  domain: string
  linkedin_url?: string
  industry: string
  employees: number
  revenue?: string
  location: {
    city?: string
    state?: string
    country: string
  }
  technologies: string[]
}

export interface ApolloDecisionMaker {
  id: string
  name: string
  title: string
  email?: string
  linkedin_url?: string
  department: string
  seniority: string
  company: {
    name: string
    id: string
  }
}

export interface ApolloSearchResponse {
  companies: ApolloCompany[]
  people: ApolloDecisionMaker[]
  total: number
}

class ApolloAPI {
  private apiKey: string
  private baseUrl = 'https://api.apollo.io/v1'

  constructor() {
    this.apiKey = process.env.APOLLO_API_KEY || ''
    if (!this.apiKey) {
      console.warn('[ApolloAPI] APOLLO_API_KEY não configurada')
    }
  }

  /**
   * Busca dados completos de uma empresa
   */
  async searchCompany(companyName: string, domain?: string): Promise<ApolloCompany | null> {
    if (!this.apiKey) {
      throw new Error('APOLLO_API_KEY não configurada')
    }

    try {
      console.log('[ApolloAPI] Buscando empresa:', companyName)

      const params = new URLSearchParams({
        api_key: this.apiKey,
        q_organization_name: companyName,
        ...(domain && { q_organization_domains: domain })
      })

      const response = await fetch(`${this.baseUrl}/organizations/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        console.error('[ApolloAPI] Erro:', response.status)
        return null
      }

      const data = await response.json()
      
      if (!data.organizations || data.organizations.length === 0) {
        console.warn('[ApolloAPI] Empresa não encontrada')
        return null
      }

      const org = data.organizations[0]
      console.log('[ApolloAPI] ✅ Empresa encontrada:', org.name)

      return {
        id: org.id,
        name: org.name,
        website: org.website_url,
        domain: org.primary_domain,
        linkedin_url: org.linkedin_url,
        industry: org.industry,
        employees: org.estimated_num_employees || 0,
        revenue: org.annual_revenue,
        location: {
          city: org.city,
          state: org.state,
          country: org.country
        },
        technologies: org.technologies || []
      }
    } catch (error: any) {
      console.error('[ApolloAPI] Erro:', error)
      return null
    }
  }

  /**
   * Busca decisores de uma empresa
   */
  async findDecisionMakers(
    companyName: string,
    titles?: string[],
    limit: number = 10
  ): Promise<ApolloDecisionMaker[]> {
    if (!this.apiKey) {
      throw new Error('APOLLO_API_KEY não configurada')
    }

    try {
      console.log('[ApolloAPI] Buscando decisores em:', companyName)

      const params = new URLSearchParams({
        api_key: this.apiKey,
        q_organization_name: companyName,
        per_page: limit.toString(),
        person_titles: titles?.join(',') || 'CEO,CTO,CFO,Director,VP,Head'
      })

      const response = await fetch(`${this.baseUrl}/people/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        console.error('[ApolloAPI] Erro ao buscar decisores:', response.status)
        return []
      }

      const data = await response.json()

      if (!data.people || data.people.length === 0) {
        console.warn('[ApolloAPI] Nenhum decisor encontrado')
        return []
      }

      console.log('[ApolloAPI] ✅ Decisores encontrados:', data.people.length)

      return data.people.map((person: any) => ({
        id: person.id,
        name: person.name,
        title: person.title,
        email: person.email,
        linkedin_url: person.linkedin_url,
        department: person.functions?.[0] || 'Não especificado',
        seniority: person.seniority || 'Não especificado',
        company: {
          name: person.organization?.name || companyName,
          id: person.organization?.id || ''
        }
      }))
    } catch (error: any) {
      console.error('[ApolloAPI] Erro ao buscar decisores:', error)
      return []
    }
  }

  /**
   * Enriquece dados de um decisor (busca email)
   */
  async enrichContact(
    name: string,
    companyDomain: string
  ): Promise<{ email?: string; verified: boolean }> {
    if (!this.apiKey) {
      throw new Error('APOLLO_API_KEY não configurada')
    }

    try {
      console.log('[ApolloAPI] Enriquecendo contato:', name)

      const response = await fetch(`${this.baseUrl}/people/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          name: name,
          domain: companyDomain,
          reveal_personal_emails: true
        })
      })

      if (!response.ok) {
        return { verified: false }
      }

      const data = await response.json()

      if (data.person?.email) {
        console.log('[ApolloAPI] ✅ Email encontrado')
        return {
          email: data.person.email,
          verified: data.person.email_status === 'verified'
        }
      }

      return { verified: false }
    } catch (error: any) {
      console.error('[ApolloAPI] Erro ao enriquecer:', error)
      return { verified: false }
    }
  }
}

export const apolloAPI = new ApolloAPI()
