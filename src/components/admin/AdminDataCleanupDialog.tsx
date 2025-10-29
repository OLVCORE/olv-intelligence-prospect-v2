import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserRole } from "@/hooks/useUserRole";

const AVAILABLE_TABLES = [
  { id: 'companies', label: 'Empresas', description: 'Todas as empresas cadastradas' },
  { id: 'sdr_deals', label: 'Deals SDR', description: 'Oportunidades do pipeline SDR' },
  { id: 'sdr_opportunities', label: 'Oportunidades SDR', description: 'Leads e oportunidades SDR' },
  { id: 'sdr_tasks', label: 'Tarefas SDR', description: 'Tarefas e follow-ups' },
  { id: 'sdr_sequence_runs', label: 'Sequências em execução', description: 'Cadências ativas' },
  { id: 'conversations', label: 'Conversas', description: 'Histórico de conversas' },
  { id: 'activities', label: 'Atividades', description: 'Log de atividades' },
  { id: 'account_strategies', label: 'Estratégias de conta', description: 'Planos estratégicos' },
  { id: 'business_cases', label: 'Business Cases', description: 'Propostas e casos de negócio' },
];

export function AdminDataCleanupDialog() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isLoading } = useUserRole();
  const navigate = useNavigate();

  const handleCleanup = async () => {
    if (!password) {
      toast({
        title: "Senha necessária",
        description: "Digite sua senha para confirmar a ação",
        variant: "destructive",
      });
      return;
    }

    if (selectedTables.length === 0) {
      toast({
        title: "Selecione tabelas",
        description: "Selecione pelo menos uma tabela para limpar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data-cleanup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'cleanup',
            password: password,
            tables: selectedTables,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao limpar dados');
      }

      toast({
        title: "✅ Limpeza concluída",
        description: result.message || `${result.totalDeleted} registros deletados`,
      });

      setOpen(false);
      setPassword("");
      setSelectedTables([]);
      
      // Recarregar página após 2s
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Erro na limpeza",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAll = () => {
    setSelectedTables(AVAILABLE_TABLES.map(t => t.id));
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Limpeza de Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Limpeza de Dados - Administrador
          </DialogTitle>
          <DialogDescription>
            Esta ação é irreversível e deletará permanentemente os dados selecionados.
            Apenas administradores podem executar esta operação.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>⚠️ ATENÇÃO:</strong> Esta operação não pode ser desfeita. 
            Todos os dados selecionados serão permanentemente deletados.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Selecione as tabelas para limpar:</Label>
            <div className="flex gap-2 mb-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={selectAll}
              >
                Selecionar Todas
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={deselectAll}
              >
                Desmarcar Todas
              </Button>
            </div>
            <div className="space-y-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
              {AVAILABLE_TABLES.map((table) => (
                <div key={table.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={table.id}
                    checked={selectedTables.includes(table.id)}
                    onCheckedChange={() => toggleTable(table.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={table.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {table.label}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {table.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Confirme sua senha de administrador
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleCleanup();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              setPassword("");
              setSelectedTables([]);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCleanup}
            disabled={loading || !password || selectedTables.length === 0}
            className="gap-2"
          >
            {loading ? (
              <>Deletando...</>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Deletar {selectedTables.length} tabela(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
