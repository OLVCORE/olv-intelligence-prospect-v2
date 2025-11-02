import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface Evidence {
  id: string;
  source: string;
  type: string;
  title: string;
  snippet: string;
  url: string;
  matchLevel: 2 | 3 | 4 | 5;
  components: string[];
  confidence: number;
  timestamp: string;
}

interface TOTVSVerificationReportProps {
  data: any;
  companyName: string;
  cnpj?: string;
}

export default function TOTVSVerificationReportV2({ data, companyName, cnpj }: TOTVSVerificationReportProps) {
  const [showAllEvidences, setShowAllEvidences] = useState(false);
  
  console.log('[TOTVS V2] 📊 Dados recebidos:', data);
  
  if (!data || !data.evidences) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>Nenhum dado disponível. Clique em "Atualizar Análise" para gerar o relatório.</p>
      </Card>
    );
  }
  
  const evidences: Evidence[] = Array.isArray(data.evidences) ? data.evidences : [];
  const quintuple = evidences.filter(e => e.matchLevel === 5);
  const quadruple = evidences.filter(e => e.matchLevel === 4);
  const triple = evidences.filter(e => e.matchLevel === 3);
  const double = evidences.filter(e => e.matchLevel === 2);
  
  const totalScore = data.totalScore || ((quintuple.length * 5) + (quadruple.length * 4) + (triple.length * 3) + (double.length * 2));
  const confidence = data.confidence || (quintuple.length > 0 ? 98 : quadruple.length > 2 ? 90 : triple.length > 5 ? 75 : 50);
  const status = data.status || (totalScore > 20 ? 'cliente_totvs' : 'nao_cliente_totvs');
  const temperatura = totalScore >= 30 ? 'hot' : totalScore >= 15 ? 'warm' : 'cold';
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };
  
  const evidencesToShow = showAllEvidences ? evidences : evidences.slice(0, 5);
  
  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="p-6 border-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-2xl font-bold mb-2">
              {status === 'cliente_totvs' ? '✅ Cliente TOTVS Confirmado' : '❌ Não Qualificado'}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Confiança: <span className="font-bold text-foreground">{confidence}%</span></span>
              <span>•</span>
              <span>Score: <span className="font-bold text-foreground">{totalScore} pontos</span></span>
              <span>•</span>
              <span>Evidências: <span className="font-bold text-foreground">{evidences.length}</span></span>
            </div>
          </div>
          
          <Badge 
            className={`px-6 py-3 text-base font-bold ${
              temperatura === 'hot' ? 'bg-red-500 hover:bg-red-600' :
              temperatura === 'warm' ? 'bg-yellow-500 hover:bg-yellow-600' :
              'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {temperatura === 'hot' ? '🔥 LEAD QUENTE' :
             temperatura === 'warm' ? '🟡 LEAD MORNO' :
             '🔵 LEAD FRIO'}
          </Badge>
        </div>
      </Card>
      
      {/* Distribuição de Evidências */}
      <Card className="p-6">
        <h4 className="text-lg font-bold mb-4">📊 Distribuição de Evidências ({evidences.length} total)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="text-4xl font-bold text-purple-600 mb-1">{quintuple.length}</div>
            <div className="text-sm font-semibold text-purple-700 mb-1">🏆 Quintuple (5 pts)</div>
            <div className="text-xs text-muted-foreground">Confiança 98%</div>
          </div>
          
          <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="text-4xl font-bold text-blue-600 mb-1">{quadruple.length}</div>
            <div className="text-sm font-semibold text-blue-700 mb-1">🔵 Quadruple (4 pts)</div>
            <div className="text-xs text-muted-foreground">Confiança 90%</div>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="text-4xl font-bold text-green-600 mb-1">{triple.length}</div>
            <div className="text-sm font-semibold text-green-700 mb-1">🟢 Triple (3 pts)</div>
            <div className="text-xs text-muted-foreground">Confiança 75%</div>
          </div>
          
          <div className="text-center p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <div className="text-4xl font-bold text-yellow-600 mb-1">{double.length}</div>
            <div className="text-sm font-semibold text-yellow-700 mb-1">🟡 Double (2 pts)</div>
            <div className="text-xs text-muted-foreground">Confiança 50%</div>
          </div>
        </div>
      </Card>
      
      {/* Top Evidências */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">
            {showAllEvidences ? `📋 Todas as ${evidences.length} Evidências` : '🏆 Top 5 Evidências Mais Fortes'}
          </h4>
          {evidences.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllEvidences(!showAllEvidences)}
            >
              {showAllEvidences ? 'Ver Top 5' : `Ver Todas (${evidences.length})`}
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {evidencesToShow.map((evidence, index) => (
            <Card key={evidence.id} className="p-4 hover:shadow-lg transition-shadow border-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                    <Badge variant="secondary" className="text-xs">{evidence.source}</Badge>
                    <Badge 
                      className={`text-xs text-white ${
                        evidence.matchLevel === 5 ? 'bg-purple-500' :
                        evidence.matchLevel === 4 ? 'bg-blue-500' :
                        evidence.matchLevel === 3 ? 'bg-green-500' :
                        'bg-yellow-500'
                      }`}
                    >
                      {evidence.matchLevel === 5 ? '🏆 QUINTUPLE' :
                       evidence.matchLevel === 4 ? '🔵 QUADRUPLE' :
                       evidence.matchLevel === 3 ? '🟢 TRIPLE' :
                       '🟡 DOUBLE'}
                    </Badge>
                  </div>
                  
                  <h5 className="font-semibold mb-2 line-clamp-2">{evidence.title || 'Sem título'}</h5>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{evidence.snippet}</p>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="font-medium">
                      Componentes: <span className="text-foreground">{evidence.components?.join(' + ')}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Confiança: <span className="text-foreground font-medium">{evidence.confidence}%</span>
                    </span>
                    {evidence.type && (
                      <>
                        <span>•</span>
                        <span>
                          Tipo: <span className="text-foreground capitalize">{evidence.type}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2 flex-wrap">
                <Button 
                  size="sm"
                  onClick={() => window.open(evidence.url, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver Fonte
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(evidence.url, 'Link')}
                  className="gap-2"
                >
                  <Copy className="w-3 h-3" />
                  Copiar Link
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => toast.success('Funcionalidade em breve!')}
                >
                  <Plus className="w-3 h-3" />
                  Adicionar ao Pitch
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        {!showAllEvidences && evidences.length > 5 && (
          <Button 
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowAllEvidences(true)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Ver Todas as {evidences.length} Evidências
          </Button>
        )}
        
        {evidences.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma evidência encontrada.</p>
            <p className="text-sm mt-2">Tente buscar manualmente ou aguarde nova análise.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
