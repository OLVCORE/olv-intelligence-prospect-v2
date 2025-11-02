import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, CheckCircle, XCircle, ExternalLink, AlertTriangle, Globe, Search, Clock, CheckSquare, Info, Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface TOTVSVerificationReportProps {
  data: any;
  companyName: string;
  cnpj?: string;
}

export default function TOTVSVerificationReport({ data, companyName, cnpj }: TOTVSVerificationReportProps) {
  // Garantir que evidences seja sempre um array válido
  const evidences = Array.isArray(data?.evidences) 
    ? data.evidences.filter((ev: any) => ev && (ev.text || ev.snippet) && (ev.url || ev.source))
    : [];
  
  console.log('[TOTVS REPORT] 📊 Dados recebidos:', data);
  console.log('[TOTVS REPORT] 📊 Metodologia:', data?.methodology);
  console.log('[TOTVS REPORT] 📊 Evidências recebidas:', evidences.length);

  // Função para destacar termos-chave nas evidências
  const highlightTerms = (text: string, terms?: string[]) => {
    if (!text || !terms || terms.length === 0) return text || '';
    
    let highlightedText = text;
    terms.forEach(term => {
      if (!term) return; // Skip undefined/null terms
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-primary/30 text-primary font-semibold px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  // Copiar URL para área de transferência
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (!data) {
    return (
      <Card className="p-12 text-center border-2">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">Dados não disponíveis</h3>
        <p className="text-muted-foreground">Execute a verificação para gerar o relatório</p>
      </Card>
    );
  }

  const isClienteTOTVS = data.status === 'cliente_totvs';
  const confidence = data.confidence || 'low';
  // Fallbacks robustos para contagens e utilitários de exibição
  const sourcesWithResults = (data?.methodology?.sources_with_results ?? data?.methodology?.total_matches ?? (Array.isArray(data?.evidences) ? data.evidences.length : 0)) as number;
  const executionMs = (data?.methodology?.execution_time_ms ?? data?.metadata?.execution_time_ms ?? 0) as number;

  // Evidências e buscas sugeridas (quando não houver evidências persistidas)
  const nameQuery = (companyName || data?.company_name || data?.razao_social || '').trim();
  const cnpjDigits = (cnpj || '').replace(/\D/g, '');
  const enc = (q: string) => encodeURIComponent(q);
  const fallbackLinks = [
    { label: 'Google: Nome + TOTVS', url: `https://www.google.com/search?q=${enc(`${nameQuery} TOTVS`)}` },
    { label: 'Notícias: Nome + TOTVS', url: `https://www.google.com/search?q=${enc(`${nameQuery} TOTVS`)}&tbm=nws` },
    { label: 'Site TOTVS (site:totvs.com)', url: `https://www.google.com/search?q=${enc(`site:totvs.com ${nameQuery}`)}` },
    { label: 'LinkedIn (vagas)', url: `https://www.google.com/search?q=${enc(`site:linkedin.com/jobs ${nameQuery} TOTVS`)}` },
    { label: 'Docs Oficiais (.gov.br)', url: `https://www.google.com/search?q=${enc(`site:gov.br ${nameQuery} TOTVS`)}` },
    ...(cnpjDigits ? [{ label: 'Google: CNPJ + TOTVS', url: `https://www.google.com/search?q=${enc(`${cnpjDigits} TOTVS`)}` }] : []),
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Compacto em uma linha */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-background border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Verificação TOTVS • {companyName}</h1>
                {cnpj && (
                  <p className="text-xs font-mono text-muted-foreground">CNPJ: {cnpj}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Status Cards Compactos */}
        <div className="grid grid-cols-2 gap-4">
          <Card className={`p-5 border-2 ${isClienteTOTVS ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">Indica se a empresa já é cliente TOTVS baseado em 17 fontes de verificação</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {isClienteTOTVS ? (
                <>
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">Cliente TOTVS</p>
                    <p className="text-xs text-red-600/70">Não qualificado</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">Não é Cliente</p>
                    <p className="text-xs text-green-600/70">✓ Qualificado</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5 border-2 border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Confiança</p>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">Alta: 10+ fontes | Média: 5-9 fontes | Baixa: 1-4 fontes confirmadas</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${
                confidence === 'high' ? 'bg-emerald-500/20' : 
                confidence === 'medium' ? 'bg-amber-500/20' : 
                'bg-red-500/20'
              }`}>
                <CheckSquare className={`w-5 h-5 ${
                  confidence === 'high' ? 'text-emerald-600' : 
                  confidence === 'medium' ? 'text-amber-600' : 
                  'text-red-600'
                }`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${
                  confidence === 'high' ? 'text-emerald-600' : 
                  confidence === 'medium' ? 'text-amber-600' : 
                  'text-red-600'
                }`}>
                  {confidence === 'high' && 'Alta'}
                  {confidence === 'medium' && 'Média'}
                  {confidence === 'low' && 'Baixa'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sourcesWithResults} fontes
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Metodologia com Lista de Fontes */}
        {data.methodology && (
          <Card className="p-5 border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Metodologia de Verificação</h2>
              <Tooltip>
                <TooltipTrigger className="ml-auto">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">Busca automatizada em 17 fontes diferentes para garantir máxima cobertura</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-4 gap-3 mb-4">
              <Card className="p-3 bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-500/20 rounded">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Total de fontes analisadas</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {data.methodology.sources_checked || 0}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Fontes</p>
              </Card>

              <Card className="p-3 bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-500/20 rounded">
                    <Search className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Queries executadas em todas as fontes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold text-purple-600">
                  {data.methodology.total_searches || 0}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Buscas</p>
              </Card>

              <Card className="p-3 bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-green-500/20 rounded">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Evidências com double/triple matching encontradas</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {data.methodology.total_matches || 0}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Matches</p>
              </Card>

              <Card className="p-3 bg-orange-500/5 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-orange-500/20 rounded">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Duração total da análise</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  {executionMs}ms
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Tempo</p>
              </Card>
            </div>

            {/* Lista das 17 Fontes */}
            <Card className="p-4 bg-muted/30 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Fontes Analisadas ({data.methodology.sources_checked || 17})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {['LinkedIn', 'Google Search', 'Sites Corporativos', 'Marketplaces B2B', 'Portais de Notícias', 'Redes Sociais', 'GitHub', 'Stack Overflow', 'Medium', 'Blog TOTVS', 'Portal do Cliente', 'Case Studies', 'Vagas de Emprego', 'YouTube', 'SlideShare', 'Comunidades Tech', 'Fóruns Especializados'].map((source, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-card rounded border border-border/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-xs text-foreground">{source}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Card>
        )}

        {/* Evidências com Highlights e Ações */}
        {evidences && evidences.length > 0 ? (
          <Card className="p-5 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">Evidências com Matching</h2>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Trechos com double/triple matching (TOTVS + Produto + Empresa)
                      <br />Termos destacados para fácil identificação
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="text-xs">
                {evidences.length} {evidences.length === 1 ? 'evidência' : 'evidências'}
              </Badge>
            </div>

            <div className="space-y-3">
              {evidences.map((evidence: any, index: number) => {
                const matchLevel = evidence.matchLevel || 3;
                const matchType = evidence.matchType || (matchLevel >= 5 ? 'quintuple' : matchLevel >= 4 ? 'quadruple' : matchLevel >= 3 ? 'triple' : 'double');
                const text = evidence.text || evidence.snippet || '';
                const url = evidence.url || evidence.source || '#';
                const source = evidence.source_name || (url !== '#' ? new URL(url).hostname.replace('www.', '') : 'Web');
                const terms = evidence.terms || ['TOTVS'];
                
                return (
                  <Card 
                    key={index} 
                    className="p-4 border border-border hover:shadow-md transition-shadow bg-card"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      {/* Badge de Match */}
                      <Badge variant={
                        matchLevel === 5 ? "default" : 
                        matchLevel === 4 ? "secondary" : 
                        "outline"
                      }>
                        {matchLevel === 5 ? "⭐⭐⭐⭐⭐ Quintuple" : 
                         matchLevel === 4 ? "⭐⭐⭐⭐ Quadruple" : 
                         matchLevel === 3 ? "⭐⭐⭐ Triple" : "⭐⭐ Double"}
                      </Badge>
                      
                      {/* Fonte */}
                      <span className="text-sm text-muted-foreground">
                        {source}
                      </span>
                    </div>
                    
                    {/* Snippet */}
                    <div 
                      className="text-sm mt-2 mb-3 line-clamp-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightTerms(text, terms) 
                      }}
                    />
                    
                    {/* Botões */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => window.open(url, '_blank')}
                        disabled={url === '#'}
                      >
                        🔗 Ver Fonte
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          toast.success('URL copiada!');
                        }}
                        disabled={url === '#'}
                      >
                        📋
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(terms.join(', '));
                          toast.success('Termos copiados!');
                        }}
                      >
                        🔍
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center border-2 border-dashed">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">Nenhuma evidência encontrada.</p>
              <p className="text-sm">
                Clique em "Analisar" para buscar novamente.
              </p>
            </div>
          </Card>
        )}

        {/* Mensagem caso não haja evidências + sugestões rápidas */}
        {(!data.evidences || data.evidences.length === 0) && (
          <Card className="p-6 border border-dashed border-border space-y-4 text-center">
            <div>
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-semibold mb-1 text-foreground">Nenhuma evidência encontrada</h3>
              <p className="text-sm text-muted-foreground">A análise não encontrou evidências específicas. Tente as buscas abaixo:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-left">
              {fallbackLinks.map((link, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="justify-start h-9"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  {link.label}
                </Button>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Dica: use Ctrl+F e termos como "TOTVS", "Protheus", "RM", junto com {nameQuery || 'o nome da empresa'}.
            </p>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
