/**
 * SERPER API - Google Search em Tempo Real
 * Busca informações atualizadas sobre empresas
 */

export interface SerperSearchResult {
  title: string
  link: string
  snippet: string
  position: number
  date?: string
}

export interface SerperNewsResult {
  title: string
  link: string
  snippet: string
  date: string
  source: string
}

export interface SerperSearchResponse {
  organic: SerperSearchResult[]
  news?: SerperNewsResult[]
  answerBox?: {
    answer: string
    title: string
  }
}

class SerperAPI {
  private apiKey: string
  private baseUrl = 'https://google.serper.dev'

  constructor() {
    this.apiKey = process.env.SERPER_API_KEY || ''
    if (!this.apiKey) {
      console.warn('[SerperAPI] SERPER_API_KEY não configurada')
    }
  }

  /**
   * Busca informações sobre uma empresa no Google
   */
  async searchCompany(companyName: string, cnpj?: string): Promise<SerperSearchResponse> {
    if (!this.apiKey) {
      throw new Error('SERPER_API_KEY não configurada')
    }

    const query = cnpj 
      ? `${companyName} CNPJ ${cnpj}` 
      : companyName

    try {
      console.log('[SerperAPI] Buscando:', query)

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          gl: 'br',
          hl: 'pt-br',
          num: 10
        }),
      })

      if (!response.ok) {
        throw new Error(`Serper API erro: ${response.status}`)
      }

      const data = await response.json()
      console.log('[SerperAPI] Resultados:', data.organic?.length || 0)

      return {
        organic: data.organic || [],
        news: data.news || [],
        answerBox: data.answerBox
      }
    } catch (error: any) {
      console.error('[SerperAPI] Erro:', error)
      throw error
    }
  }

  /**
   * Busca notícias recentes sobre a empresa
   */
  async searchNews(companyName: string, days: number = 30): Promise<SerperNewsResult[]> {
    if (!this.apiKey) {
      throw new Error('SERPER_API_KEY não configurada')
    }

    try {
      console.log('[SerperAPI] Buscando notícias:', companyName)

      const response = await fetch(`${this.baseUrl}/news`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: companyName,
          gl: 'br',
          hl: 'pt-br',
          num: 10,
          tbs: `qdr:d${days}` // últimos X dias
        }),
      })

      if (!response.ok) {
        throw new Error(`Serper News API erro: ${response.status}`)
      }

      const data = await response.json()
      console.log('[SerperAPI] Notícias encontradas:', data.news?.length || 0)

      return data.news || []
    } catch (error: any) {
      console.error('[SerperAPI] Erro ao buscar notícias:', error)
      throw error
    }
  }

  /**
   * Busca tecnologias usadas pela empresa
   */
  async searchTechnologies(companyName: string, website?: string): Promise<SerperSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('SERPER_API_KEY não configurada')
    }

    const query = website
      ? `site:${website} tecnologia OR software OR sistema OR ERP OR CRM`
      : `${companyName} tecnologia sistema ERP CRM plataforma`

    try {
      console.log('[SerperAPI] Buscando tech stack:', query)

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          gl: 'br',
          hl: 'pt-br',
          num: 20
        }),
      })

      if (!response.ok) {
        throw new Error(`Serper API erro: ${response.status}`)
      }

      const data = await response.json()
      return data.organic || []
    } catch (error: any) {
      console.error('[SerperAPI] Erro ao buscar tecnologias:', error)
      throw error
    }
  }
}

export const serperAPI = new SerperAPI()
