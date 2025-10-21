// ✅ Adapter PhantomBuster - LinkedIn scraping e automação
export interface PhantomAgentConfig {
  id: string;
  name: string;
  scriptId: string;
}

export interface PhantomLaunchResult {
  containerId: string;
  agentId: string;
  status: 'running' | 'queued';
  queuePosition?: number;
}

export interface PhantomScrapedProfile {
  profileUrl: string;
  fullName: string;
  headline?: string;
  location?: string;
  summary?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
  }>;
  skills?: string[];
  connections?: number;
}

export interface PhantomAdapter {
  launchAgent(agentId: string, profileUrls: string[]): Promise<PhantomLaunchResult | null>;
  getAgentResult(containerId: string): Promise<PhantomScrapedProfile[] | null>;
}

class PhantomAdapterImpl implements PhantomAdapter {
  private apiKey: string;
  private baseUrl = 'https://api.phantombuster.com/api/v2';
  private sessionCookie: string;

  constructor(apiKey: string, sessionCookie: string) {
    this.apiKey = apiKey;
    this.sessionCookie = sessionCookie;
  }

  async launchAgent(agentId: string, profileUrls: string[]): Promise<PhantomLaunchResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/launch`, {
        method: 'POST',
        headers: {
          'X-Phantombuster-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: agentId,
          argument: {
            sessionCookie: this.sessionCookie,
            profileUrls: profileUrls
          }
        })
      });

      if (!response.ok) {
        console.error('[PhantomBuster] Launch error:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[PhantomBuster] ✅ Agent iniciado:', data.containerId);
      return data as PhantomLaunchResult;
    } catch (error) {
      console.error('[PhantomBuster] Erro ao iniciar agent:', error);
      return null;
    }
  }

  async getAgentResult(containerId: string): Promise<PhantomScrapedProfile[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/containers/fetch-result?id=${containerId}`, {
        headers: {
          'X-Phantombuster-Key': this.apiKey
        }
      });

      if (!response.ok) {
        console.error('[PhantomBuster] Fetch result error:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[PhantomBuster] ✅ Resultados obtidos:', data.length);
      return data as PhantomScrapedProfile[];
    } catch (error) {
      console.error('[PhantomBuster] Erro ao buscar resultados:', error);
      return null;
    }
  }
}

export function createPhantomAdapter(apiKey: string, sessionCookie: string): PhantomAdapter {
  return new PhantomAdapterImpl(apiKey, sessionCookie);
}
