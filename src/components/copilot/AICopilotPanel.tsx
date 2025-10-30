import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, X, ChevronRight, AlertCircle, TrendingUp, Zap, Lightbulb } from 'lucide-react';
import { useCopilotAlerts, CopilotSuggestion } from '@/hooks/useAICopilot';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

const ICON_MAP = {
  action: Zap,
  alert: AlertCircle,
  opportunity: TrendingUp,
  warning: AlertCircle,
  insight: Lightbulb
};

const PRIORITY_COLORS = {
  urgent: 'destructive',
  high: 'default',
  medium: 'secondary',
  low: 'outline'
} as const;

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa'
};

export function AICopilotPanel() {
  const [isMinimized, setIsMinimized] = useState(false);
  const { suggestions, isLoading, executeSuggestion, dismissSuggestion } = useCopilotAlerts();

  if (isMinimized) {
    return (
      <Card className="fixed bottom-24 right-6 w-16 h-16 cursor-pointer hover:shadow-lg transition-shadow z-40">
        <CardContent 
          className="p-0 h-full flex items-center justify-center"
          onClick={() => setIsMinimized(false)}
        >
          <div className="relative">
            <Sparkles className="h-6 w-6 text-primary" />
            {suggestions.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {suggestions.length}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-6 right-[29rem] w-96 max-h-[600px] shadow-xl z-40 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Copilot</CardTitle>
            {suggestions.length > 0 && (
              <Badge variant={PRIORITY_COLORS[suggestions[0].priority]}>
                {suggestions.length}
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Tudo certo por aqui! 🎉
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O Copilot está monitorando suas atividades
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onExecute={() => executeSuggestion(suggestion)}
                  onDismiss={() => dismissSuggestion(suggestion.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface SuggestionCardProps {
  suggestion: CopilotSuggestion;
  onExecute: () => void;
  onDismiss: () => void;
}

function SuggestionCard({ suggestion, onExecute, onDismiss }: SuggestionCardProps) {
  const Icon = ICON_MAP[suggestion.type];
  const navigate = useNavigate();
  
  const handleCompanyClick = () => {
    if (suggestion.metadata?.companyId) {
      navigate(`/company/${suggestion.metadata.companyId}`);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-primary/10`}>
            <Icon className="h-4 w-4 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-sm leading-tight">
                {suggestion.title}
              </h4>
              <Badge 
                variant={PRIORITY_COLORS[suggestion.priority]}
                className="text-xs shrink-0"
              >
                {PRIORITY_LABELS[suggestion.priority] || suggestion.priority}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">
              {suggestion.description}
            </p>

            {/* Info da empresa se disponível */}
            {(suggestion.metadata?.companyName || suggestion.metadata?.cnpj) && (
              <div className="mb-2">
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleCompanyClick}
                  className="h-auto p-0 text-xs font-medium hover:underline"
                >
                  🏢 {suggestion.metadata.companyName || suggestion.metadata.cnpj}
                </Button>
                {suggestion.metadata.cnpj && suggestion.metadata.companyName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    CNPJ: {suggestion.metadata.cnpj}
                  </p>
                )}
              </div>
            )}

            {suggestion.metadata?.score !== undefined && (
              <div className="mb-2">
                <Badge 
                  variant={suggestion.metadata.score >= 70 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  Score: {suggestion.metadata.score}/100
                </Badge>
              </div>
            )}

            {suggestion.metadata?.confidence && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Confiança</span>
                  <span className="font-medium">{Math.round(suggestion.metadata.confidence * 100)}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${suggestion.metadata.confidence * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {suggestion.action && (
                <Button 
                  size="sm" 
                  onClick={onExecute}
                  className="text-xs"
                >
                  {suggestion.action.label}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onDismiss}
                className="text-xs"
              >
                Descartar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
