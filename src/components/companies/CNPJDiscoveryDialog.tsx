import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertTriangle, Search, Building2, MapPin, Globe } from "lucide-react";

interface CNPJCandidate {
  cnpj: string;
  confidence: number;
  source: string;
  validation: {
    name_match: number;
    domain_match: number;
    location_match: number;
  };
  data?: any;
}

interface CNPJDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: any;
  onCNPJApplied?: () => void;
}

export function CNPJDiscoveryDialog({ open, onOpenChange, company, onCNPJApplied }: CNPJDiscoveryDialogProps) {
  const [discovering, setDiscovering] = useState(false);
  const [candidates, setCandidates] = useState<CNPJCandidate[]>([]);
  const [applying, setApplying] = useState<string | null>(null);

  const handleDiscover = async () => {
    setDiscovering(true);
    setCandidates([]);
    
    try {
      console.log('[CNPJ Discovery] 🔍 Iniciando descoberta para:', company.name);
      
      const { data, error } = await supabase.functions.invoke('discover-cnpj', {
        body: {
          companyId: company.id,
          companyName: company.name,
          domain: company.domain || company.website?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          location: company.location
        }
      });
      
      if (error) throw error;
      
      console.log('[CNPJ Discovery] 📊 Resultado:', data);
      
      if (data.auto_applied) {
        toast.success(`🎉 CNPJ encontrado e validado: ${data.cnpj}`, {
          description: `Confiança: ${data.confidence}% - Fonte: ${data.source}`
        });
        onCNPJApplied?.();
        onOpenChange(false);
      } else if (data.requires_review) {
        setCandidates(data.candidates || []);
        toast.info('📋 Candidatos encontrados', {
          description: 'Selecione o CNPJ correto ou tente novamente'
        });
      } else {
        toast.warning('Nenhum CNPJ encontrado', {
          description: 'Tente adicionar manualmente ou verificar o nome da empresa'
        });
      }
      
    } catch (error: any) {
      console.error('[CNPJ Discovery] ❌ Erro:', error);
      toast.error('Erro ao buscar CNPJ', {
        description: error.message
      });
    } finally {
      setDiscovering(false);
    }
  };

  const handleApplyCNPJ = async (cnpj: string) => {
    setApplying(cnpj);
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          cnpj: cnpj,
          cnpj_status: 'validado',
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);
      
      if (error) throw error;
      
      toast.success('✅ CNPJ aplicado com sucesso!', {
        description: `CNPJ ${cnpj} vinculado à empresa`
      });
      
      onCNPJApplied?.();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('[CNPJ Discovery] ❌ Erro ao aplicar:', error);
      toast.error('Erro ao aplicar CNPJ', {
        description: error.message
      });
    } finally {
      setApplying(null);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'Alta';
    if (confidence >= 60) return 'Média';
    return 'Baixa';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Descobrir CNPJ
          </DialogTitle>
          <DialogDescription>
            Busca automática de CNPJ para <strong>{company?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info da empresa */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{company?.name}</span>
              </div>
              {company?.domain && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{company.domain}</span>
                </div>
              )}
              {company?.location?.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{company.location.city}, {company.location.state || company.location.country}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão de busca */}
          {candidates.length === 0 && (
            <Button
              onClick={handleDiscover}
              disabled={discovering}
              className="w-full"
              size="lg"
            >
              {discovering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando CNPJ...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Iniciar Busca Automática
                </>
              )}
            </Button>
          )}

          {/* Candidatos encontrados */}
          {candidates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Candidatos Encontrados</h3>
                <Badge variant="outline">{candidates.length} opções</Badge>
              </div>

              {candidates.map((candidate, index) => (
                <Card key={candidate.cnpj} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg">
                            {candidate.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                          </span>
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              Melhor Match
                            </Badge>
                          )}
                        </div>
                        
                        {candidate.data?.razao_social && (
                          <p className="text-sm text-muted-foreground">
                            {candidate.data.razao_social}
                          </p>
                        )}
                        
                        {candidate.data?.fantasia && candidate.data.fantasia !== candidate.data.razao_social && (
                          <p className="text-xs text-muted-foreground">
                            Nome Fantasia: {candidate.data.fantasia}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          <Badge variant="outline" className="text-xs">
                            Fonte: {candidate.source}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getConfidenceColor(candidate.confidence)}`} />
                          <span className="text-sm font-medium">{candidate.confidence}%</span>
                        </div>
                        <Badge 
                          variant={candidate.confidence >= 80 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {getConfidenceBadge(candidate.confidence)}
                        </Badge>
                      </div>
                    </div>

                    {/* Dados principais da empresa encontrada */}
                    {candidate.data && (
                      <div className="space-y-2 pt-2 border-t bg-muted/30 -mx-4 px-4 py-3 rounded">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Dados da Empresa</p>
                        
                        {candidate.data.razao_social && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Razão Social: </span>
                            <span className="font-medium">{candidate.data.razao_social}</span>
                          </div>
                        )}
                        
                        {candidate.data.nome_fantasia && candidate.data.nome_fantasia !== candidate.data.razao_social && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Nome Fantasia: </span>
                            <span className="font-medium">{candidate.data.nome_fantasia}</span>
                          </div>
                        )}
                        
                        {candidate.data.situacao && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Situação: </span>
                            <Badge variant={candidate.data.situacao === 'ATIVA' ? 'default' : 'secondary'} className="text-xs">
                              {candidate.data.situacao}
                            </Badge>
                          </div>
                        )}
                        
                        {candidate.data.porte && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Porte: </span>
                            <span className="font-medium">{candidate.data.porte}</span>
                          </div>
                        )}
                        
                        {(candidate.data.municipio || candidate.data.uf) && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Endereço: </span>
                            <span className="font-medium">
                              {candidate.data.municipio}{candidate.data.municipio && candidate.data.uf ? ', ' : ''}{candidate.data.uf}
                            </span>
                          </div>
                        )}
                        
                        {candidate.data.capital_social && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Capital Social: </span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                parseFloat(candidate.data.capital_social)
                              )}
                            </span>
                          </div>
                        )}
                        
                        {candidate.data.abertura && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Data Abertura: </span>
                            <span className="font-medium">
                              {new Date(candidate.data.abertura).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        
                        {candidate.data.cnae_principal && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">CNAE Principal: </span>
                            <span className="font-medium text-xs">
                              {candidate.data.cnae_principal.codigo} - {candidate.data.cnae_principal.descricao}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scores de validação */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Nome</p>
                        <p className="text-sm font-medium">{candidate.validation.name_match}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Domínio</p>
                        <p className="text-sm font-medium">{candidate.validation.domain_match}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Localização</p>
                        <p className="text-sm font-medium">{candidate.validation.location_match}%</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleApplyCNPJ(candidate.cnpj)}
                      disabled={applying === candidate.cnpj}
                      className="w-full"
                      variant={index === 0 ? "default" : "outline"}
                    >
                      {applying === candidate.cnpj ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Aplicando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {index === 0 ? 'Aplicar CNPJ (Recomendado)' : 'Aplicar este CNPJ'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={handleDiscover}
                disabled={discovering}
                variant="outline"
                className="w-full"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar Novamente
              </Button>
            </div>
          )}

          {/* Info box */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Como funciona?
                  </p>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Busca em EmpresaQui, ReceitaWS e Web</li>
                    <li>Valida match por nome, domínio e localização</li>
                    <li>Aplica automaticamente se confiança ≥ 80%</li>
                    <li>Sugere candidatos se confiança entre 50-80%</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
