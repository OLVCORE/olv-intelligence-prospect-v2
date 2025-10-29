import { useState } from 'react';
import { Zap, ArrowLeft, Upload, Play, Pause, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";

interface BatchJob {
  id: string;
  name: string;
  total_companies: number;
  processed_companies: number;
  qualified_companies: number;
  disqualified_companies: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export default function BatchAnalysis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchName, setBatchName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Buscar histórico de batches
  const { data: batches, isLoading } = useQuery({
    queryKey: ['batch-jobs'],
    queryFn: async () => {
      // TODO: Criar tabela icp_batch_jobs quando implementar
      return [] as BatchJob[];
    },
  });

  // Mutation para iniciar processamento
  const startBatchMutation = useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);

      // TODO: Implementar edge function para processar CSV
      toast.info('Processamento em batch será implementado em breve');
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
      setSelectedFile(null);
      setBatchName('');
      toast.success('Batch iniciado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      if (!batchName) {
        setBatchName(`Batch ${new Date().toLocaleDateString()}`);
      }
    } else {
      toast.error('Por favor, selecione um arquivo CSV válido');
    }
  };

  const handleStartBatch = () => {
    if (!selectedFile || !batchName) {
      toast.error('Selecione um arquivo e defina um nome para o batch');
      return;
    }

    startBatchMutation.mutate({ file: selectedFile, name: batchName });
  };

  const downloadTemplate = () => {
    const csv = [
      ['nome', 'cnpj', 'dominio', 'estado', 'cidade', 'setor', 'nicho'].join(','),
      ['Empresa Exemplo Ltda', '12.345.678/0001-90', 'exemplo.com.br', 'SP', 'São Paulo', 'agro', 'coop_agro'].join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-batch-icp.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
            <Zap className="h-8 w-8 text-purple-600" />
            Análise em Massa
          </h1>
          <p className="text-muted-foreground">
            Processe centenas de empresas automaticamente
          </p>
        </div>
      </div>

      {/* Instruções */}
      <Alert className="bg-blue-500/10 border-blue-500/20">
        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <p className="font-semibold mb-2">📊 Como funciona o processamento em massa?</p>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Baixe o template CSV e preencha com as empresas</li>
            <li>Faça upload do arquivo preenchido</li>
            <li>O sistema processará automaticamente: Detecção TOTVS + Sinais de Intenção</li>
            <li>Acompanhe o progresso em tempo real</li>
            <li>Exporte os resultados quando concluído</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Empresas</CardTitle>
          <CardDescription>
            Importe um CSV com as empresas para análise automática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Batch</label>
            <Input
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="Ex: Cooperativas SP - Janeiro 2024"
            />
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium mb-1">
                {selectedFile ? selectedFile.name : 'Arraste um arquivo CSV ou clique para selecionar'}
              </p>
              <p className="text-sm text-muted-foreground">
                Formato: nome, cnpj, domínio, estado, cidade, setor, nicho
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <label>
                  Selecionar Arquivo
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Baixar Template
              </Button>
            </div>
          </div>

          {selectedFile && (
            <div className="flex gap-2">
              <Button
                onClick={handleStartBatch}
                disabled={isUploading || !batchName}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar Processamento
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedFile(null)}
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Batches */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Processamentos</CardTitle>
          <CardDescription>Batches anteriores e em andamento</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : batches && batches.length > 0 ? (
            <div className="space-y-4">
              {batches.map((batch) => (
                <Card key={batch.id} className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{batch.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(batch.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge
                          variant={
                            batch.status === 'completed' ? 'default' :
                            batch.status === 'processing' ? 'secondary' :
                            batch.status === 'failed' ? 'destructive' : 'outline'
                          }
                        >
                          {batch.status === 'completed' && '✅ Concluído'}
                          {batch.status === 'processing' && '⏳ Processando'}
                          {batch.status === 'failed' && '❌ Falhou'}
                          {batch.status === 'pending' && '⏸️ Pendente'}
                        </Badge>
                      </div>

                      {batch.status === 'processing' && (
                        <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progresso</span>
                          <span className="font-medium">
                            {batch.processed_companies} / {batch.total_companies}
                          </span>
                        </div>
                        <Progress 
                          value={(batch.processed_companies / batch.total_companies) * 100} 
                          className="h-2"
                        />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <div className="text-center p-3 rounded-lg bg-background/50">
                          <p className="text-2xl font-bold">{batch.total_companies}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-500/10">
                          <p className="text-2xl font-bold text-green-600">{batch.qualified_companies}</p>
                          <p className="text-xs text-muted-foreground">Qualificadas</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-500/10">
                          <p className="text-2xl font-bold text-red-600">{batch.disqualified_companies}</p>
                          <p className="text-xs text-muted-foreground">Desqualificadas</p>
                        </div>
                      </div>

                      {batch.status === 'completed' && (
                        <Button variant="outline" className="w-full" disabled>
                          <Download className="mr-2 h-4 w-4" />
                          Exportar Resultados
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p>Nenhum batch processado ainda</p>
              <p className="text-sm mt-2">
                Faça upload de um CSV para iniciar seu primeiro processamento em massa
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
