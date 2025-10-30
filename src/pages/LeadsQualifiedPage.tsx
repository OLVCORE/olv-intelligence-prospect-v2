import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowRight,
  Flame,
  Thermometer,
  Snowflake,
  Target,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

export default function LeadsQualifiedPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads_qualified')
        .select('*')
        .eq('status', 'qualificada')
        .order('icp_score', { ascending: false });

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error: any) {
      console.error('[QUALIFICADAS] Erro ao carregar:', error);
      toast({
        title: 'Erro ao carregar empresas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const levarParaPipeline = async () => {
    if (selecionadas.size === 0) {
      toast({
        title: 'Nenhuma empresa selecionada',
        description: 'Selecione pelo menos uma empresa',
        variant: 'destructive',
      });
      return;
    }

    setProcessando(true);

    try {
      const empresasSelecionadas = empresas.filter(e => selecionadas.has(e.id));

      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .insert(
          empresasSelecionadas.map(e => ({
            name: e.razao_social,
            cnpj: e.cnpj,
            domain: e.website,
            icp_score: e.icp_score,
            lead_qualified_id: e.id,
            approved_at: new Date().toISOString(),
            pipeline_status: 'ativo',
            raw_data: { origem: 'leads_qualified' },
          }))
        )
        .select();

      if (companiesError) throw companiesError;

      const { error: updateError } = await supabase
        .from('leads_qualified')
        .update({ 
          status: 'aprovada',
          updated_at: new Date().toISOString()
        })
        .in('id', Array.from(selecionadas));

      if (updateError) throw updateError;

      console.log('[QUALIFICADAS] Empresas movidas para pipeline:', companiesData);

      toast({
        title: '✓ Empresas Adicionadas ao Pipeline',
        description: `${selecionadas.size} empresas foram adicionadas ao pipeline e agora aparecem no dashboard`,
      });

      setSelecionadas(new Set());
      carregarEmpresas();

    } catch (error: any) {
      console.error('[QUALIFICADAS] Erro ao mover para pipeline:', error);
      toast({
        title: 'Erro ao adicionar ao pipeline',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessando(false);
    }
  };

  const toggleSelecao = (id: string) => {
    const nova = new Set(selecionadas);
    if (nova.has(id)) {
      nova.delete(id);
    } else {
      nova.add(id);
    }
    setSelecionadas(nova);
  };

  const selecionarTodas = () => {
    if (selecionadas.size === empresas.length) {
      setSelecionadas(new Set());
    } else {
      setSelecionadas(new Set(empresas.map(e => e.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Empresas Qualificadas
          </h1>
          <p className="text-muted-foreground mt-1">
            {empresas.length} empresas aguardando aprovação para o pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregarEmpresas}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={levarParaPipeline}
            disabled={selecionadas.size === 0 || processando}
          >
            {processando ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            Levar para Pipeline ({selecionadas.size})
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selecionadas.size === empresas.length && empresas.length > 0}
                  onCheckedChange={selecionarTodas}
                />
              </TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>UF</TableHead>
              <TableHead>Score ICP</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead>Qualificada em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell>
                  <Checkbox
                    checked={selecionadas.has(empresa.id)}
                    onCheckedChange={() => toggleSelecao(empresa.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {empresa.razao_social}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {empresa.cnpj}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{empresa.uf}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">
                    {empresa.icp_score}/100
                  </Badge>
                </TableCell>
                <TableCell>
                  {empresa.temperatura === 'hot' && (
                    <Badge className="bg-red-100 text-red-800">
                      <Flame className="w-3 h-3 mr-1" />
                      HOT
                    </Badge>
                  )}
                  {empresa.temperatura === 'warm' && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Thermometer className="w-3 h-3 mr-1" />
                      WARM
                    </Badge>
                  )}
                  {empresa.temperatura === 'cold' && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Snowflake className="w-3 h-3 mr-1" />
                      COLD
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(empresa.selected_at).toLocaleDateString('pt-BR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {empresas.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma empresa qualificada no momento</p>
          </div>
        )}
      </Card>
    </div>
  );
}
