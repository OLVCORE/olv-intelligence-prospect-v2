import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText,
  Download,
  ArrowRight,
  ArrowLeft,
  Database,
  Globe,
  Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PreAnalysisData {
  total_empresas: number;
  cnpjs_validos: number;
  cnpjs_invalidos: number;
  emails_validos: number;
  telefones_validos: number;
  websites_validos: number;
  duplicatas: number;
  campos_vazios: Record<string, number>;
  score_qualidade: number;
  fontes_disponiveis: Array<{
    nome: string;
    status: 'online' | 'offline' | 'lento';
    tempo_resposta: number;
  }>;
  estimativa_tempo: number;
  estimativa_creditos: number;
  taxa_sucesso_esperada: number;
}

interface PreAnalysisReportProps {
  data: PreAnalysisData;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PreAnalysisReport({ data, onConfirm, onCancel }: PreAnalysisReportProps) {
  
  const exportarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Relatório Prévio - Análise ICP em Massa', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    doc.text(`Total de empresas: ${data.total_empresas}`, 20, 40);
    
    doc.setFontSize(16);
    doc.text('Qualidade dos Dados', 20, 55);
    
    doc.setFontSize(12);
    doc.text(`CNPJs válidos: ${data.cnpjs_validos}/${data.total_empresas} (${Math.round((data.cnpjs_validos/data.total_empresas)*100)}%)`, 20, 65);
    doc.text(`Emails válidos: ${data.emails_validos}/${data.total_empresas} (${Math.round((data.emails_validos/data.total_empresas)*100)}%)`, 20, 75);
    doc.text(`Score de qualidade: ${data.score_qualidade}/100`, 20, 85);
    
    doc.setFontSize(16);
    doc.text('Estimativas', 20, 100);
    
    doc.setFontSize(12);
    doc.text(`Tempo estimado: ${Math.floor(data.estimativa_tempo/60)}min ${data.estimativa_tempo%60}s`, 20, 110);
    doc.text(`Taxa de sucesso esperada: ${data.taxa_sucesso_esperada}%`, 20, 120);
    
    doc.save(`relatorio-previo-icp-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-primary" />
              Relatório Prévio - Análise ICP em Massa
            </h2>
            <p className="text-muted-foreground">
              Análise de qualidade e viabilidade antes do processamento
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Este é apenas um relatório prévio. Clique em "Confirmar e Iniciar Análise" abaixo para executar o processamento real.
            </p>
          </div>
          <Button variant="outline" onClick={exportarPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Score de Qualidade */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Score de Qualidade dos Dados</div>
              <div className="text-4xl font-bold text-primary">{data.score_qualidade}/100</div>
            </div>
            <div className={`text-6xl ${
              data.score_qualidade >= 80 ? 'text-green-500' :
              data.score_qualidade >= 60 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {data.score_qualidade >= 80 ? (
                <CheckCircle className="w-16 h-16" />
              ) : data.score_qualidade >= 60 ? (
                <AlertTriangle className="w-16 h-16" />
              ) : (
                <XCircle className="w-16 h-16" />
              )}
            </div>
          </div>
          <Progress value={data.score_qualidade} className="h-3" />
          <div className="text-sm text-muted-foreground mt-2">
            {data.score_qualidade >= 80 ? 'Excelente qualidade - Pronto para processar' :
             data.score_qualidade >= 60 ? 'Qualidade aceitável - Alguns dados podem falhar' :
             'Qualidade baixa - Recomendamos revisar os dados'}
          </div>
        </div>

        {/* Estatísticas de Validação */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{data.total_empresas}</div>
                <div className="text-sm text-muted-foreground">Total de Empresas</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              {data.cnpjs_validos === data.total_empresas ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
              <div>
                <div className="text-2xl font-bold">
                  {data.cnpjs_validos}/{data.total_empresas}
                </div>
                <div className="text-sm text-muted-foreground">CNPJs Válidos</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {data.fontes_disponiveis.filter(f => f.status === 'online').length}/
                  {data.fontes_disponiveis.length}
                </div>
                <div className="text-sm text-muted-foreground">Fontes Online</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Math.floor(data.estimativa_tempo/60)}min
                </div>
                <div className="text-sm text-muted-foreground">Tempo Estimado</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detalhamento de Validação */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Qualidade dos Dados */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Qualidade dos Dados
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">CNPJs válidos</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(data.cnpjs_validos/data.total_empresas)*100} 
                    className="w-24 h-2" 
                  />
                  <Badge variant={data.cnpjs_validos === data.total_empresas ? 'default' : 'secondary'}>
                    {Math.round((data.cnpjs_validos/data.total_empresas)*100)}%
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Emails válidos</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(data.emails_validos/data.total_empresas)*100} 
                    className="w-24 h-2" 
                  />
                  <Badge variant="secondary">
                    {Math.round((data.emails_validos/data.total_empresas)*100)}%
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Telefones válidos</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(data.telefones_validos/data.total_empresas)*100} 
                    className="w-24 h-2" 
                  />
                  <Badge variant="secondary">
                    {Math.round((data.telefones_validos/data.total_empresas)*100)}%
                  </Badge>
                </div>
              </div>

              {data.duplicatas > 0 && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Duplicatas detectadas
                  </span>
                  <Badge variant="destructive">{data.duplicatas}</Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Fontes de Dados */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Fontes de Dados Disponíveis
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.fontes_disponiveis.map((fonte, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                  <div className="flex items-center gap-2">
                    {fonte.status === 'online' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : fonte.status === 'lento' ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">{fonte.nome}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{fonte.tempo_resposta}ms</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Estimativas */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 mb-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Estimativas de Processamento
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tempo Estimado</div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(data.estimativa_tempo/60)}min {data.estimativa_tempo%60}s
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ~{Math.round(data.estimativa_tempo/data.total_empresas)}s por empresa
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Créditos Estimados</div>
              <div className="text-2xl font-bold text-blue-600">
                {data.estimativa_creditos}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ~{Math.round(data.estimativa_creditos/data.total_empresas)} por empresa
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Taxa de Sucesso Esperada</div>
              <div className="text-2xl font-bold text-blue-600">
                {data.taxa_sucesso_esperada}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ~{Math.round((data.taxa_sucesso_esperada/100)*data.total_empresas)} empresas
              </div>
            </div>
          </div>
        </Card>

        {/* Alertas */}
        {(data.cnpjs_invalidos > 0 || data.duplicatas > 0 || data.score_qualidade < 60) && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900 mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="w-5 h-5" />
              Atenção - Problemas Detectados
            </h3>
            <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
              {data.cnpjs_invalidos > 0 && (
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5" />
                  <span>{data.cnpjs_invalidos} CNPJ(s) inválido(s) serão ignorados</span>
                </li>
              )}
              {data.duplicatas > 0 && (
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <span>{data.duplicatas} duplicata(s) detectada(s) - serão mescladas</span>
                </li>
              )}
              {data.score_qualidade < 60 && (
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <span>Qualidade dos dados abaixo do ideal - alguns processamentos podem falhar</span>
                </li>
              )}
            </ul>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar e Revisar Dados
          </Button>
          <Button onClick={onConfirm} size="lg">
            <ArrowRight className="w-4 h-4 mr-2" />
            Confirmar e Iniciar Análise
          </Button>
        </div>
      </Card>
    </div>
  );
}
