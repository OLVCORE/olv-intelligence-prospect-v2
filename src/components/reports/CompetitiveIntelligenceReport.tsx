import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, AlertTriangle, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Competitor {
  name: string;
  matchLevel: number;
  evidences: any[];
  totalEvidences: number;
  status: 'active' | 'implemented';
}

interface CompetitiveIntelligenceReportProps {
  competitors: Competitor[];
}

export default function CompetitiveIntelligenceReport({ competitors }: CompetitiveIntelligenceReportProps) {
  console.log('[COMPETITIVE] 📊 Concorrentes recebidos:', competitors);
  
  if (!competitors || competitors.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Nenhum Sistema Concorrente Detectado</h3>
        <p className="text-muted-foreground">
          Ótima notícia! Esta empresa aparenta não utilizar sistemas ERP concorrentes.
        </p>
      </Card>
    );
  }
  
  const getOpportunityText = (competitorName: string) => {
    const opportunities: Record<string, string[]> = {
      'SAP': [
        'Propor substituição SAP → TOTVS (economia de 60%)',
        'Argumento: Dificuldade de contratar profissionais SAP no Brasil',
        'Gancho: Módulos equivalentes no Protheus com custo menor'
      ],
      'ORACLE': [
        'Propor integração TOTVS Winthor para Supply Chain',
        'Argumento: Unificar stack tecnológica e reduzir complexidade',
        'Gancho: Reduzir custos de licenciamento Oracle'
      ],
      'MICROSOFT': [
        'Propor migração Dynamics → TOTVS',
        'Argumento: Melhor suporte local + custo menor',
        'Gancho: Protheus é líder no mercado brasileiro'
      ]
    };
    
    return opportunities[competitorName] || [
      `Propor comparativo ${competitorName} vs TOTVS`,
      'Argumento: Melhor custo-benefício no mercado brasileiro',
      'Gancho: Suporte local e implementação especializada'
    ];
  };
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">🔍 Sistemas Concorrentes Detectados</h3>
            <p className="text-muted-foreground mt-1">
              {competitors.length} concorrente{competitors.length > 1 ? 's' : ''} identificado{competitors.length > 1 ? 's' : ''} - Oportunidades de venda destacadas
            </p>
          </div>
          <Badge variant="outline" className="text-base px-4 py-2">
            {competitors.length} Sistema{competitors.length > 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="space-y-6">
          {competitors.map((competitor, index) => (
            <Card key={competitor.name} className="p-6 border-2 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold text-muted-foreground">#{index + 1}</span>
                    <h4 className="text-2xl font-bold">{competitor.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      className={`text-white ${
                        competitor.matchLevel === 5 ? 'bg-purple-500' :
                        competitor.matchLevel === 4 ? 'bg-blue-500' :
                        competitor.matchLevel === 3 ? 'bg-green-500' :
                        'bg-yellow-500'
                      }`}
                    >
                      Match Level: {competitor.matchLevel}
                    </Badge>
                    <Badge 
                      variant={competitor.status === 'active' ? 'destructive' : 'secondary'}
                    >
                      {competitor.status === 'active' ? '🔥 ATIVO' : '🟢 IMPLEMENTADO'}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary">{competitor.totalEvidences}</div>
                  <div className="text-sm text-muted-foreground">evidências</div>
                </div>
              </div>
              
              {/* Oportunidade de Venda */}
              <Card className="p-4 mb-4 bg-yellow-50 border-2 border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-yellow-700" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-yellow-900 mb-2">🎯 OPORTUNIDADE DE VENDA:</h5>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      {getOpportunityText(competitor.name).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
              
              {/* Evidências */}
              {competitor.evidences && competitor.evidences.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Evidências ({competitor.evidences.length}):
                  </h5>
                  {competitor.evidences.slice(0, 3).map((evidence: any, idx: number) => (
                    <Card key={idx} className="p-3 bg-muted/50">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{evidence.source || 'Unknown'}</Badge>
                        {evidence.type && (
                          <span className="text-xs text-muted-foreground capitalize">{evidence.type}</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground line-clamp-2 mb-2">
                        {evidence.snippet || evidence.text || 'Sem descrição'}
                      </p>
                      {evidence.url && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-xs"
                          onClick={() => window.open(evidence.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ver fonte
                        </Button>
                      )}
                    </Card>
                  ))}
                  
                  {competitor.evidences.length > 3 && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => toast.info(`${competitor.evidences.length - 3} evidências adicionais disponíveis`)}
                    >
                      Ver todas as {competitor.evidences.length} evidências
                    </Button>
                  )}
                </div>
              )}
              
              {/* Ações */}
              <div className="mt-4 flex gap-2 flex-wrap">
                <Button 
                  className="gap-2"
                  onClick={() => toast.success('Funcionalidade em breve!')}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Gerar Pitch Anti-{competitor.name}
                </Button>
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => toast.success('Funcionalidade em breve!')}
                >
                  <Download className="w-4 h-4" />
                  Exportar Evidências
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
