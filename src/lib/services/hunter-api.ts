/**
 * HUNTER.IO API - Email Finder
 * Encontra e verifica emails de decisores
 */

export interface HunterEmailResult {
  email: string
  score: number // 0-100
  verified: boolean
  sources: Array<{
    domain: string
    uri: string
    extracted_on: string
  }>
}

export interface HunterDomainSearch {
  domain: string
  emails: Array<{
    value: string
    type: string
    confidence: number
    firstName: string
    lastName: string
    position: string
    department?: string
    linkedin?: string
  }>
  pattern: string // ex: {first}.{last}@empresa.com
}

class HunterAPI {
  private apiKey: string
  private baseUrl = 'https://api.hunter.io/v2'

  constructor() {
    this.apiKey = process.env.HUNTER_API_KEY || ''
    if (!this.apiKey) {
      console.warn('[HunterAPI] HUNTER_API_KEY não configurada')
    }
  }

  /**
   * Encontra email de uma pessoa específica
   */
  async findEmail(
    firstName: string,
    lastName: string,
    domain: string
  ): Promise<HunterEmailResult | null> {
    if (!this.apiKey) {
      throw new Error('HUNTER_API_KEY não configurada')
    }

    try {
      console.log('[HunterAPI] Buscando email:', firstName, lastName, '@', domain)

      const params = new URLSearchParams({
        api_key: this.apiKey,
        first_name: firstName,
        last_name: lastName,
        domain: domain
      })

      const response = await fetch(`${this.baseUrl}/email-finder?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('[HunterAPI] Erro:', response.status)
        return null
      }

      const data = await response.json()

      if (!data.data?.email) {
        console.warn('[HunterAPI] Email não encontrado')
        return null
      }

      console.log('[HunterAPI] ✅ Email encontrado:', data.data.email)

      return {
        email: data.data.email,
        score: data.data.score,
        verified: data.data.verification?.status === 'valid',
        sources: data.data.sources || []
      }
    } catch (error: any) {
      console.error('[HunterAPI] Erro:', error)
      return null
    }
  }

  /**
   * Busca todos os emails de um domínio
   */
  async searchDomain(domain: string, limit: number = 10): Promise<HunterDomainSearch | null> {
    if (!this.apiKey) {
      throw new Error('HUNTER_API_KEY não configurada')
    }

    try {
      console.log('[HunterAPI] Buscando emails do domínio:', domain)

      const params = new URLSearchParams({
        api_key: this.apiKey,
        domain: domain,
        limit: limit.toString()
      })

      const response = await fetch(`${this.baseUrl}/domain-search?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('[HunterAPI] Erro:', response.status)
        return null
      }

      const data = await response.json()

      if (!data.data?.emails) {
        console.warn('[HunterAPI] Nenhum email encontrado no domínio')
        return null
      }

      console.log('[HunterAPI] ✅ Emails encontrados:', data.data.emails.length)

      return {
        domain: data.data.domain,
        pattern: data.data.pattern,
        emails: data.data.emails.map((email: any) => ({
          value: email.value,
          type: email.type,
          confidence: email.confidence,
          firstName: email.first_name,
          lastName: email.last_name,
          position: email.position,
          department: email.department,
          linkedin: email.linkedin
        }))
      }
    } catch (error: any) {
      console.error('[HunterAPI] Erro:', error)
      return null
    }
  }

  /**
   * Verifica se um email existe e é válido
   */
  async verifyEmail(email: string): Promise<{
    valid: boolean
    score: number
    result: string
  }> {
    if (!this.apiKey) {
      throw new Error('HUNTER_API_KEY não configurada')
    }

    try {
      console.log('[HunterAPI] Verificando email:', email)

      const params = new URLSearchParams({
        api_key: this.apiKey,
        email: email
      })

      const response = await fetch(`${this.baseUrl}/email-verifier?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        return { valid: false, score: 0, result: 'unknown' }
      }

      const data = await response.json()

      return {
        valid: data.data.status === 'valid',
        score: data.data.score,
        result: data.data.result
      }
    } catch (error: any) {
      console.error('[HunterAPI] Erro ao verificar:', error)
      return { valid: false, score: 0, result: 'unknown' }
    }
  }
}

export const hunterAPI = new HunterAPI()
