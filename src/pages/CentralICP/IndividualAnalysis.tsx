import { useState } from 'react';
import { FileText, ArrowLeft, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompanySelectDialog } from "@/components/common/CompanySelectDialog";
import { TOTVSDetectionCardV3 } from "@/components/competitive/TOTVSDetectionCardV3";
import { IntentSignalsCardV3 } from "@/components/competitive/IntentSignalsCardV3";
import { QualificationRecommendation } from "@/components/competitive/QualificationRecommendation";
import { useCalculateIntentScore } from "@/hooks/useIntentSignals";

export default function IndividualAnalysis() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('company');
  const [showCompanySelector, setShowCompanySelector] = useState(!companyId);

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!companyId,
  });

  const { data: intentScore = 0 } = useCalculateIntentScore(companyId || undefined);

  const { data: intentSignals } = useQuery({
    queryKey: ['intent-signals', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('intent_signals')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const hasIntentCheck = (intentSignals?.length ?? 0) > 0;

  const handleSelectCompany = (ids: string[]) => {
    const newCompanyId = ids[0];
    navigate(`/central-icp/individual?company=${newCompanyId}`);
    setShowCompanySelector(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-green-600" />
            Análise Individual
          </h1>
          <p className="text-muted-foreground">
            Qualifique empresas uma por vez com análise detalhada ICP
          </p>
        </div>
        {company && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompanySelector(true)}
          >
            Trocar Empresa
          </Button>
        )}
      </div>

      <CompanySelectDialog
        open={showCompanySelector}
        onOpenChange={setShowCompanySelector}
        mode="single"
        title="Selecione uma Empresa para Analisar"
        confirmLabel="Analisar"
        onConfirm={handleSelectCompany}
      />

      {/* Company Selector Alert */}
      {!companyId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Selecione uma empresa para iniciar a análise ICP individual</span>
            <Button size="sm" onClick={() => setShowCompanySelector(true)}>
              <Target className="mr-2 h-4 w-4" />
              Selecionar Empresa
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Company Info */}
      {company && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{company.name}</CardTitle>
                <CardDescription>
                  {company.cnpj && `CNPJ: ${company.cnpj} • `}
                  {company.domain || company.city}
                  {company.state && ` • ${company.state}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {company && (
        <>
          {/* Instrução de uso */}
          <Alert className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <Target className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-bold text-base">📋 Como Gerar a Análise 360° com IA</p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li><strong>ETAPA 1:</strong> Execute a "Detecção de Uso de TOTVS" no card abaixo</li>
                  <li><strong>ETAPA 2:</strong> Execute a "Detecção de Sinais de Intenção" no card abaixo</li>
                  <li><strong>ETAPA 3:</strong> Role a página até o final e clique no botão "Gerar Qualificação 360° Powered by IA"</li>
                </ol>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
                  <AlertCircle className="h-3 w-3" />
                  <span>⚡ O relatório completo de análise 360° está localizado no final desta página</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Critérios de Qualificação */}
          <Alert className="bg-muted/50">
            <Target className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Estratégia de Qualificação ICP</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li><strong>Detecção TOTVS:</strong> Score &ge; 70 = Desqualificar (já usa TOTVS)</li>
                <li><strong>Sinais de Intenção:</strong> Score &ge; 70 = HOT LEAD (prospectar agora!)</li>
                <li><strong>Combinação Ideal:</strong> TOTVS &lt; 70 + Intenção &ge; 70 = PROSPECT NOW!</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Análise Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <TOTVSDetectionCardV3 
              company={{
                id: company.id,
                name: company.name,
                cnpj: company.cnpj,
                domain: company.domain,
                state: company.state,
                city: company.city,
                sector_code: company.sector_code,
                niche_code: company.niche_code,
              }}
            />
            <IntentSignalsCardV3 company={company} />
          </div>

          {/* AI Recommendation */}
          <QualificationRecommendation 
            company={company}
            intentScore={intentScore}
            hasIntentCheck={hasIntentCheck}
          />
        </>
      )}
    </div>
  );
}
