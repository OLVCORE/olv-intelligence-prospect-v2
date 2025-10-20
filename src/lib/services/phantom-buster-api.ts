/**
 * PHANTOMBUSTER API - LinkedIn & Web Scraping
 * Extrai dados de perfis, empresas e posts do LinkedIn
 */

export interface PhantomAgent {
  id: string
  name: string
  scriptId: string
  status: 'running' | 'stopped' | 'paused'
}

export interface LinkedInProfile {
  name: string
  title: string
  company: string
  location?: string
  email?: string
  phone?: string
  linkedin_url: string
  connections?: number
  about?: string
}

export interface LinkedInCompany {
  name: string
  website?: string
  industry?: string
  size?: string
  description?: string
  linkedin_url: string
  employees?: number
}

class PhantomBusterAPI {
  private apiKey: string
  private baseUrl = 'https://api.phantombuster.com/api/v2'

  constructor() {
    this.apiKey = process.env.PHANTOM_BUSTER_API_KEY || ''
    if (!this.apiKey) {
      console.warn('[PhantomBuster] PHANTOM_BUSTER_API_KEY não configurada')
    }
  }

  /**
   * Lista todos os agents disponíveis
   */
  async listAgents(): Promise<PhantomAgent[]> {
    if (!this.apiKey) {
      throw new Error('PHANTOM_BUSTER_API_KEY não configurada')
    }

    try {
      const response = await fetch(`${this.baseUrl}/agents/fetch-all`, {
        method: 'GET',
        headers: {
          'X-Phantombuster-Key': this.apiKey,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`PhantomBuster API erro: ${response.status}`)
      }

      const data = await response.json()
      return data.agents || []
    } catch (error: any) {
      console.error('[PhantomBuster] Erro ao listar agents:', error)
      return []
    }
  }

  /**
   * Extrai dados de um perfil do LinkedIn
   */
  async scrapeLinkedInProfile(profileUrl: string): Promise<LinkedInProfile | null> {
    if (!this.apiKey) {
      throw new Error('PHANTOM_BUSTER_API_KEY não configurada')
    }

    try {
      console.log('[PhantomBuster] Extraindo perfil:', profileUrl)

      // Lança agent do LinkedIn Profile Scraper
      const launchResponse = await fetch(`${this.baseUrl}/agents/launch`, {
        method: 'POST',
        headers: {
          'X-Phantombuster-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'linkedin-profile-scraper', // ID do agent
          argument: {
            profileUrl: profileUrl
          }
        })
      })

      if (!launchResponse.ok) {
        console.error('[PhantomBuster] Erro ao lançar agent')
        return null
      }

      const launchData = await launchResponse.json()
      const containerId = launchData.containerId

      // Aguarda conclusão (polling)
      await this.waitForCompletion(containerId)

      // Busca resultados
      const resultResponse = await fetch(
        `${this.baseUrl}/containers/fetch-result-object?id=${containerId}`,
        {
          headers: {
            'X-Phantombuster-Key': this.apiKey,
            'Accept': 'application/json'
          }
        }
      )

      if (!resultResponse.ok) {
        return null
      }

      const result = await resultResponse.json()
      console.log('[PhantomBuster] ✅ Perfil extraído')

      return {
        name: result.fullName,
        title: result.title,
        company: result.company,
        location: result.location,
        email: result.email,
        phone: result.phone,
        linkedin_url: profileUrl,
        connections: result.connectionsCount,
        about: result.about
      }
    } catch (error: any) {
      console.error('[PhantomBuster] Erro ao extrair perfil:', error)
      return null
    }
  }

  /**
   * Busca funcionários de uma empresa no LinkedIn
   */
  async scrapeCompanyEmployees(
    companyLinkedIn: string,
    limit: number = 20
  ): Promise<LinkedInProfile[]> {
    if (!this.apiKey) {
      throw new Error('PHANTOM_BUSTER_API_KEY não configurada')
    }

    try {
      console.log('[PhantomBuster] Buscando funcionários:', companyLinkedIn)

      const launchResponse = await fetch(`${this.baseUrl}/agents/launch`, {
        method: 'POST',
        headers: {
          'X-Phantombuster-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'linkedin-company-employees',
          argument: {
            companyUrl: companyLinkedIn,
            numberOfProfiles: limit,
            filters: 'current-company'
          }
        })
      })

      if (!launchResponse.ok) {
        return []
      }

      const launchData = await launchResponse.json()
      await this.waitForCompletion(launchData.containerId)

      const resultResponse = await fetch(
        `${this.baseUrl}/containers/fetch-result-object?id=${launchData.containerId}`,
        {
          headers: {
            'X-Phantombuster-Key': this.apiKey
          }
        }
      )

      if (!resultResponse.ok) {
        return []
      }

      const result = await resultResponse.json()
      console.log('[PhantomBuster] ✅ Funcionários encontrados:', result.length)

      return result.map((profile: any) => ({
        name: profile.fullName,
        title: profile.title,
        company: profile.company,
        location: profile.location,
        linkedin_url: profile.profileUrl,
        email: profile.email
      }))
    } catch (error: any) {
      console.error('[PhantomBuster] Erro ao buscar funcionários:', error)
      return []
    }
  }

  /**
   * Aguarda conclusão de um job
   */
  private async waitForCompletion(containerId: string, maxWait: number = 60000): Promise<void> {
    const startTime = Date.now()
    const pollInterval = 5000 // 5 segundos

    while (Date.now() - startTime < maxWait) {
      const statusResponse = await fetch(
        `${this.baseUrl}/containers/fetch?id=${containerId}`,
        {
          headers: {
            'X-Phantombuster-Key': this.apiKey
          }
        }
      )

      if (statusResponse.ok) {
        const status = await statusResponse.json()
        
        if (status.status === 'finished') {
          return
        }

        if (status.status === 'error') {
          throw new Error('Job falhou')
        }
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('Timeout: Job não concluiu a tempo')
  }
}

export const phantomBusterAPI = new PhantomBusterAPI()
