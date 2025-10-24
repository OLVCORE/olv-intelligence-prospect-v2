import { useState } from 'react';
import { Trash2, AlertTriangle, Database, CheckCircle, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function DataMigrationPage() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  
  const loadStats = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-legacy-data', {
        body: { action: 'get_stats' }
      });
      
      if (error) throw error;
      
      if (data?.counts) {
        setStats(data.counts);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as estatísticas",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleanup = async () => {
    if (confirmPhrase !== 'LIMPAR TUDO') {
      toast({
        title: "Confirmação necessária",
        description: "Digite 'LIMPAR TUDO' para confirmar",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-legacy-data', {
        body: { action: 'cleanup' }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: "🎉 Limpeza concluída!",
          description: `${data.totalDeleted} registros removidos. Sistema 100% limpo!`,
        });
        
        setConfirmPhrase('');
        await loadStats();
      } else {
        throw new Error('Falha na limpeza');
      }
      
    } catch (error) {
      console.error('Erro na limpeza:', error);
      toast({
        title: "Erro na limpeza",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao limpar os dados",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Migração de Dados</h1>
          <p className="text-muted-foreground">Limpeza de análises antigas e preparação para o novo sistema</p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ATENÇÃO: Operação Irreversível</AlertTitle>
          <AlertDescription>
            Esta operação irá deletar permanentemente todas as análises antigas (governance, maturity, financial, legal, etc.).
            As empresas e decision makers serão mantidos, apenas as análises serão removidas.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Estatísticas do Banco de Dados
            </CardTitle>
            <CardDescription>
              Visualize quantos registros antigos serão removidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loadStats} variant="outline" className="w-full">
              Carregar Estatísticas
            </Button>
            
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(stats).map(([table, count]) => (
                  <div key={table} className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium capitalize">{table.replace(/_/g, ' ')}</span>
                    <Badge variant={count as number > 0 ? "default" : "secondary"}>
                      {count as number} registros
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Limpar Análises Antigas
            </CardTitle>
            <CardDescription>
              Remove todas as análises antigas do sistema. Empresas e decision makers serão preservados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Digite <span className="font-bold text-destructive">LIMPAR TUDO</span> para confirmar:
              </label>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="LIMPAR TUDO"
              />
            </div>
            
            <Button
              onClick={handleCleanup}
              disabled={isProcessing || confirmPhrase !== 'LIMPAR TUDO'}
              variant="destructive"
              className="w-full"
            >
              {isProcessing ? (
                <>Processando...</>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Executar Limpeza Completa
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>O que será mantido?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Empresas (companies)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Decision Makers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Buyer Personas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Account Strategies (novo sistema)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Business Cases (novo sistema)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>O que será removido?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Governance Signals (análises antigas)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Digital Maturity (análises antigas)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Digital Presence (análises antigas)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Financial Data (análises antigas)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Legal Data (análises antigas)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Reputation Data (análises antigas)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>News Mentions (análises antigas)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Pitches (gerados antigos)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Insights (gerados antigos)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Risks (análises antigas)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
