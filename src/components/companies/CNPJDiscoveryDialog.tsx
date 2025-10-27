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
        // Aplica imediatamente no registro da empresa e dispara enriquecimento
        await handleApplyCNPJ(data.cnpj, data.data);
        return;
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

  const handleApplyCNPJ = async (cnpj: string, candidateData?: any) => {
    setApplying(cnpj);
    
    try {
      console.log('[CNPJ Discovery] 📝 Aplicando CNPJ:', cnpj);
      console.log('[CNPJ Discovery] 📦 Dados do candidato:', candidateData);
      
      // Remover formatação do CNPJ (deixar só números)
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      
      // Atualizar CNPJ e dados da empresa
      const updateData: any = { 
        cnpj: cleanCNPJ,
        cnpj_status: 'ativo',
        updated_at: new Date().toISOString()
      };

      // Se temos dados do candidato, atualizar também
      if (candidateData) {
        if (candidateData.razao_social || candidateData.nome) {
          updateData.name = candidateData.razao_social || candidateData.nome;
        }
        if (candidateData.fantasia) {
          updateData.domain = candidateData.fantasia;
        }
        if (candidateData.telefone) {
          const phones = candidateData.telefone.split('/').map((p: string) => p.trim());
          updateData.phone_numbers = phones;
        }
        if (candidateData.municipio || candidateData.uf) {
          updateData.location = {
            ...company.location,
            city: candidateData.municipio || company.location?.city,
            state: candidateData.uf || company.location?.state
          };
        }
        if (candidateData.porte) {
          updateData.revenue = candidateData.porte;
        }
      }

      console.log('[CNPJ Discovery] 💾 Dados a atualizar:', updateData);

      const { error, data: updatedData } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('[CNPJ Discovery] ✅ CNPJ salvo no banco:', updatedData);
      
      toast.success('✅ CNPJ aplicado com sucesso!', {
        description: `CNPJ ${cleanCNPJ} vinculado à empresa`
      });
      
      // Disparar enriquecimento automático
      try {
        console.log('[CNPJ Discovery] 🔄 Disparando enriquecimento automático...');
        await supabase.functions.invoke('auto-enrich-company', {
          body: { companyId: company.id }
        });
      } catch (enrichError) {
        console.error('[CNPJ Discovery] ⚠️ Erro ao disparar enriquecimento:', enrichError);
      }
      
      // Aguardar um momento antes de fechar para garantir que a query será invalidada
      setTimeout(() => {
        onCNPJApplied?.();
        onOpenChange(false);
      }, 500);
      
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

                    {/* Dados completos da empresa - Formato Receita Federal */}
                    {candidate.data && (
                      <div className="space-y-3 pt-3 border-t bg-gradient-to-br from-blue-50/50 to-green-50/50 dark:from-blue-950/20 dark:to-green-950/20 -mx-4 px-4 py-4 rounded-lg">
                        <div className="flex items-center justify-between border-b pb-2">
                          <p className="text-sm font-bold text-primary uppercase">Comprovante de Inscrição e Situação Cadastral</p>
                          {candidate.data.tipo && (
                            <Badge variant="outline" className="font-semibold">
                              {candidate.data.tipo}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Número de Inscrição e Data de Abertura */}
                          <div className="text-sm space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Número de Inscrição</p>
                            <p className="font-mono font-bold text-base">
                              {candidate.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                            </p>
                          </div>
                          
                          {candidate.data.abertura && (
                            <div className="text-sm space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Data de Abertura</p>
                              <p className="font-medium">{candidate.data.abertura}</p>
                            </div>
                          )}
                        </div>

                        {/* Nome Empresarial */}
                        {(candidate.data.nome || candidate.data.razao_social) && (
                          <div className="text-sm space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Nome Empresarial</p>
                            <p className="font-bold text-base">{candidate.data.nome || candidate.data.razao_social}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          {/* Nome Fantasia */}
                          <div className="text-sm space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Nome Fantasia</p>
                            <p className="font-medium">{candidate.data.fantasia || '********'}</p>
                          </div>
                          
                          {/* Porte */}
                          {candidate.data.porte && (
                            <div className="text-sm space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Porte</p>
                              <p className="font-medium">{candidate.data.porte}</p>
                            </div>
                          )}
                        </div>

                        {/* Atividade Principal */}
                        {candidate.data.atividade_principal && (
                          <div className="text-sm space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Atividade Econômica Principal</p>
                            {Array.isArray(candidate.data.atividade_principal) ? (
                              candidate.data.atividade_principal.map((ativ: any, idx: number) => (
                                <p key={idx} className="font-medium text-xs bg-primary/10 px-2 py-1 rounded">
                                  {ativ.code} - {ativ.text}
                                </p>
                              ))
                            ) : (
                              <p className="font-medium text-xs bg-primary/10 px-2 py-1 rounded">
                                {candidate.data.atividade_principal.codigo} - {candidate.data.atividade_principal.descricao}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Atividades Secundárias */}
                        {candidate.data.atividades_secundarias && candidate.data.atividades_secundarias.length > 0 && (
                          <div className="text-sm space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Atividades Econômicas Secundárias</p>
                            <div className="space-y-1">
                              {candidate.data.atividades_secundarias.map((ativ: any, idx: number) => (
                                <p key={idx} className="font-medium text-xs bg-muted/50 px-2 py-1 rounded">
                                  {ativ.code} - {ativ.text}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Natureza Jurídica */}
                        {candidate.data.natureza_juridica && (
                          <div className="text-sm space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Natureza Jurídica</p>
                            <p className="font-medium">{candidate.data.natureza_juridica}</p>
                          </div>
                        )}

                        {/* Endereço Completo */}
                        {(candidate.data.logradouro || candidate.data.municipio) && (
                          <div className="text-sm space-y-2 border-t pt-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Endereço</p>
                            <div className="grid grid-cols-3 gap-2">
                              {candidate.data.logradouro && (
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">Logradouro</p>
                                  <p className="font-medium">{candidate.data.logradouro}</p>
                                </div>
                              )}
                              {candidate.data.numero && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Número</p>
                                  <p className="font-medium">{candidate.data.numero}</p>
                                </div>
                              )}
                            </div>
                            
                            {candidate.data.complemento && (
                              <div>
                                <p className="text-xs text-muted-foreground">Complemento</p>
                                <p className="font-medium">{candidate.data.complemento}</p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-3 gap-2">
                              {candidate.data.cep && (
                                <div>
                                  <p className="text-xs text-muted-foreground">CEP</p>
                                  <p className="font-medium">{candidate.data.cep}</p>
                                </div>
                              )}
                              {candidate.data.bairro && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Bairro</p>
                                  <p className="font-medium">{candidate.data.bairro}</p>
                                </div>
                              )}
                              {candidate.data.municipio && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Município</p>
                                  <p className="font-medium">{candidate.data.municipio}</p>
                                </div>
                              )}
                            </div>
                            
                            {candidate.data.uf && (
                              <div className="w-20">
                                <p className="text-xs text-muted-foreground">UF</p>
                                <p className="font-medium">{candidate.data.uf}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Contato */}
                        {(candidate.data.email || candidate.data.telefone) && (
                          <div className="grid grid-cols-2 gap-3 border-t pt-3">
                            {candidate.data.email && (
                              <div className="text-sm space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">E-mail</p>
                                <p className="font-medium text-xs break-all">{candidate.data.email}</p>
                              </div>
                            )}
                            {candidate.data.telefone && (
                              <div className="text-sm space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Telefone</p>
                                <p className="font-medium">{candidate.data.telefone}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Situação Cadastral */}
                        <div className="grid grid-cols-2 gap-3 border-t pt-3">
                          {candidate.data.situacao && (
                            <div className="text-sm space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Situação Cadastral</p>
                              <Badge 
                                variant={candidate.data.situacao === 'ATIVA' ? 'default' : 'secondary'} 
                                className="text-sm font-bold"
                              >
                                {candidate.data.situacao}
                              </Badge>
                            </div>
                          )}
                          {candidate.data.data_situacao && (
                            <div className="text-sm space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Data da Situação</p>
                              <p className="font-medium">{candidate.data.data_situacao}</p>
                            </div>
                          )}
                        </div>

                        {/* Capital Social */}
                        {candidate.data.capital_social && (
                          <div className="text-sm space-y-1 border-t pt-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Capital Social</p>
                            <p className="font-bold text-lg text-primary">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                parseFloat(candidate.data.capital_social)
                              )}
                            </p>
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
                      onClick={() => handleApplyCNPJ(candidate.cnpj, candidate.data)}
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
