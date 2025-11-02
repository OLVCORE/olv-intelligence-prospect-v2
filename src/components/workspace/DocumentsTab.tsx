import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
  FileText,
  Download,
  Eye,
  Trash2,
  Upload,
  RefreshCw
} from 'lucide-react';

interface DocumentsTabProps {
  companyId: string;
}

export default function DocumentsTab({ companyId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDocumentos();
  }, [companyId]);

  const carregarDocumentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
      console.log('[DOCUMENTOS] Carregados:', data?.length);

    } catch (error: any) {
      console.error('[DOCUMENTOS] Erro:', error);
      toast.error('Erro ao carregar documentos', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc: any) => {
    if (doc.file_url.startsWith('data:')) {
      // Base64 inline
      const a = document.createElement('a');
      a.href = doc.file_url;
      a.download = doc.file_name;
      a.click();
    } else {
      // URL externa
      window.open(doc.file_url, '_blank');
    }
  };

  const handleView = (doc: any) => {
    if (doc.file_url.startsWith('data:')) {
      // Abrir em nova aba
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${doc.file_url}" width="100%" height="100%" style="border:none;"></iframe>`);
      }
    } else {
      window.open(doc.file_url, '_blank');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const { error } = await supabase
        .from('company_documents')
        .update({ status: 'deleted' })
        .eq('id', docId);

      if (error) throw error;

      toast.success('✓ Documento Excluído');

      carregarDocumentos();

    } catch (error: any) {
      console.error('[DOCUMENTOS] Erro ao excluir:', error);
      toast.error('Erro ao excluir documento', {
        description: error.message,
      });
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      totvs_verification: 'Verificação TOTVS',
      similar_companies: 'Empresas Similares',
      analysis_360: 'Análise 360°',
      proposal: 'Proposta Comercial',
      contract: 'Contrato',
      other: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const getTipoBadgeVariant = (tipo: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      totvs_verification: 'destructive',
      similar_companies: 'default',
      analysis_360: 'secondary',
      proposal: 'outline',
      contract: 'default',
      other: 'outline',
    };
    return variants[tipo] || 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Documentos</h2>
          <p className="text-muted-foreground mt-1">
            {documents.length} documento{documents.length !== 1 ? 's' : ''} anexado{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregarDocumentos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum documento anexado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Os documentos gerados na análise de quarentena aparecerão aqui
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium">{doc.titulo}</p>
                        <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTipoBadgeVariant(doc.tipo)}>
                      {getTipoLabel(doc.tipo)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(doc.file_size / 1024).toFixed(0)} KB
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
