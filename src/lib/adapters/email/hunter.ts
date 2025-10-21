// ✅ Adapter Hunter.io - Verificação e busca de emails
export interface HunterEmailData {
  email: string;
  score: number;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  seniority?: string;
  linkedin?: string;
  twitter?: string;
  phone_number?: string;
  type: 'personal' | 'generic';
  confidence: number;
  accept_all: boolean;
  webmail: boolean;
  sources: Array<{
    domain: string;
    uri: string;
    extracted_on: string;
  }>;
}

export interface HunterAdapter {
  findEmail(firstName: string, lastName: string, domain: string): Promise<HunterEmailData | null>;
  verifyEmail(email: string): Promise<{ valid: boolean; score: number; result: string } | null>;
}

class HunterAdapterImpl implements HunterAdapter {
  private apiKey: string;
  private baseUrl = 'https://api.hunter.io/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async findEmail(firstName: string, lastName: string, domain: string): Promise<HunterEmailData | null> {
    try {
      const params = new URLSearchParams({
        domain,
        first_name: firstName,
        last_name: lastName,
        api_key: this.apiKey
      });

      const response = await fetch(`${this.baseUrl}/email-finder?${params}`);
      
      if (!response.ok) {
        console.error('[Hunter] Email finder error:', response.status);
        return null;
      }

      const result = await response.json();
      
      if (!result.data?.email) {
        console.log('[Hunter] Email não encontrado');
        return null;
      }

      console.log('[Hunter] ✅ Email encontrado:', result.data.email);
      return result.data as HunterEmailData;
    } catch (error) {
      console.error('[Hunter] Erro ao buscar email:', error);
      return null;
    }
  }

  async verifyEmail(email: string): Promise<{ valid: boolean; score: number; result: string } | null> {
    try {
      const params = new URLSearchParams({
        email,
        api_key: this.apiKey
      });

      const response = await fetch(`${this.baseUrl}/email-verifier?${params}`);
      
      if (!response.ok) {
        console.error('[Hunter] Email verification error:', response.status);
        return null;
      }

      const result = await response.json();
      
      const verification = {
        valid: result.data.status === 'valid',
        score: result.data.score,
        result: result.data.result
      };

      console.log('[Hunter] ✅ Email verificado:', verification);
      return verification;
    } catch (error) {
      console.error('[Hunter] Erro ao verificar email:', error);
      return null;
    }
  }
}

export function createHunterAdapter(apiKey: string): HunterAdapter {
  return new HunterAdapterImpl(apiKey);
}
