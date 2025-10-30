import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  FileText,
  Search,
  Eye,
  Flame,
  Thermometer,
  Snowflake,
  BarChart3,
  Building2,
  MapPin,
  Clock,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ResultadoFinal {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  porte?: string;
  situacao_cadastral?: string;
  uf?: string;
  municipio?: string;
  cnae_principal?: string;
  faturamento_estimado?: string;
  funcionarios?: string;
  website?: string;
  email?: string;
  telefone?: string;
  icp_score: number;
  temperatura: 'hot' | 'warm' | 'cold';
  status: 'concluido' | 'erro';
  motivo?: string;
  erro?: string;
  evidencias?: any[];
  checkpoints: Array<{
    nome: string;
    status: string;
    tempo: number;
    detalhes?: string;
  }>;
  breakdown?: {
    localizacao?: number;
    porte?: number;
    cnae?: number;
    situacao?: number;
    tecnologia?: number;
  };
  tempo_processamento?: number;
}

interface FinalReportDashboardProps {
  resultados: ResultadoFinal[];
  tempoTotal: number;
  onNovaAnalise: () => void;
}

export default function FinalReportDashboard({ 
  resultados, 
  tempoTotal,
  onNovaAnalise 
}: FinalReportDashboardProps) {
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'aprovado' | 'descartado' | 'erro'>('todos');
  const [filtroTemperatura, setFiltroTemperatura] = useState<'todos' | 'hot' | 'warm' | 'cold'>('todos');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<ResultadoFinal | null>(null);

  // Estatísticas
  const total = resultados.length;
  const aprovados = resultados.filter(r => r.status === 'concluido' && !r.erro).length;
  const descartados = resultados.filter(r => r.motivo && r.motivo.includes('TOTVS')).length;
  const erros = resultados.filter(r => r.status === 'erro' || r.erro).length;
  
  const hot = resultados.filter(r => r.temperatura === 'hot').length;
  const warm = resultados.filter(r => r.temperatura === 'warm').length;
  const cold = resultados.filter(r => r.temperatura === 'cold').length;
  
  const scoreMedio = aprovados > 0
    ? resultados
        .filter(r => r.status === 'concluido' && !r.erro)
        .reduce((sum, r) => sum + r.icp_score, 0) / aprovados
    : 0;

  // Filtrar resultados
  const resultadosFiltrados = resultados.filter(r => {
    if (filtroStatus === 'aprovado' && (r.status !== 'concluido' || r.erro)) return false;
    if (filtroStatus === 'descartado' && (!r.motivo || !r.motivo.includes('TOTVS'))) return false;
    if (filtroStatus === 'erro' && r.status !== 'erro' && !r.erro) return false;
    if (filtroTemperatura !== 'todos' && r.temperatura !== filtroTemperatura) return false;
    if (buscaTexto && !r.razao_social.toLowerCase().includes(buscaTexto.toLowerCase()) &&
        !r.cnpj.includes(buscaTexto)) return false;
    return true;
  });

  // Exportar PDF Completo
  const exportarPDFCompleto = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(24);
    doc.setTextColor(0, 102, 204);
    doc.text('Relatório de Análise ICP em Massa', 20, y);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
    y += 7;
    doc.text(`Tempo total: ${Math.floor(tempoTotal/60)}min ${tempoTotal%60}s`, 20, y);
    y += 15;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumo Executivo', 20, y);
    y += 10;

    doc.setFontSize(12);
    const resumo = [
      `Total de empresas: ${total}`,
      `Aprovadas: ${aprovados} (${Math.round((aprovados/total)*100)}%)`,
      `Descartadas: ${descartados} (${Math.round((descartados/total)*100)}%)`,
      `Erros: ${erros} (${Math.round((erros/total)*100)}%)`,
      `Score médio: ${scoreMedio.toFixed(1)}/100`,
      '',
      'Distribuição por temperatura:',
      `  HOT: ${hot} (${Math.round((hot/total)*100)}%)`,
      `  WARM: ${warm} (${Math.round((warm/total)*100)}%)`,
      `  COLD: ${cold} (${Math.round((cold/total)*100)}%)`,
    ];

    resumo.forEach(linha => {
      doc.text(linha, 20, y);
      y += 7;
    });

    doc.save(`relatorio-icp-completo-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Exportar Excel
  const exportarExcel = () => {
    const dados = resultados.map(r => ({
      'CNPJ': r.cnpj,
      'Razão Social': r.razao_social,
      'Nome Fantasia': r.nome_fantasia || '',
      'Score ICP': r.icp_score,
      'Temperatura': r.temperatura,
      'Status': r.status === 'concluido' && !r.erro ? 'Aprovado' : r.erro ? 'Erro' : 'Descartado',
      'Motivo': r.motivo || r.erro || '',
      'UF': r.uf || '',
      'Município': r.municipio || '',
      'Porte': r.porte || '',
      'CNAE': r.cnae_principal || '',
      'Faturamento': r.faturamento_estimado || '',
      'Funcionários': r.funcionarios || '',
      'Website': r.website || '',
      'Email': r.email || '',
      'Telefone': r.telefone || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Análise ICP');
    XLSX.writeFile(wb, `analise-icp-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Exportar PDF Individual
  const exportarPDFIndividual = (resultado: ResultadoFinal) => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    doc.text('Relatório Individual - Análise ICP', 20, y);
    y += 15;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(resultado.razao_social, 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`CNPJ: ${resultado.cnpj}`, 20, y);
    y += 15;

    doc.setFontSize(16);
    doc.text('Score ICP', 20, y);
    y += 10;

    doc.setFontSize(36);
    const cor = resultado.icp_score >= 70 ? [220, 38, 38] :
                resultado.icp_score >= 40 ? [234, 179, 8] :
                [59, 130, 246];
    doc.setTextColor(cor[0], cor[1], cor[2]);
    doc.text(`${resultado.icp_score}/100`, 20, y);
    y += 15;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const temp = resultado.temperatura === 'hot' ? 'HOT' :
                 resultado.temperatura === 'warm' ? 'WARM' : 'COLD';
    doc.text(temp, 20, y);
    y += 15;

    if (resultado.breakdown) {
      doc.setFontSize(16);
      doc.text('Breakdown do Score', 20, y);
      y += 10;

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      Object.entries(resultado.breakdown).forEach(([key, value]) => {
        doc.text(`${key}: ${value} pontos`, 20, y);
        y += 7;
      });
    }

    doc.save(`icp-${resultado.cnpj.replace(/\D/g, '')}.pdf`);
  };

  const getTemperatureBadge = (temp: string) => {
    if (temp === 'hot') return (
      <Badge className="bg-red-500 text-white flex items-center gap-1">
        <Flame className="w-3 h-3" />
        HOT
      </Badge>
    );
    if (temp === 'warm') return (
      <Badge className="bg-yellow-500 text-white flex items-center gap-1">
        <Thermometer className="w-3 h-3" />
        WARM
      </Badge>
    );
    return (
      <Badge className="bg-blue-500 text-white flex items-center gap-1">
        <Snowflake className="w-3 h-3" />
        COLD
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Resumo Executivo */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Análise ICP em Massa - Concluída
            </h2>
            <p className="text-muted-foreground">
              Relatório completo e interativo com drill-down por empresa
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarPDFCompleto}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={exportarExcel}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button variant="default" onClick={() => window.location.href = '/leads/icp-quarantine'}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Ir para Quarentena ICP
            </Button>
            <Button onClick={onNovaAnalise}>
              Nova Análise
            </Button>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Resumo Executivo
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-3xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground">Total Analisadas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{aprovados}</div>
              <div className="text-sm text-muted-foreground">Aprovadas ({Math.round((aprovados/total)*100)}%)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">{descartados}</div>
              <div className="text-sm text-muted-foreground">Descartadas ({Math.round((descartados/total)*100)}%)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{scoreMedio.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Score Médio</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-background">
              <div className="flex items-center gap-3">
                <Flame className="w-8 h-8 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{hot}</div>
                  <div className="text-sm text-muted-foreground">HOT (70-100)</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-background">
              <div className="flex items-center gap-3">
                <Thermometer className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{warm}</div>
                  <div className="text-sm text-muted-foreground">WARM (40-69)</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-background">
              <div className="flex items-center gap-3">
                <Snowflake className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{cold}</div>
                  <div className="text-sm text-muted-foreground">COLD (0-39)</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Tempo total: {Math.floor(tempoTotal/60)}min {tempoTotal%60}s
          </div>
        </div>
      </Card>

      {/* Filtros e Busca */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por razão social ou CNPJ..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filtroStatus === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('todos')}
            >
              Todos ({total})
            </Button>
            <Button
              variant={filtroStatus === 'aprovado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('aprovado')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Aprovados ({aprovados})
            </Button>
            <Button
              variant={filtroStatus === 'descartado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('descartado')}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Descartados ({descartados})
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filtroTemperatura === 'hot' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroTemperatura(filtroTemperatura === 'hot' ? 'todos' : 'hot')}
            >
              <Flame className="w-4 h-4 mr-1" />
              HOT ({hot})
            </Button>
            <Button
              variant={filtroTemperatura === 'warm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroTemperatura(filtroTemperatura === 'warm' ? 'todos' : 'warm')}
            >
              <Thermometer className="w-4 h-4 mr-1" />
              WARM ({warm})
            </Button>
            <Button
              variant={filtroTemperatura === 'cold' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroTemperatura(filtroTemperatura === 'cold' ? 'todos' : 'cold')}
            >
              <Snowflake className="w-4 h-4 mr-1" />
              COLD ({cold})
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs: Aprovadas / Descartadas / Erros */}
      <Tabs defaultValue="aprovadas">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="aprovadas">
            <CheckCircle className="w-4 h-4 mr-2" />
            Aprovadas ({aprovados})
          </TabsTrigger>
          <TabsTrigger value="descartadas">
            <XCircle className="w-4 h-4 mr-2" />
            Descartadas ({descartados})
          </TabsTrigger>
          <TabsTrigger value="erros">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Erros ({erros})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Empresas Aprovadas */}
        <TabsContent value="aprovadas">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Score ICP</TableHead>
                  <TableHead>Temperatura</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Porte</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultadosFiltrados
                  .filter(r => r.status === 'concluido' && !r.erro)
                  .sort((a, b) => b.icp_score - a.icp_score)
                  .map((resultado, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{resultado.razao_social}</div>
                          <div className="text-sm text-muted-foreground font-mono">{resultado.cnpj}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{resultado.icp_score}/100</Badge>
                      </TableCell>
                      <TableCell>
                        {getTemperatureBadge(resultado.temperatura)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {resultado.municipio}/{resultado.uf}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{resultado.porte}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEmpresaSelecionada(resultado)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportarPDFIndividual(resultado)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab: Empresas Descartadas */}
        <TabsContent value="descartadas">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Evidências</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultadosFiltrados
                  .filter(r => r.motivo && r.motivo.includes('TOTVS'))
                  .map((resultado, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{resultado.razao_social}</div>
                          <div className="text-sm text-muted-foreground font-mono">{resultado.cnpj}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{resultado.motivo}</Badge>
                      </TableCell>
                      <TableCell>
                        {resultado.evidencias && resultado.evidencias.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEmpresaSelecionada(resultado)}
                          >
                            Ver {resultado.evidencias.length} evidência(s)
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem evidências</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEmpresaSelecionada(resultado)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab: Erros */}
        <TabsContent value="erros">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Checkpoint</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultadosFiltrados
                  .filter(r => r.status === 'erro' || r.erro)
                  .map((resultado, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{resultado.razao_social}</div>
                          <div className="text-sm text-muted-foreground font-mono">{resultado.cnpj}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-red-600">
                          {resultado.erro || resultado.motivo || 'Erro desconhecido'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {resultado.checkpoints?.find(c => c.status === 'erro')?.nome || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEmpresaSelecionada(resultado)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Detalhes da Empresa */}
      {empresaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">{empresaSelecionada.razao_social}</h3>
                <p className="text-muted-foreground font-mono">{empresaSelecionada.cnpj}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportarPDFIndividual(empresaSelecionada)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmpresaSelecionada(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Score ICP */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Score ICP</div>
                  <div className="text-5xl font-bold text-primary">
                    {empresaSelecionada.icp_score}/100
                  </div>
                </div>
                <div className="text-right">
                  {getTemperatureBadge(empresaSelecionada.temperatura)}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            {empresaSelecionada.breakdown && (
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-4">Breakdown do Score</h4>
                <div className="space-y-3">
                  {Object.entries(empresaSelecionada.breakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{key}</span>
                        <span className="font-semibold">{value} pontos</span>
                      </div>
                      <Progress value={(value / 30) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dados da Empresa */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Dados Cadastrais
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome Fantasia:</span>
                    <span className="font-medium">{empresaSelecionada.nome_fantasia || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Porte:</span>
                    <span className="font-medium">{empresaSelecionada.porte || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Situação:</span>
                    <span className="font-medium">{empresaSelecionada.situacao_cadastral || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CNAE:</span>
                    <span className="font-medium">{empresaSelecionada.cnae_principal || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Localização e Contato
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Município:</span>
                    <span className="font-medium">{empresaSelecionada.municipio || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UF:</span>
                    <span className="font-medium">{empresaSelecionada.uf || 'N/A'}</span>
                  </div>
                  {empresaSelecionada.website && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Website:</span>
                      <a 
                        href={`https://${empresaSelecionada.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {empresaSelecionada.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {empresaSelecionada.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{empresaSelecionada.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Checkpoints */}
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-4">Checkpoints de Processamento</h4>
              <div className="space-y-2">
                {empresaSelecionada.checkpoints?.map((checkpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {checkpoint.status === 'concluido' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {checkpoint.status === 'erro' && <XCircle className="w-5 h-5 text-red-500" />}
                      {checkpoint.status === 'processando' && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
                      {checkpoint.status === 'pendente' && <Clock className="w-5 h-5 text-muted-foreground/30" />}
                      <div>
                        <div className="font-medium">{checkpoint.nome}</div>
                        {checkpoint.detalhes && (
                          <div className="text-sm text-muted-foreground">{checkpoint.detalhes}</div>
                        )}
                      </div>
                    </div>
                    {checkpoint.tempo > 0 && (
                      <Badge variant="outline">
                        {(checkpoint.tempo / 1000).toFixed(1)}s
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Evidências (se descartado) */}
            {empresaSelecionada.evidencias && empresaSelecionada.evidencias.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-4 text-red-600">Evidências de Descarte</h4>
                <div className="space-y-2">
                  {empresaSelecionada.evidencias.map((evidencia: any, index: number) => (
                    <Card key={index} className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-red-800 dark:text-red-200">{evidencia.fonte}</div>
                          <div className="text-sm text-red-700 dark:text-red-300 mt-1">{evidencia.tipo}</div>
                          {evidencia.url && (
                            <a 
                              href={evidencia.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                            >
                              Ver evidência
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
