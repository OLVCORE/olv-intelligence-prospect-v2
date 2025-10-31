import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, Database, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { EvidenceDialog } from './EvidenceDialog';
import { useTOTVSDetectionReports } from '@/hooks/useTOTVSDetectionReports';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TOTVSDetectionCardV3Props {
  companyId: string;
  companyName: string;
}

export const TOTVSDetectionCardV3 = ({ companyId, companyName }: TOTVSDetectionCardV3Props) => {
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: reports, isLoading } = useTOTVSDetectionReports(companyId);
  const latestReport = reports?.[0];

  const getStatusBadge = (status: string, score: number) => {
    if (score >= 70) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Cliente TOTVS Detectado
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Qualificado
      </Badge>
    );
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    };
    return (
      <Badge variant={variants[confidence] || 'secondary'}>
        Confiança: {confidence}
      </Badge>
    );
  };

  const handleCategoryClick = (category: string, evidences: any[]) => {
    if (evidences.length > 0) {
      setSelectedCategory(category);
      setDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!latestReport) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Nenhuma análise TOTVS disponível para {companyName}
        </p>
      </Card>
    );
  }

  const methodology = latestReport.methodology || {};
  const evidencesByPlatform = (latestReport.evidences || []).reduce((acc: any, ev: any) => {
    if (!acc[ev.platform]) acc[ev.platform] = [];
    acc[ev.platform].push(ev);
    return acc;
  }, {});

  return (
    <>
      <Card className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Detecção TOTVS - Relatório V5</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(latestReport.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(latestReport.detection_status, latestReport.score)}
            {getConfidenceBadge(latestReport.confidence)}
          </div>
        </div>

        {/* Score Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-primary/20">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Score Final</p>
              <p className="text-3xl font-bold text-primary">{latestReport.score}/100</p>
            </div>
          </Card>
          
          <Card className="p-4 border-border">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fontes Pesquisadas</p>
              <p className="text-2xl font-semibold">{latestReport.sources_checked}</p>
            </div>
          </Card>
          
          <Card className="p-4 border-border">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Evidências Encontradas</p>
              <p className="text-2xl font-semibold text-green-600">{latestReport.evidences.length}</p>
            </div>
          </Card>
        </div>

        {/* Methodology Collapsible */}
        <Collapsible open={methodologyOpen} onOpenChange={setMethodologyOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Ver Metodologia Completa
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${methodologyOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4 space-y-4">
            <div className="border rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Fontes Consultadas</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium">{methodology.total_sources_checked || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Com resultados: </span>
                    <span className="font-medium text-green-600">
                      {methodology.sources_with_results?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories with Click */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Categorias de Evidências</h4>
                <div className="space-y-2">
                  {Object.keys(evidencesByPlatform).map((platform) => (
                    <Button
                      key={platform}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between h-auto py-3 px-4"
                      onClick={() => handleCategoryClick(platform, evidencesByPlatform[platform])}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{platform}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {evidencesByPlatform[platform].length} evidência(s)
                        </span>
                      </div>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Formula */}
              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-medium text-sm">Fórmula de Cálculo</h4>
                <p className="text-xs text-muted-foreground">
                  {methodology.calculation_formula || 'Score = Σ(pontos das evidências)'}
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Historical Reports Link */}
        {reports && reports.length > 1 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {reports.length - 1} análise(s) anterior(es) disponível(is)
            </p>
          </div>
        )}
      </Card>

      {/* Evidence Dialog */}
      {selectedCategory && (
        <EvidenceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={selectedCategory}
          evidences={evidencesByPlatform[selectedCategory] || []}
        />
      )}
    </>
  );
};
