import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Phone, 
  Calendar, 
  Eye, 
  Ban, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { useCreateDeal } from "@/hooks/useDeals";
import { toast } from "sonner";
import { useState } from "react";

interface QualificationRecommendationProps {
  company: {
    id: string;
    name: string;
    totvs_detection_score?: number;
  };
  intentScore: number;
}

export function QualificationRecommendation({ 
  company, 
  intentScore 
}: QualificationRecommendationProps) {
  const { mutate: createDeal, isPending } = useCreateDeal();
  const [dealCreated, setDealCreated] = useState(false);
  
  const totvsScore = company.totvs_detection_score || 0;

  // Lógica de recomendação
  const getRecommendation = () => {
    // 1. TOTVS >= 70: Desqualificar
    if (totvsScore >= 70) {
      return {
        action: "disqualify",
        title: "⛔ NÃO PROSSEGUIR - Empresa Desqualificada",
        description: "Alta probabilidade de já usar TOTVS. Recomendamos não investir tempo neste lead.",
        color: "destructive",
        icon: Ban,
        priority: "low" as const,
        stage: "disqualified",
        buttonLabel: "Marcar como Desqualificado",
        buttonVariant: "destructive" as const,
        steps: [
          "Não fazer contato comercial",
          "Mover para lista de empresas TOTVS",
          "Considerar apenas se empresa demonstrar insatisfação"
        ]
      };
    }

    // 2. TOTVS < 70 + Intent >= 70: HOT LEAD!
    if (totvsScore < 70 && intentScore >= 70) {
      return {
        action: "contact_now",
        title: "🔥 CONTATO IMEDIATO - HOT LEAD!",
        description: "Momento perfeito para prospecção! Empresa qualificada e com alta intenção de compra.",
        color: "success",
        icon: Phone,
        priority: "urgent" as const,
        stage: "qualification",
        buttonLabel: "Adicionar ao Pipeline (Urgente)",
        buttonVariant: "default" as const,
        steps: [
          "Ligar HOJE ou nas próximas 24h",
          "Mencionar sinais detectados (expansão, vagas, investimento)",
          "Preparar case de ROI personalizado",
          "Agendar demo executiva em até 3 dias"
        ]
      };
    }

    // 3. TOTVS < 70 + Intent 40-69: Qualificado
    if (totvsScore < 70 && intentScore >= 40) {
      return {
        action: "schedule",
        title: "✅ QUALIFICADO - Agendar Contato",
        description: "Lead qualificado com sinais moderados. Recomendamos abordagem estruturada.",
        color: "primary",
        icon: Calendar,
        priority: "high" as const,
        stage: "prospecting",
        buttonLabel: "Adicionar ao Pipeline",
        buttonVariant: "default" as const,
        steps: [
          "Agendar ligação em até 5 dias úteis",
          "Pesquisar mais sobre a empresa antes do contato",
          "Preparar pitch com foco nas dores identificadas",
          "Enviar material introdutório por email"
        ]
      };
    }

    // 4. TOTVS < 70 + Intent < 40: Monitorar
    return {
      action: "monitor",
      title: "👀 MONITORAR - Aguardar Mais Sinais",
      description: "Lead válido mas sem urgência. Recomendamos nurturing e monitoramento contínuo.",
      color: "secondary",
      icon: Eye,
      priority: "medium" as const,
      stage: "lead",
      buttonLabel: "Adicionar à Lista de Nurturing",
      buttonVariant: "outline" as const,
      steps: [
        "Adicionar à campanha de nurturing automatizada",
        "Monitorar sinais mensalmente (re-rodar detecção)",
        "Compartilhar conteúdo educativo",
        "Aguardar momento mais favorável"
      ]
    };
  };

  const recommendation = getRecommendation();

  const handleAddToPipeline = () => {
    const dealTitle = `[${recommendation.action === 'contact_now' ? 'HOT 🔥' : 'Qualificado'}] ${company.name}`;
    const dealDescription = `Lead qualificado via IA:\n- Score TOTVS: ${totvsScore}/100\n- Score Intenção: ${intentScore}/100\n- Recomendação: ${recommendation.title}\n\nPróximos passos:\n${recommendation.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    createDeal({
      title: dealTitle,
      description: dealDescription,
      company_id: company.id,
      stage: recommendation.stage,
      priority: recommendation.priority,
      value: 0, // Será definido pelo vendedor
    }, {
      onSuccess: () => {
        setDealCreated(true);
        toast.success('Deal criado com sucesso!', {
          description: `${company.name} foi adicionado ao pipeline com prioridade ${recommendation.priority}`,
        });
      }
    });
  };

  const IconComponent = recommendation.icon;
  const alertVariant = recommendation.action === "disqualify" ? "destructive" : "default";

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Recomendação Inteligente da IA
        </CardTitle>
        <CardDescription>
          Análise combinada: TOTVS Score ({totvsScore}) + Intent Score ({intentScore})
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert variant={alertVariant} className="border-2">
          <IconComponent className="h-5 w-5" />
          <AlertDescription>
            <p className="font-bold text-base mb-1">{recommendation.title}</p>
            <p className="text-sm">{recommendation.description}</p>
          </AlertDescription>
        </Alert>

        {/* Scores Visual */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground mb-1">TOTVS Detection</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{totvsScore}</span>
              <Badge variant={totvsScore >= 70 ? "destructive" : totvsScore >= 30 ? "outline" : "secondary"}>
                {totvsScore >= 70 ? "Alto" : totvsScore >= 30 ? "Médio" : "Baixo"}
              </Badge>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground mb-1">Intent Score</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{intentScore}</span>
              <Badge variant={intentScore >= 70 ? "default" : intentScore >= 40 ? "secondary" : "outline"}>
                {intentScore >= 70 ? "Hot" : intentScore >= 40 ? "Warm" : "Cold"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Steps */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Próximos Passos Recomendados:
          </p>
          <ol className="space-y-2">
            {recommendation.steps.map((step, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="font-bold text-primary min-w-[20px]">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA Button */}
        {!dealCreated ? (
          <Button
            onClick={handleAddToPipeline}
            disabled={isPending}
            variant={recommendation.buttonVariant}
            size="lg"
            className="w-full"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            {isPending ? 'Adicionando...' : recommendation.buttonLabel}
          </Button>
        ) : (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Deal criado com sucesso!</strong>
              <p className="text-xs mt-1">
                {company.name} foi adicionado ao pipeline. Acesse o SDR Dashboard para gerenciar.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Metadata */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Esta recomendação é baseada em análise preditiva
            </span>
            <Badge variant="outline" className="text-xs">
              Prioridade: {recommendation.priority}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
