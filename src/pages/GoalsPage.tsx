import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalesGoal {
  id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  proposals_target: number;
  sales_target: number;
  revenue_target: number;
  proposals_achieved: number;
  sales_achieved: number;
  revenue_achieved: number;
  status: string;
  progress_percentage: number;
  notes: string;
  created_at: string;
}

export default function GoalsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['sales-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_goals')
        .select('*')
        .order('period_start', { ascending: false });
      
      if (error) throw error;
      return data as SalesGoal[];
    },
  });

  const createGoal = useMutation({
    mutationFn: async (newGoal: any) => {
      const { data, error } = await supabase
        .from('sales_goals')
        .insert([newGoal])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-goals'] });
      toast.success("Meta criada com sucesso!");
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao criar meta: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newGoal = {
      period_type: formData.get('period_type'),
      period_start: formData.get('period_start'),
      period_end: formData.get('period_end'),
      proposals_target: parseInt(formData.get('proposals_target') as string),
      sales_target: parseInt(formData.get('sales_target') as string),
      revenue_target: parseFloat(formData.get('revenue_target') as string),
      notes: formData.get('notes'),
      status: 'active',
    };

    createGoal.mutate(newGoal);
  };

  const getStatusColor = (goal: SalesGoal) => {
    const proposalProgress = (goal.proposals_achieved / goal.proposals_target) * 100;
    if (proposalProgress >= 90) return 'text-success';
    if (proposalProgress >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getStatusBadge = (goal: SalesGoal) => {
    const progress = (goal.proposals_achieved / goal.proposals_target) * 100;
    if (progress >= 100) return <Badge className="bg-success">✅ Meta Atingida</Badge>;
    if (progress >= 90) return <Badge className="bg-success/70">🟢 No Caminho</Badge>;
    if (progress >= 70) return <Badge variant="secondary">🟡 Atenção</Badge>;
    return <Badge variant="destructive">🔴 Crítico</Badge>;
  };

  const periodTypeLabels: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semestral: 'Semestral',
    annual: 'Anual',
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Metas de Vendas</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe e gerencie suas metas comerciais
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
              <DialogDescription>
                Defina metas de propostas, vendas e receita para o período
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="period_type">Tipo de Período</Label>
                <Select name="period_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period_start">Data Início</Label>
                  <Input type="date" name="period_start" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_end">Data Fim</Label>
                  <Input type="date" name="period_end" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposals_target">Meta de Propostas</Label>
                <Input type="number" name="proposals_target" placeholder="Ex: 50" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sales_target">Meta de Vendas</Label>
                <Input type="number" name="sales_target" placeholder="Ex: 20" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue_target">Meta de Receita (R$)</Label>
                <Input type="number" step="0.01" name="revenue_target" placeholder="Ex: 500000.00" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea name="notes" placeholder="Notas adicionais sobre esta meta" />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Meta</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map(goal => {
            const proposalProgress = (goal.proposals_achieved / goal.proposals_target) * 100;
            const salesProgress = (goal.sales_achieved / goal.sales_target) * 100;
            const revenueProgress = (goal.revenue_achieved / goal.revenue_target) * 100;

            return (
              <Card key={goal.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Meta {periodTypeLabels[goal.period_type]}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(goal.period_start), 'dd MMM', { locale: ptBR })} - {format(new Date(goal.period_end), 'dd MMM yyyy', { locale: ptBR })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(goal)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Propostas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Propostas</span>
                      <span className={`font-bold ${getStatusColor(goal)}`}>
                        {goal.proposals_achieved}/{goal.proposals_target}
                        {proposalProgress >= 100 ? (
                          <TrendingUp className="inline h-4 w-4 ml-1 text-success" />
                        ) : proposalProgress < 50 ? (
                          <TrendingDown className="inline h-4 w-4 ml-1 text-destructive" />
                        ) : null}
                      </span>
                    </div>
                    <Progress value={proposalProgress} className="h-2" />
                  </div>

                  {/* Vendas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Vendas</span>
                      <span className="font-bold">
                        {goal.sales_achieved}/{goal.sales_target}
                      </span>
                    </div>
                    <Progress value={salesProgress} className="h-2" />
                  </div>

                  {/* Receita */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Receita</span>
                      <span className="font-bold">
                        R$ {(goal.revenue_achieved / 1000).toFixed(0)}k / R$ {(goal.revenue_target / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <Progress value={revenueProgress} className="h-2" />
                  </div>

                  {goal.notes && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">{goal.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta cadastrada</h3>
            <p className="text-muted-foreground text-center mb-6">
              Crie sua primeira meta para começar a acompanhar seus resultados
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
