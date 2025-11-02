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
  
  const totalActiveCompetitors = competitors.filter(c => c.status === 'active').length;
  const totalEvidences = competitors.reduce((sum, c) => sum + c.totalEvidences, 0);
  
  return (
    <div className="space-y-4">
      <Card className="p-4 border">
        <div className="border-b pb-3 mb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">🔍 Inteligência Competitiva</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {competitors.length} sistema{competitors.length > 1 ? 's' : ''} concorrente{competitors.length > 1 ? 's' : ''} detectado{competitors.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs h-5">
                {totalActiveCompetitors} ativo{totalActiveCompetitors !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="text-xs h-5">
                {totalEvidences} evidências
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="divide-y">
          {competitors.map((competitor, index) => (
            <div key={competitor.name} className="py-3 hover:bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded bg-red-100 flex items-center justify-center text-sm font-bold text-red-600">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{competitor.name}</h4>
                      <Badge 
                        variant={competitor.status === 'active' ? 'destructive' : 'secondary'}
                        className="text-xs h-5"
                      >
                        {competitor.status === 'active' ? '🔥 Ativo' : '✓ Implementado'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Match: <span className="font-semibold">{competitor.matchLevel}/5</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {competitor.totalEvidences} evidências
                      </span>
                    </div>
                  </div>

                  {/* Oportunidade Compacta */}
                  <div className="bg-yellow-50 border-l-2 border-yellow-400 p-2 mb-2">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-yellow-800">
                        <span className="font-semibold">Oportunidade:</span> {getOpportunityText(competitor.name)[0]}
                      </div>
                    </div>
                  </div>

                  {/* Evidências Inline */}
                  {competitor.evidences && competitor.evidences.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {competitor.evidences.slice(0, 3).map((evidence: any, idx: number) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => window.open(evidence.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {evidence.source || 'Fonte'}
                        </Button>
                      ))}
                      {competitor.evidences.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{competitor.evidences.length - 3} mais
                        </span>
                      )}
                    </div>
                  )}

                  {/* Ações Inline */}
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="h-7 text-xs"
                      onClick={() => toast.success('Funcionalidade em breve!')}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Gerar Pitch
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs"
                      onClick={() => toast.success('Funcionalidade em breve!')}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
