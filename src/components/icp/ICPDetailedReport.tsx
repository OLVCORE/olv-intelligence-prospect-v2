import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, CheckCircle, XCircle, Clock, TrendingUp, Database, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ICPDetailedReportProps {
  analysisId: string;
  companyName?: string;
  cnpj?: string;
}

export default function ICPDetailedReport({ analysisId, companyName, cnpj }: ICPDetailedReportProps) {
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [analysisId]);

  const carregarDados = async () => {
    try {
      // Buscar evidências
      const { data: evidData, error: evidError } = await supabase
        .from('icp_evidence')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('pontos_atribuidos', { ascending: false });

      if (evidError) throw evidError;
      setEvidencias(evidData || []);

      // Buscar logs
      const { data: logData, error: logError } = await supabase
        .from('icp_scraping_log')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('scraped_at');

      if (logError) throw logError;
      setLogs(logData || []);
      
    } catch (error) {
      console.error('[RELATÓRIO] Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <Clock className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Carregando relatório detalhado...</p>
        </div>
      </div>
    );
  }

  const totalPlataformas = logs.length;
  const sucessos = logs.filter(l => l.status === 'sucesso').length;
  const erros = logs.filter(l => l.status === 'erro').length;
  const timeouts = logs.filter(l => l.status === 'timeout').length;
  const dadosEncontrados = logs.filter(l => l.dados_encontrados).length;
  const tempoMedio = Math.round(logs.reduce((acc, l) => acc + (l.tempo_resposta_ms || 0), 0) / logs.length);

  // Agrupar evidências por categoria
  const evidenciasPorCategoria = evidencias.reduce((acc: any, ev) => {
    const cat = ev.categoria || 'outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ev);
    return acc;
  }, {});

  const categoriaLabels: Record<string, string> = {
    'tecnologia': 'Tecnologia',
    'tamanho': 'Tamanho da Empresa',
    'financeiro': 'Financeiro',
    'digital': 'Presença Digital',
    'reputacao': 'Reputação',
    'sinais_compra': 'Sinais de Compra',
    'outros': 'Outros',
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Relatório Detalhado de Análise ICP</h2>
            {companyName && <p className="text-lg font-medium text-muted-foreground">{companyName}</p>}
            {cnpj && <p className="text-sm text-muted-foreground">CNPJ: {cnpj}</p>}
          </div>
        </div>
      </Card>

      {/* ESTATÍSTICAS GERAIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <Database className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{totalPlataformas}</div>
            <div className="text-xs text-muted-foreground">Plataformas Consultadas</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{sucessos}</div>
            <div className="text-xs text-muted-foreground">Consultas com Sucesso</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{dadosEncontrados}</div>
            <div className="text-xs text-muted-foreground">Dados Encontrados</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">{tempoMedio}ms</div>
            <div className="text-xs text-muted-foreground">Tempo Médio</div>
          </div>
        </Card>
      </div>

      {/* EVIDÊNCIAS ENCONTRADAS POR CATEGORIA */}
      {evidencias.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Evidências Encontradas ({evidencias.length})
          </h3>
          
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {Object.entries(evidenciasPorCategoria).map(([categoria, items]: [string, any]) => (
                <div key={categoria} className="space-y-3">
                  <h4 className="font-semibold text-lg border-b pb-2">
                    {categoriaLabels[categoria] || categoria}
                    <Badge variant="secondary" className="ml-2">{items.length}</Badge>
                  </h4>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Critério</TableHead>
                        <TableHead>Evidência</TableHead>
                        <TableHead className="w-[180px]">Fonte</TableHead>
                        <TableHead className="w-[100px] text-center">Pontos</TableHead>
                        <TableHead className="w-[120px] text-center">Confiança</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((ev: any) => (
                        <TableRow key={ev.id}>
                          <TableCell className="font-medium">{ev.criterio}</TableCell>
                          <TableCell className="text-sm">{ev.evidencia}</TableCell>
                          <TableCell>
                            <a 
                              href={ev.fonte_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                            >
                              {ev.fonte_nome}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default" className="font-mono">{ev.pontos_atribuidos} pts</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={
                                ev.confiabilidade === 'alta' ? 'default' : 
                                ev.confiabilidade === 'media' ? 'secondary' : 
                                'outline'
                              }
                            >
                              {ev.confiabilidade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma Evidência Encontrada</h3>
          <p className="text-sm text-muted-foreground">
            A análise foi executada mas não encontrou evidências documentáveis nas plataformas consultadas.
          </p>
        </Card>
      )}

      {/* LOG DE PLATAFORMAS */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Plataformas Consultadas ({logs.length})
        </h3>
        
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Plataforma</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[140px] text-center">Dados Encontrados</TableHead>
                <TableHead className="w-[100px] text-right">Tempo</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className={log.status === 'sucesso' ? 'bg-green-50/50 dark:bg-green-950/10' : ''}>
                  <TableCell className="font-medium">{log.plataforma}</TableCell>
                  <TableCell>
                    {log.status === 'sucesso' ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sucesso
                      </Badge>
                    ) : log.status === 'timeout' ? (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Timeout
                      </Badge>
                    ) : log.status === 'bloqueado' ? (
                      <Badge variant="outline" className="border-orange-500 text-orange-600">
                        <XCircle className="w-3 h-3 mr-1" />
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Erro
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.dados_encontrados ? (
                      <Badge variant="default" className="bg-blue-600">✓ Sim</Badge>
                    ) : (
                      <span className="text-muted-foreground">— Não</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {log.tempo_resposta_ms}ms
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.erro_mensagem || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* ESTATÍSTICAS DE ERRO */}
      {(erros > 0 || timeouts > 0) && (
        <Card className="p-6 bg-orange-50/50 dark:bg-orange-950/10 border-orange-200 dark:border-orange-800">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <XCircle className="h-5 w-5" />
            Problemas Detectados
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Erros HTTP:</span>
              <span className="ml-2 font-semibold text-orange-700 dark:text-orange-400">{erros}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Timeouts:</span>
              <span className="ml-2 font-semibold text-orange-700 dark:text-orange-400">{timeouts}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Algumas plataformas podem ter bloqueado requisições automatizadas ou estar temporariamente indisponíveis.
          </p>
        </Card>
      )}
    </div>
  );
}
