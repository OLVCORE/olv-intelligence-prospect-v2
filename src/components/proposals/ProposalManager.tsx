import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Eye, Download, Send, CheckCircle, XCircle, Clock, Save, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { useProposals, useGenerateProposal, useUpdateProposalStatus, Proposal } from "@/hooks/useProposals";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ExportButton } from "@/components/export/ExportButton";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";

interface ProposalManagerProps {
  companyId: string;
  accountStrategyId?: string;
  quoteId?: string;
  scenarioId?: string;
}

export function ProposalManager({ companyId, accountStrategyId, quoteId, scenarioId }: ProposalManagerProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: proposals, isLoading } = useProposals(companyId);
  const generateProposal = useGenerateProposal();
  const updateStatus = useUpdateProposalStatus();
  const [newTitle, setNewTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`proposals_data_${companyId}`, JSON.stringify({
        proposals,
        savedAt: new Date().toISOString(),
      }));
      toast({
        title: "✅ Propostas salvas",
        description: "Seus dados foram salvos com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateProposal = async () => {
    await generateProposal.mutateAsync({
      company_id: companyId,
      account_strategy_id: accountStrategyId,
      quote_id: quoteId,
      scenario_id: scenarioId,
      title: newTitle || 'Proposta Comercial',
    });
    setNewTitle('');
  };

  const getStatusBadge = (status: Proposal['status']) => {
    const variants = {
      draft: { variant: 'outline' as const, icon: Clock, label: 'Rascunho' },
      review: { variant: 'secondary' as const, icon: Eye, label: 'Em Revisão' },
      approved: { variant: 'default' as const, icon: CheckCircle, label: 'Aprovada' },
      sent: { variant: 'default' as const, icon: Send, label: 'Enviada' },
      accepted: { variant: 'default' as const, icon: CheckCircle, label: 'Aceita' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejeitada' },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <ScrollToTopButton />
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Propostas Comerciais</CardTitle>
              <CardDescription>Crie e gerencie propostas visuais profissionais</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              {proposals && proposals.length > 0 && (
                <>
                  <Button variant="default" size="sm" onClick={handleSaveAll} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Tudo
                  </Button>
                  <ExportButton
                    data={proposals}
                    filename={`proposals_${companyId}`}
                    variant="outline"
                    size="sm"
                  />
                </>
              )}
              <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Nova Proposta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerar Nova Proposta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title">Título da Proposta</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Proposta de Transformação Digital"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleGenerateProposal}
                    disabled={generateProposal.isPending}
                    className="w-full"
                  >
                    {generateProposal.isPending ? 'Gerando...' : 'Gerar Proposta'}
                  </Button>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Listagem de Propostas */}
      {isLoading ? (
        <div>Carregando propostas...</div>
      ) : proposals && proposals.length > 0 ? (
        <div className="grid gap-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      {getStatusBadge(proposal.status)}
                    </div>
                    <CardDescription>
                      {proposal.proposal_number} • Criada em {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {proposal.view_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {proposal.view_count} visualizações
                      </div>
                    )}
                    {proposal.valid_until && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Válida até {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    {proposal.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ proposalId: proposal.id, status: 'review' })}
                      >
                        Enviar para Revisão
                      </Button>
                    )}
                    {proposal.status === 'review' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateStatus.mutate({ proposalId: proposal.id, status: 'approved' })}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ proposalId: proposal.id, status: 'draft' })}
                        >
                          Voltar para Rascunho
                        </Button>
                      </>
                    )}
                    {proposal.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ proposalId: proposal.id, status: 'sent' })}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Enviar ao Cliente
                      </Button>
                    )}
                    {proposal.pdf_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={proposal.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma proposta criada ainda</p>
            <p className="text-sm">Clique em "Nova Proposta" para começar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
