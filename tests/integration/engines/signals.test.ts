// ✅ Testes de integração - Signal Detection Engine
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSignalDetectionEngine } from '@/lib/engines/intelligence/signals';
import { createSerperAdapter } from '@/lib/adapters/search/serper';

describe('Signal Detection Engine - Integration', () => {
  let engine: ReturnType<typeof createSignalDetectionEngine>;
  
  beforeEach(() => {
    global.fetch = vi.fn();
    const serper = createSerperAdapter('test_key');
    engine = createSignalDetectionEngine(serper);
  });

  it('should detect funding signals from news', async () => {
    const mockNews = [
      {
        title: 'Empresa X recebe aporte de R$ 50 milhões',
        snippet: 'Rodada Series A liderada por investidores',
        source: 'Valor Econômico',
        date: new Date().toISOString(),
        link: 'https://example.com/news1'
      },
      {
        title: 'Startup anuncia nova rodada de investimento',
        snippet: 'Captação de recursos para expansão',
        source: 'TechCrunch',
        date: new Date().toISOString(),
        link: 'https://example.com/news2'
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ news: mockNews })
    });

    const signals = await engine.detectFromNews('Empresa X');

    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some(s => s.type === 'funding_round')).toBe(true);
    expect(signals[0].confidence_score).toBeGreaterThan(0.6);
  });

  it('should detect digital transformation signals', async () => {
    const mockSearchResults = {
      organic: [
        { 
          title: 'Empresa Y migra para cloud AWS',
          snippet: 'Transformação digital completa com adoção de cloud computing'
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults
    });

    const signals = await engine.detectFromSearch('Empresa Y', 'empresay.com');

    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some(s => s.type === 'digital_transformation')).toBe(true);
  });

  it('should analyze signals and provide recommendation', async () => {
    const signals = [
      {
        type: 'funding_round' as const,
        description: 'Series A funding',
        confidence_score: 0.9,
        source: 'TechCrunch',
        detected_at: new Date()
      },
      {
        type: 'leadership_change' as const,
        description: 'New CTO hired',
        confidence_score: 0.85,
        source: 'LinkedIn',
        detected_at: new Date()
      },
      {
        type: 'technology_adoption' as const,
        description: 'Adopted AWS cloud',
        confidence_score: 0.8,
        source: 'Blog post',
        detected_at: new Date()
      }
    ];

    const analysis = engine.analyzeSignals(signals);

    expect(analysis.totalSignals).toBe(3);
    expect(analysis.highConfidence).toBe(3);
    expect(analysis.overallScore).toBeGreaterThan(0.8);
    expect(analysis.recommendation).toBe('high_priority');
  });
});
