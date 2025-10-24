import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Phone, Mail, Calendar, FileText, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';

interface DealQuickActionsProps {
  deal: any;
}

interface AISuggestion {
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'research';
}

export function DealQuickActions({ deal }: DealQuickActionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    generateSuggestions();
  }, [deal.id]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      // Rule-based suggestions (enquanto IA completa não está pronta)
      const suggestions: AISuggestion[] = [];
      const daysInStage = differenceInDays(new Date(), new Date(deal.created_at));
      const daysToClose = deal.expected_close_date 
        ? differenceInDays(new Date(deal.expected_close_date), new Date())
        : null;

      // Sugestões baseadas no estágio
      if (deal.stage === 'prospecting') {
        suggestions.push({
          action: 'Agendar call de descoberta',
          reason: 'Próximo passo natural: entender dores e necessidades',
          priority: 'high',
          type: 'call'
        });
        suggestions.push({
          action: 'Enviar email de apresentação',
          reason: 'Estabelecer primeiro contato e gerar interesse',
          priority: 'medium',
          type: 'email'
        });
      }

      if (deal.stage === 'discovery') {
        suggestions.push({
          action: 'Agendar demo personalizada',
          reason: 'Demonstrar solução alinhada com necessidades identificadas',
          priority: 'high',
          type: 'meeting'
        });
        if (daysInStage > 5) {
          suggestions.push({
            action: 'Follow-up urgente',
            reason: `Deal há ${daysInStage} dias em descoberta - acelerar processo`,
            priority: 'high',
            type: 'call'
          });
        }
      }

      if (deal.stage === 'proposal') {
        suggestions.push({
          action: 'Gerar proposta comercial',
          reason: 'Formalizar oferta com ROI e Business Case',
          priority: 'high',
          type: 'proposal'
        });
        suggestions.push({
          action: 'Envolver decisor C-level',
          reason: 'Necessário alinhamento executivo para aprovação',
          priority: 'medium',
          type: 'meeting'
        });
      }

      if (deal.stage === 'negotiation') {
        suggestions.push({
          action: 'Agendar reunião de fechamento',
          reason: 'Esclarecer últimas dúvidas e finalizar termos',
          priority: 'high',
          type: 'meeting'
        });
        if (daysToClose !== null && daysToClose < 7) {
          suggestions.push({
            action: 'Aceleração urgente - SLA próximo',
            reason: `Apenas ${daysToClose} dias até data prevista de fechamento`,
            priority: 'high',
            type: 'call'
          });
        }
      }

      // Sugestões baseadas em inatividade
      if (daysInStage > 7) {
        suggestions.push({
          action: 'Reativar deal parado',
          reason: `Deal sem movimento há ${daysInStage} dias - risco de perda`,
          priority: 'high',
          type: 'call'
        });
      }

      // Sugestões baseadas em fit score
      if (deal.company?.digital_maturity_score && deal.company.digital_maturity_score < 40) {
        suggestions.push({
          action: 'Reforçar valor de transformação digital',
          reason: 'Empresa com baixa maturidade digital - oportunidade educacional',
          priority: 'medium',
          type: 'research'
        });
      }

      setSuggestions(suggestions);
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      case 'proposal': return FileText;
      case 'research': return Lightbulb;
      default: return Sparkles;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
        <p className="text-sm text-muted-foreground">Analisando deal e gerando sugestões...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">IA Co-Pilot</h3>
        </div>
        <Button size="sm" variant="outline" onClick={generateSuggestions}>
          <Sparkles className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma sugestão no momento. Deal está no caminho certo! ✅
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => {
            const Icon = getActionIcon(suggestion.type);
            return (
              <Card key={idx} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm">{suggestion.action}</h4>
                      <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs">
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                    <Button size="sm" className="w-full mt-2">
                      Executar ação
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-3 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
        <p className="text-xs text-muted-foreground text-center">
          💡 Sugestões baseadas em estágio, tempo, fit score e melhores práticas de vendas
        </p>
      </Card>
    </div>
  );
}
