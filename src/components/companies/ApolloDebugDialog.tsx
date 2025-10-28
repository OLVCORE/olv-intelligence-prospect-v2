import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApolloDebugDialogProps {
  companyId: string;
  companyName: string;
  apolloOrgId?: string;
  domain?: string;
}

export function ApolloDebugDialog({ companyId, companyName, apolloOrgId, domain }: ApolloDebugDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      // 1. Verificar decisores atuais
      const { data: currentDecisors } = await supabase
        .from('decision_makers')
        .select('*')
        .eq('company_id', companyId);

      // 2. Tentar buscar no Apollo novamente
      const { data: apolloData, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'enrich_company',
          companyId,
          organizationName: companyName,
          ...(apolloOrgId ? { apolloOrgId } : {}),
          ...(domain ? { domain } : {})
        }
      });

      if (error) {
        throw error;
      }

      // 3. Buscar logs recentes
      const { data: company } = await supabase
        .from('companies')
        .select('apollo_id, apollo_last_enriched_at, apollo_metadata')
        .eq('id', companyId)
        .single();

      setDebugInfo({
        currentDecisors: currentDecisors || [],
        apolloResponse: apolloData,
        companyApolloData: company,
        timestamp: new Date().toISOString()
      });

      toast.success('Diagnóstico concluído');
    } catch (e: any) {
      toast.error('Erro no diagnóstico', { description: e.message });
      setDebugInfo({ error: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="h-4 w-4" />
          Diagnóstico Apollo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Diagnóstico de Enriquecimento Apollo</DialogTitle>
          <DialogDescription>
            Empresa: {companyName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button 
            onClick={runDiagnostic} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Executando diagnóstico...
              </>
            ) : (
              'Executar Diagnóstico Completo'
            )}
          </Button>

          {debugInfo && (
            <ScrollArea className="h-[500px] border rounded-lg p-4">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </ScrollArea>
          )}

          {debugInfo && (
            <div className="space-y-2 text-sm">
              <div className="font-semibold">Resumo:</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="border rounded p-2">
                  <div className="text-muted-foreground text-xs">Antes no Banco</div>
                  <div className="text-xl font-bold">{debugInfo.currentDecisors?.length || 0}</div>
                </div>
                <div className="border rounded p-2 bg-primary/5">
                  <div className="text-muted-foreground text-xs">Apollo Retornou</div>
                  <div className="text-xl font-bold text-primary">{debugInfo.apolloResponse?.people_count || 0}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-muted-foreground text-xs">Apollo ID</div>
                  <div className="text-xs font-mono">{debugInfo.companyApolloData?.apollo_id || 'N/A'}</div>
                </div>
              </div>
              
              {debugInfo.error && (
                <div className="border-destructive border rounded p-3 bg-destructive/10">
                  <div className="font-semibold text-destructive">Erro:</div>
                  <div>{debugInfo.error}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
