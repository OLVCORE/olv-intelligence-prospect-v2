import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, ExternalLink, Globe, Target, BarChart3 } from 'lucide-react';

interface KeywordsSEOTabProps {
  companyName?: string;
  domain?: string;
}

export function KeywordsSEOTab({ companyName, domain }: KeywordsSEOTabProps) {
  // Keywords simuladas (em produção viria de API real)
  const keywords = [
    { term: 'ERP para indústria', volume: 8900, difficulty: 65, relevance: 95 },
    { term: 'gestão empresarial', volume: 12000, difficulty: 72, relevance: 88 },
    { term: 'sistema gestão integrada', volume: 5600, difficulty: 58, relevance: 92 },
    { term: 'software financeiro', volume: 4200, difficulty: 61, relevance: 85 },
    { term: 'automação processos', volume: 3800, difficulty: 54, relevance: 79 }
  ];

  const topCompetitors = [
    { domain: 'totvs.com', rank: 1, keywords: 245 },
    { domain: 'sap.com', rank: 2, keywords: 189 },
    { domain: 'oracle.com', rank: 3, keywords: 167 }
  ];

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para análise de SEO
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">
              Keywords & SEO Intelligence
            </h3>
            <p className="text-sm text-muted-foreground">
              Análise de palavras-chave e posicionamento de mercado
            </p>
          </div>
        </div>
      </Card>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Keywords</span>
          </div>
          <div className="text-2xl font-bold mb-1">{keywords.length}</div>
          <Badge variant="outline" className="text-xs">palavras-chave</Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Volume</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {(keywords.reduce((acc, k) => acc + k.volume, 0) / 1000).toFixed(1)}K
          </div>
          <Badge variant="outline" className="text-xs">buscas/mês</Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Relevância</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {Math.round(keywords.reduce((acc, k) => acc + k.relevance, 0) / keywords.length)}%
          </div>
          <Badge variant="outline" className="text-xs">média</Badge>
        </Card>
      </div>

      {/* Keywords ranqueadas */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Top Keywords Relevantes
        </h4>
        <div className="space-y-3">
          {keywords.map((keyword, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                <span className="text-sm font-bold text-primary">#{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{keyword.term}</span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(keyword.term)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{keyword.volume.toLocaleString('pt-BR')} buscas/mês</span>
                  <span>•</span>
                  <span>Dificuldade: {keyword.difficulty}%</span>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {keyword.relevance}% relevante
                  </Badge>
                </div>
              </div>
              <div className="shrink-0 w-24">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600"
                    style={{ width: `${keyword.relevance}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Análise competitiva SEO */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Análise Competitiva SEO
        </h4>
        <div className="space-y-3">
          {topCompetitors.map((competitor, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant={index === 0 ? 'default' : 'outline'}>
                  #{competitor.rank}
                </Badge>
                <div>
                  <div className="font-medium text-sm">{competitor.domain}</div>
                  <div className="text-xs text-muted-foreground">
                    {competitor.keywords} keywords ranqueadas
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" asChild>
                <a 
                  href={`https://${competitor.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 bg-primary/5">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Insights Estratégicos
        </h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>
              Empresa compete em keywords de <strong>alto volume</strong> com relevância média de <strong>87%</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>
              Oportunidade de <strong>capturar tráfego orgânico</strong> em "ERP para indústria" (8.9K buscas/mês)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>
              Concorrentes principais: <strong>TOTVS, SAP e Oracle</strong> dominam o mercado de busca
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
