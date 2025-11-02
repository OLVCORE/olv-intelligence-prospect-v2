import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSimpleTOTVSCheck } from '@/hooks/useSimpleTOTVSCheck';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SimilarCompaniesTab } from '@/components/intelligence/SimilarCompaniesTab';
import { Analysis360Tab } from '@/components/intelligence/Analysis360Tab';
import { toast } from 'sonner';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  Clock,
  Copy,
  Check,
  Building2,
  BarChart3,
  Search,
  Target,
  Flame,
  Package,
  Sparkles,
  Circle
} from 'lucide-react';

interface TOTVSCheckCardProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  autoVerify?: boolean;
  onResult?: (result: any) => void;
}

export default function TOTVSCheckCard({
  companyId,
  companyName,
  cnpj,
  domain,
  autoVerify = false,
  onResult,
}: TOTVSCheckCardProps) {
  const [enabled, setEnabled] = useState(autoVerify);
  const [filterMode, setFilterMode] = useState<'all' | 'triple'>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedTerms, setCopiedTerms] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string, type: 'url' | 'terms') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(id);
        setTimeout(() => setCopiedUrl(null), 2000);
      } else {
        setCopiedTerms(id);
        setTimeout(() => setCopiedTerms(null), 2000);
      }
      toast.success(type === 'url' ? 'URL copiada!' : 'Termos copiados!');
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  const highlightTerms = (text: string, products?: string[]) => {
    if (!text) return text;
    
    let highlighted = text;
    const terms: string[] = [];
    
    // Adicionar variações do nome da empresa
    if (companyName) {
      const variations = [companyName];
      const words = companyName.split(' ').filter(w => w.length > 3);
      if (words.length >= 2) {
        variations.push(words.slice(0, 2).join(' '));
      }
      terms.push(...variations);
    }
    
    // Adicionar "TOTVS"
    terms.push('TOTVS');
    
    // Adicionar produtos detectados
    if (products && products.length > 0) {
      terms.push(...products);
    }
    
    // Highlight cada termo
    terms.forEach(term => {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold">$1</mark>');
    });
    
    return highlighted;
  };

  const { data, isLoading, refetch } = useSimpleTOTVSCheck({
    companyId,
    companyName,
    cnpj,
    domain,
    enabled,
  });

  // Buscar dados de empresas similares para análise 360° (removido - será buscado direto na aba)
  const similarCompaniesData = null;

  useEffect(() => {
    if (onResult && data) onResult(data);
  }, [data, onResult]);

  const handleVerify = () => {
    setEnabled(true);
    refetch();
  };

  // ESTADO INICIAL
  if (!enabled && !data) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Verificação TOTVS
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Verificar se a empresa é cliente TOTVS
          </p>
          <Button onClick={handleVerify}>
            <Sparkles className="w-4 h-4 mr-2" />
            Verificar Agora
          </Button>
        </div>
      </Card>
    );
  }

  // LOADING
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Buscando evidências em múltiplas fontes...
          </p>
          <p className="text-xs text-muted-foreground">
            Isso pode levar 20-30 segundos
          </p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const evidences = data.evidences || [];
  const tripleMatches = evidences.filter((e: any) => e.match_type === 'triple');
  const doubleMatches = evidences.filter((e: any) => e.match_type === 'double');
  
  const filteredEvidences = filterMode === 'triple' ? tripleMatches : evidences;

  return (
    <Card className="p-6">
      <Tabs defaultValue="detection" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="detection" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Detecção TOTVS
          </TabsTrigger>
          <TabsTrigger value="similar" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Empresas Similares
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Análise 360°
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: DETECÇÃO TOTVS (CONTEÚDO ATUAL) */}
        <TabsContent value="detection" className="mt-0 max-h-[600px] overflow-y-auto">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {data.status === 'go' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {data.status === 'revisar' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                {data.status === 'no-go' && <XCircle className="w-5 h-5 text-red-600" />}
                Verificação TOTVS
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {data.from_cache ? (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Cache (24h)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Verificação nova
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {data.methodology?.execution_time}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleVerify}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* STATUS */}
          <div className="mb-4">
            <Badge 
              variant={
                data.status === 'go' ? 'default' :
                data.status === 'revisar' ? 'secondary' :
                'destructive'
              }
              className="text-base px-4 py-2 flex items-center gap-2"
            >
              {data.status === 'go' && (
                <>
                  <CheckCircle className="w-4 h-4" />
                  GO - Não é cliente TOTVS
                </>
              )}
              {data.status === 'revisar' && (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  REVISAR - Evidências encontradas
                </>
              )}
              {data.status === 'no-go' && (
                <>
                  <XCircle className="w-4 h-4" />
                  NO-GO - Cliente TOTVS confirmado
                </>
              )}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Confiança: <strong>{data.confidence === 'high' ? 'Alta' : data.confidence === 'medium' ? 'Média' : 'Baixa'}</strong>
              {' | '}
              Peso total: <strong>{data.total_weight} pontos</strong>
            </p>
            
            {/* DEBUG INFO */}
            <div className="text-xs text-muted-foreground mt-3 p-3 bg-muted/30 rounded-md border border-border/50">
              <strong className="text-foreground">Debug:</strong>{' '}
              {data.triple_matches || 0} triple matches |{' '}
              {data.double_matches || 0} double matches |{' '}
              {data.evidences?.length || 0} evidências |{' '}
              {data.methodology?.total_queries || 0} queries executadas
            </div>
          </div>

          {/* FILTROS */}
          {evidences.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={filterMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode('all')}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Triple + Double
                </Button>
                <Button
                  variant={filterMode === 'triple' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode('triple')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Apenas Triple
                </Button>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Circle className="w-3 h-3 fill-green-600 text-green-600" />
                  {tripleMatches.length} Triple
                </span>
                <span className="flex items-center gap-1">
                  <Circle className="w-3 h-3 fill-blue-600 text-blue-600" />
                  {doubleMatches.length} Double
                </span>
              </div>
            </div>
          )}

          {/* EVIDÊNCIAS */}
          {filteredEvidences.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredEvidences.map((evidence: any, index: number) => {
                const evidenceId = `${evidence.source}-${index}`;
                const allTerms = [
                  companyName || '',
                  'TOTVS',
                  ...(evidence.detected_products || []),
                  ...(evidence.intent_keywords || [])
                ].filter(Boolean).join(' | ');
                
                return (
                  <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant={evidence.match_type === 'triple' ? 'default' : 'secondary'} className="text-sm flex items-center gap-1">
                        {evidence.match_type === 'triple' ? (
                          <>
                            <Target className="w-3 h-3" />
                            TRIPLE MATCH
                          </>
                        ) : (
                          <>
                            <Search className="w-3 h-3" />
                            DOUBLE MATCH
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {evidence.source_name || evidence.source} ({evidence.weight} pts)
                      </Badge>
                    </div>
                    
                    {/* INTENÇÃO DE COMPRA */}
                    {evidence.has_intent && evidence.intent_keywords?.length > 0 && (
                      <div className="mb-3 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                        <Badge variant="destructive" className="text-xs mb-1 flex items-center gap-1 w-fit">
                          <Flame className="w-3 h-3" />
                          INTENÇÃO DE COMPRA DETECTADA
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          <strong>Keywords:</strong> {evidence.intent_keywords.join(', ')}
                        </div>
                      </div>
                    )}
                    
                    {/* TÍTULO COM HIGHLIGHT */}
                    <h4 
                      className="text-sm font-semibold mb-2" 
                      dangerouslySetInnerHTML={{ 
                        __html: highlightTerms(evidence.title, evidence.detected_products) 
                      }}
                    />
                    
                    {/* CONTEÚDO COM HIGHLIGHT */}
                    <p 
                      className="text-sm text-muted-foreground mb-3"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightTerms(evidence.content, evidence.detected_products) 
                      }}
                    />
                    
                    {/* PRODUTOS DETECTADOS */}
                    {evidence.detected_products?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3 items-center">
                        <span className="text-xs font-medium mr-2">Produtos:</span>
                        {evidence.detected_products.map((product: string) => (
                          <Badge key={product} variant="outline" className="text-xs flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {product}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* BOTÕES DE AÇÃO */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => copyToClipboard(evidence.url, evidenceId, 'url')}
                      >
                        {copiedUrl === evidenceId ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar URL
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => copyToClipboard(allTerms, evidenceId, 'terms')}
                      >
                        {copiedTerms === evidenceId ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar Termos
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs h-7"
                        asChild
                      >
                        <a
                          href={evidence.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ver Fonte
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma evidência de uso de TOTVS encontrada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.methodology?.searched_sources} fontes consultadas
              </p>
            </div>
          )}

          {/* METODOLOGIA */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Fontes consultadas: {data.methodology?.searched_sources} | 
              Queries executadas: {data.methodology?.total_queries}
            </p>
          </div>
        </TabsContent>

        {/* ABA 2: EMPRESAS SIMILARES (NOVO) */}
        <TabsContent value="similar" className="mt-0 max-h-[600px] overflow-y-auto">
          {companyId && companyName ? (
            <SimilarCompaniesTab
              companyId={companyId}
              companyName={companyName}
              cnpj={cnpj}
            />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Informações da empresa necessárias para buscar similares
              </p>
            </Card>
          )}
        </TabsContent>

        {/* ABA 3: ANÁLISE 360° (NOVO) */}
        <TabsContent value="analysis" className="mt-0 max-h-[600px] overflow-y-auto">
          {companyId && companyName ? (
            <Analysis360Tab
              companyId={companyId}
              companyName={companyName}
              stcResult={data}
              similarCompanies={similarCompaniesData}
            />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Informações da empresa necessárias para análise 360°
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
