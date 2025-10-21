// ✅ Adapter Tech Detection - Detecção híbrida de tecnologias
export interface DetectedTechnology {
  name: string;
  category: string;
  confidence: number;
  version?: string;
  description?: string;
}

export interface TechStackAnalysis {
  technologies: DetectedTechnology[];
  cloudProviders: string[];
  frameworks: string[];
  cms?: string;
  analytics?: string[];
  ecommerce?: string;
  security: string[];
}

export interface TechDetectionAdapter {
  analyzeWebsite(url: string): Promise<TechStackAnalysis | null>;
  detectFromHTML(html: string): Promise<DetectedTechnology[]>;
}

class TechDetectionAdapterImpl implements TechDetectionAdapter {
  private patterns = {
    // Cloud Providers
    aws: /amazonaws\.com|cloudfront\.net/i,
    azure: /azure\.com|azureedge\.net/i,
    gcp: /googleapis\.com|gstatic\.com/i,
    
    // Frameworks
    react: /react|_next\/static/i,
    angular: /ng-|angular/i,
    vue: /vue\.js|nuxt/i,
    
    // CMS
    wordpress: /wp-content|wp-includes/i,
    shopify: /shopify|myshopify/i,
    wix: /wix\.com|wixstatic/i,
    
    // Analytics
    googleAnalytics: /google-analytics\.com|gtag\.js/i,
    mixpanel: /mixpanel\.com/i,
    segment: /segment\.com|analytics\.js/i,
    
    // Security
    cloudflare: /cloudflare|__cf_/i,
    recaptcha: /recaptcha/i,
  };

  async analyzeWebsite(url: string): Promise<TechStackAnalysis | null> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('[TechDetect] Failed to fetch website:', response.status);
        return null;
      }

      const html = await response.text();
      const headers = Object.fromEntries(response.headers);

      const technologies = await this.detectFromHTML(html);
      const serverTech = this.detectFromHeaders(headers);
      
      const allTech = [...technologies, ...serverTech];
      
      const analysis: TechStackAnalysis = {
        technologies: allTech,
        cloudProviders: this.extractByCategory(allTech, 'Cloud Provider'),
        frameworks: this.extractByCategory(allTech, 'Framework'),
        cms: this.extractByCategory(allTech, 'CMS')[0],
        analytics: this.extractByCategory(allTech, 'Analytics'),
        ecommerce: this.extractByCategory(allTech, 'E-commerce')[0],
        security: this.extractByCategory(allTech, 'Security')
      };

      console.log('[TechDetect] ✅ Análise concluída:', allTech.length, 'tecnologias detectadas');
      return analysis;
    } catch (error) {
      console.error('[TechDetect] Erro na análise:', error);
      return null;
    }
  }

  async detectFromHTML(html: string): Promise<DetectedTechnology[]> {
    const detected: DetectedTechnology[] = [];
    const lowerHtml = html.toLowerCase();

    // Cloud Providers
    if (this.patterns.aws.test(lowerHtml)) {
      detected.push({ name: 'AWS', category: 'Cloud Provider', confidence: 0.9 });
    }
    if (this.patterns.azure.test(lowerHtml)) {
      detected.push({ name: 'Azure', category: 'Cloud Provider', confidence: 0.9 });
    }
    if (this.patterns.gcp.test(lowerHtml)) {
      detected.push({ name: 'Google Cloud', category: 'Cloud Provider', confidence: 0.9 });
    }

    // Frameworks
    if (this.patterns.react.test(lowerHtml)) {
      detected.push({ name: 'React', category: 'Framework', confidence: 0.95 });
    }
    if (this.patterns.angular.test(lowerHtml)) {
      detected.push({ name: 'Angular', category: 'Framework', confidence: 0.95 });
    }
    if (this.patterns.vue.test(lowerHtml)) {
      detected.push({ name: 'Vue.js', category: 'Framework', confidence: 0.95 });
    }

    // CMS
    if (this.patterns.wordpress.test(lowerHtml)) {
      detected.push({ name: 'WordPress', category: 'CMS', confidence: 0.98 });
    }
    if (this.patterns.shopify.test(lowerHtml)) {
      detected.push({ name: 'Shopify', category: 'E-commerce', confidence: 0.98 });
    }

    // Analytics
    if (this.patterns.googleAnalytics.test(lowerHtml)) {
      detected.push({ name: 'Google Analytics', category: 'Analytics', confidence: 0.95 });
    }
    if (this.patterns.mixpanel.test(lowerHtml)) {
      detected.push({ name: 'Mixpanel', category: 'Analytics', confidence: 0.9 });
    }

    // Security
    if (this.patterns.cloudflare.test(lowerHtml)) {
      detected.push({ name: 'Cloudflare', category: 'Security', confidence: 0.9 });
    }
    if (this.patterns.recaptcha.test(lowerHtml)) {
      detected.push({ name: 'reCAPTCHA', category: 'Security', confidence: 0.95 });
    }

    return detected;
  }

  private detectFromHeaders(headers: Record<string, string>): DetectedTechnology[] {
    const detected: DetectedTechnology[] = [];

    const server = headers['server']?.toLowerCase() || '';
    const poweredBy = headers['x-powered-by']?.toLowerCase() || '';

    if (server.includes('nginx')) {
      detected.push({ name: 'Nginx', category: 'Web Server', confidence: 1.0 });
    }
    if (server.includes('apache')) {
      detected.push({ name: 'Apache', category: 'Web Server', confidence: 1.0 });
    }
    if (poweredBy.includes('express')) {
      detected.push({ name: 'Express.js', category: 'Framework', confidence: 1.0 });
    }
    if (poweredBy.includes('php')) {
      detected.push({ name: 'PHP', category: 'Language', confidence: 1.0 });
    }

    return detected;
  }

  private extractByCategory(tech: DetectedTechnology[], category: string): string[] {
    return tech
      .filter(t => t.category === category)
      .map(t => t.name);
  }
}

export function createTechDetectionAdapter(): TechDetectionAdapter {
  return new TechDetectionAdapterImpl();
}
