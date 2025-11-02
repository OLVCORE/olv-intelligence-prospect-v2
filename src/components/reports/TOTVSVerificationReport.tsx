import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, CheckCircle, XCircle, ExternalLink, AlertTriangle, Globe, Search, Clock, CheckSquare, Info } from 'lucide-react';

interface TOTVSVerificationReportProps {
  data: any;
  companyName: string;
  cnpj?: string;
}

export default function TOTVSVerificationReport({ data, companyName, cnpj }: TOTVSVerificationReportProps) {
  console.log('[TOTVS REPORT] 📊 Dados recebidos:', data);
  console.log('[TOTVS REPORT] 📊 Metodologia:', data?.methodology);
  console.log('[TOTVS REPORT] 📊 Evidências:', data?.evidences);

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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Compacto */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-background border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Verificação TOTVS</h1>
              <p className="text-sm text-muted-foreground">{companyName}</p>
            </div>
          </div>
          {cnpj && (
            <div className="mt-3 text-xs font-mono text-muted-foreground">
              CNPJ: {cnpj}
            </div>
          )}
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
                  {data.methodology?.sources_with_results || 0} fontes
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Metodologia Compacta */}
        {data.methodology && (
          <Card className="p-5 border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Metodologia de Verificação</h2>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground ml-auto" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">Busca em 17 fontes: LinkedIn, Google, Sites corporativos, Marketplaces, Portais de notícias, etc.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <Card className="p-4 bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-500/20 rounded">
                    <Globe className="w-4 h-4 text-blue-600" />
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
                <p className="text-2xl font-bold text-blue-600">
                  {data.methodology.sources_checked || 0}
                </p>
                <p className="text-xs text-muted-foreground uppercase">Fontes</p>
              </Card>

              <Card className="p-4 bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-500/20 rounded">
                    <Search className="w-4 h-4 text-purple-600" />
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
                <p className="text-2xl font-bold text-purple-600">
                  {data.methodology.total_searches || 0}
                </p>
                <p className="text-xs text-muted-foreground uppercase">Buscas</p>
              </Card>

              <Card className="p-4 bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-green-500/20 rounded">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Referências positivas encontradas</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {data.methodology.total_matches || 0}
                </p>
                <p className="text-xs text-muted-foreground uppercase">Matches</p>
              </Card>

              <Card className="p-4 bg-orange-500/5 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-orange-500/20 rounded">
                    <Clock className="w-4 h-4 text-orange-600" />
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
                <p className="text-2xl font-bold text-orange-600">
                  {data.methodology.execution_time_ms || 0}ms
                </p>
                <p className="text-xs text-muted-foreground uppercase">Tempo</p>
              </Card>
            </div>
          </Card>
        )}

        {/* Evidências Compactas */}
        {data.evidences && data.evidences.length > 0 && (
          <Card className="p-5 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Evidências</h2>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Trechos específicos encontrados nas fontes consultadas</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="text-xs">
                {data.evidences.length} {data.evidences.length === 1 ? 'evidência' : 'evidências'}
              </Badge>
            </div>

            <div className="space-y-3">
              {data.evidences.map((evidence: any, index: number) => (
                <Card 
                  key={index} 
                  className="p-4 border border-border hover:border-primary/30 transition-colors bg-card/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-sm leading-relaxed text-foreground">
                        {evidence.text}
                      </p>
                      {evidence.source && (
                        <a 
                          href={evidence.source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver fonte
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Mensagem caso não haja evidências */}
        {(!data.evidences || data.evidences.length === 0) && (
          <Card className="p-8 text-center border border-dashed border-border">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1 text-foreground">Nenhuma evidência encontrada</h3>
            <p className="text-sm text-muted-foreground">A análise não encontrou evidências específicas</p>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
