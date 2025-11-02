import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Target, Search, Filter, BarChart3, Clock, ExternalLink, Eye, RefreshCw } from 'lucide-react';

export default function STCHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);

  const { data: verifications, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['stc-history', statusFilter, confidenceFilter],
    queryFn: async () => {
      let query = supabase
        .from('stc_verification_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (confidenceFilter !== 'all') {
        query = query.eq('confidence', confidenceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: analytics } = useQuery({
    queryKey: ['stc-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stc_verification_history')
        .select('status, confidence, triple_matches, total_score');

      if (error) throw error;

      const byStatus: Record<string, number> = {};
      const byConfidence: Record<string, number> = {};
      let totalTripleMatches = 0;
      let avgScore = 0;

      data.forEach(item => {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        byConfidence[item.confidence] = (byConfidence[item.confidence] || 0) + 1;
        totalTripleMatches += item.triple_matches || 0;
        avgScore += item.total_score || 0;
      });

      return {
        total: data.length,
        byStatus,
        byConfidence,
        totalTripleMatches,
        avgScore: data.length > 0 ? Math.round(avgScore / data.length) : 0,
      };
    }
  });

  const filteredData = verifications?.filter(v =>
    v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.cnpj?.includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Histórico de Verificações STC
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro completo de todas as verificações TOTVS realizadas
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Verificações</p>
                  <p className="text-2xl font-bold">{analytics.total}</p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Por Status</p>
                <div className="space-y-1 text-xs">
                  {Object.entries(analytics.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="capitalize">{status}:</span>
                      <span className="font-mono font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Por Confiança</p>
                <div className="space-y-1 text-xs">
                  {Object.entries(analytics.byConfidence).map(([conf, count]) => (
                    <div key={conf} className="flex justify-between">
                      <span className="capitalize">{conf}:</span>
                      <span className="font-mono font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Triple Matches</p>
                  <p className="text-2xl font-bold">{analytics.totalTripleMatches}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="go">✅ GO</SelectItem>
                <SelectItem value="revisar">⚠️ Revisar</SelectItem>
                <SelectItem value="no-go">❌ NO-GO</SelectItem>
              </SelectContent>
            </Select>
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Confiança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Confianças</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Verificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Triple Matches</TableHead>
                <TableHead>Score Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell className="font-medium">{verification.company_name}</TableCell>
                    <TableCell>
                      {verification.cnpj && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {verification.cnpj}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          verification.status === 'go'
                            ? 'secondary'
                            : verification.status === 'revisar'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {verification.status === 'go' && '✅ GO'}
                        {verification.status === 'revisar' && '⚠️ Revisar'}
                        {verification.status === 'no-go' && '❌ NO-GO'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          verification.confidence === 'high'
                            ? 'default'
                            : verification.confidence === 'medium'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {verification.confidence === 'high' && 'Alta'}
                        {verification.confidence === 'medium' && 'Média'}
                        {verification.confidence === 'low' && 'Baixa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold">
                        {verification.triple_matches || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{verification.total_score || 0} pts</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(verification.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVerification(verification)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma verificação encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Detalhes da Verificação STC
            </DialogTitle>
            <DialogDescription>
              {selectedVerification?.company_name}
              {selectedVerification?.cnpj && ` - ${selectedVerification.cnpj}`}
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge
                      variant={
                        selectedVerification.status === 'go'
                          ? 'secondary'
                          : selectedVerification.status === 'revisar'
                          ? 'default'
                          : 'destructive'
                      }
                      className="text-base px-3 py-1"
                    >
                      {selectedVerification.status === 'go' && '✅ GO'}
                      {selectedVerification.status === 'revisar' && '⚠️ Revisar'}
                      {selectedVerification.status === 'no-go' && '❌ NO-GO'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Confiança</p>
                    <Badge
                      variant={
                        selectedVerification.confidence === 'high'
                          ? 'default'
                          : selectedVerification.confidence === 'medium'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="text-base px-3 py-1"
                    >
                      {selectedVerification.confidence === 'high' && 'Alta'}
                      {selectedVerification.confidence === 'medium' && 'Média'}
                      {selectedVerification.confidence === 'low' && 'Baixa'}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Métricas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Métricas da Verificação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Triple Matches</p>
                      <p className="text-2xl font-bold">{selectedVerification.triple_matches || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Double Matches</p>
                      <p className="text-2xl font-bold">{selectedVerification.double_matches || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Score Total</p>
                      <p className="text-2xl font-bold">{selectedVerification.total_score || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evidências */}
              {selectedVerification.evidences && selectedVerification.evidences.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Evidências ({selectedVerification.evidences.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedVerification.evidences.map((evidence: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge variant={evidence.match_type === 'triple' ? 'default' : 'secondary'}>
                            {evidence.match_type === 'triple' ? '🎯 TRIPLE' : '🔍 DOUBLE'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {evidence.weight} pts
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm">{evidence.title}</h4>
                        <p className="text-sm text-muted-foreground">{evidence.content}</p>
                        {evidence.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            asChild
                          >
                            <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ver Fonte
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Informações Técnicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações Técnicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fontes Consultadas:</span>
                      <span className="font-mono">{selectedVerification.sources_consulted || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Queries Executadas:</span>
                      <span className="font-mono">{selectedVerification.queries_executed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duração:</span>
                      <span className="font-mono">
                        {selectedVerification.verification_duration_ms
                          ? `${(selectedVerification.verification_duration_ms / 1000).toFixed(2)}s`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data da Verificação:</span>
                      <span className="font-mono">
                        {new Date(selectedVerification.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
