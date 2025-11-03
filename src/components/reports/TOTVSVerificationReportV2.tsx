import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';


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
  
  
  console.log('[TOTVS V2] 📊 Dados recebidos:', data);
  
  if (!data || !data.evidences) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Nenhum dado disponível. Clique em "Atualizar Análise" para gerar o relatório.</p>
      </Card>
    );
  }
  
  const evidences: Evidence[] = Array.isArray(data.evidences) ? data.evidences : [];
  const quintuple = evidences.filter(e => e.matchLevel === 5);
  const quadruple = evidences.filter(e => e.matchLevel === 4);
  const triple = evidences.filter(e => e.matchLevel === 3);
  const double = evidences.filter(e => e.matchLevel === 2);
  
  const totalScore = (quintuple.length * 5) + (quadruple.length * 4) + (triple.length * 3) + (double.length * 2);
  const confidence = quintuple.length > 0 ? 98 : quadruple.length > 2 ? 90 : triple.length > 5 ? 75 : evidences.length > 0 ? 50 : 0;
  const status = totalScore > 20 ? 'cliente_totvs' : 'nao_cliente_totvs';
  const temperatura = totalScore >= 30 ? 'hot' : totalScore >= 15 ? 'warm' : 'cold';
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };
  
  const evidencesToShow = evidences;
  
  return (
    <div className="space-y-4">
      {/* Status Card - Compacto */}
      <Card className="p-4 border">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status === 'cliente_totvs' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <span className="text-xl">{status === 'cliente_totvs' ? '✅' : '❌'}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {status === 'cliente_totvs' ? 'Cliente TOTVS Confirmado' : 'Não Qualificado'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Confiança: <span className={`font-semibold ${confidence >= 90 ? 'text-green-600' : confidence >= 75 ? 'text-yellow-600' : 'text-gray-600'}`}>{confidence}%</span>
                </span>
                <span>•</span>
                <span>Score: <span className="font-semibold">{totalScore} pts</span></span>
                <span>•</span>
                <span>{evidences.length} evidências</span>
              </div>
            </div>
          </div>
          <Badge 
            className={`text-xs px-3 py-1 ${
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
      
      {/* Distribuição de Evidências - Grid Compacto */}
      <Card className="p-4 border">
        <h4 className="text-sm font-semibold mb-3">📊 Distribuição de Evidências ({evidences.length} total)</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                5
              </div>
              <div>
                <div className="text-xs text-gray-600">Quintuple</div>
                <div className="text-lg font-bold text-purple-600">{quintuple.length}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">98%</div>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                4
              </div>
              <div>
                <div className="text-xs text-gray-600">Quadruple</div>
                <div className="text-lg font-bold text-blue-600">{quadruple.length}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">90%</div>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-white text-sm font-bold">
                3
              </div>
              <div>
                <div className="text-xs text-gray-600">Triple</div>
                <div className="text-lg font-bold text-green-600">{triple.length}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">75%</div>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-yellow-500 flex items-center justify-center text-white text-sm font-bold">
                2
              </div>
              <div>
                <div className="text-xs text-gray-600">Double</div>
                <div className="text-lg font-bold text-yellow-600">{double.length}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">50%</div>
          </div>
        </div>
      </Card>
      
      {/* Lista de Evidências - Tabela Compacta */}
      <Card className="p-4 border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">📋 Todas as {evidences.length} Evidências</h4>
        </div>
        
        <div className="divide-y max-h-[60vh] overflow-auto pr-1">
          {evidencesToShow.map((evidence, index) => (
            <div key={evidence.id} className="py-2 hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-xs h-5">{evidence.source}</Badge>
                    <Badge 
                      className={`text-xs h-5 text-white ${
                        evidence.matchLevel === 5 ? 'bg-purple-500' :
                        evidence.matchLevel === 4 ? 'bg-blue-500' :
                        evidence.matchLevel === 3 ? 'bg-green-500' :
                        'bg-yellow-500'
                      }`}
                    >
                      {evidence.matchLevel === 5 ? '🏆' : evidence.matchLevel === 4 ? '🔵' : evidence.matchLevel === 3 ? '🟢' : '🟡'} 
                      {evidence.matchLevel}pts
                    </Badge>
                    <span className="text-xs text-muted-foreground">{evidence.confidence}%</span>
                  </div>
                  
                  <p className="text-sm text-foreground line-clamp-2 mb-1">{evidence.snippet}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>Componentes: <span className="text-foreground">{evidence.components?.join(' + ')}</span></span>
                    {evidence.type && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{evidence.type}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs px-2"
                      onClick={() => window.open(evidence.url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs px-2"
                      onClick={() => copyToClipboard(evidence.url, 'Link')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs px-2"
                      onClick={() => toast.success('Funcionalidade em breve!')}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Pitch
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        
        {evidences.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Nenhuma evidência encontrada.</p>
            <p className="text-xs mt-1">Tente buscar manualmente ou aguarde nova análise.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
