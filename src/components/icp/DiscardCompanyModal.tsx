import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    cnpj?: string;
    icp_score?: number;
    icp_temperature?: string;
  };
  stcResult?: {
    status: string;
    confidence: string;
    tripleMatches: number;
    doubleMatches: number;
    totalScore: number;
  };
  onSuccess: () => void;
}

const DISCARD_REASONS = [
  {
    id: 'totvs_client',
    label: '⚠️ Já é cliente TOTVS',
    description: 'Empresa confirmada como cliente TOTVS (NO-GO)',
    category: 'blocker'
  },
  {
    id: 'out_of_icp',
    label: '❌ Fora do perfil ICP',
    description: 'Não atende critérios de ICP definidos',
    category: 'qualification'
  },
  {
    id: 'wrong_size',
    label: '📊 Porte inadequado',
    description: 'Empresa muito pequena ou muito grande',
    category: 'qualification'
  },
  {
    id: 'wrong_sector',
    label: '🏭 Setor não atendido',
    description: 'Segmento fora do escopo comercial',
    category: 'qualification'
  },
  {
    id: 'wrong_region',
    label: '🗺️ Região não coberta',
    description: 'Localização fora da área de atuação',
    category: 'qualification'
  },
  {
    id: 'insufficient_data',
    label: '📋 Dados insuficientes',
    description: 'Informações incompletas para qualificação',
    category: 'data'
  },
  {
    id: 'competitor',
    label: '🚫 Concorrente',
    description: 'Empresa concorrente identificada',
    category: 'blocker'
  },
  {
    id: 'bad_reputation',
    label: '⚠️ Reputação negativa',
    description: 'Histórico de problemas ou má reputação',
    category: 'risk'
  },
  {
    id: 'financial_issues',
    label: '💰 Problemas financeiros',
    description: 'Situação financeira crítica',
    category: 'risk'
  },
  {
    id: 'other',
    label: '✏️ Outro motivo',
    description: 'Especificar motivo personalizado',
    category: 'other'
  }
];

export function DiscardCompanyModal({ open, onOpenChange, company, stcResult, onSuccess }: Props) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDiscard = async () => {
    if (!selectedReason) {
      toast.error('Selecione um motivo para o descarte');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      toast.error('Descreva o motivo do descarte');
      return;
    }

    setLoading(true);

    try {
      const reasonData = DISCARD_REASONS.find(r => r.id === selectedReason);
      const finalReason = selectedReason === 'other' ? customReason : reasonData?.label;

      // SALVAR NO BANCO DE DADOS
      const { error: insertError } = await supabase.from('discarded_companies').insert({
        company_id: company.id,
        company_name: company.name,
        cnpj: company.cnpj,
        discard_reason_id: selectedReason,
        discard_reason_label: finalReason,
        discard_reason_description: selectedReason === 'other' ? customReason : reasonData?.description,
        discard_category: reasonData?.category || 'other',
        stc_status: stcResult?.status,
        stc_confidence: stcResult?.confidence,
        stc_triple_matches: stcResult?.tripleMatches || 0,
        stc_double_matches: stcResult?.doubleMatches || 0,
        stc_total_score: stcResult?.totalScore || 0,
        original_icp_score: company.icp_score,
        original_icp_temperature: company.icp_temperature
      });

      if (insertError) throw insertError;

      // REMOVER DA QUARENTENA (atualizar status ou deletar)
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({ status: 'descartada' })
        .eq('id', company.id);

      if (updateError) throw updateError;

      // MARCAR EMPRESA COMO DESQUALIFICADA
      const { error: companyError } = await supabase
        .from('companies')
        .update({ 
          is_disqualified: true,
          disqualification_reason: finalReason 
        })
        .eq('id', company.id);

      if (companyError) console.warn('[DISCARD] Aviso ao atualizar companies:', companyError);

      toast.success(`✅ ${company.name} descartada`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[DISCARD] Erro:', error);
      toast.error(`❌ Erro ao descartar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            Descartar Empresa
          </DialogTitle>
          <DialogDescription>
            Empresa: <strong>{company.name}</strong>
            {company.cnpj && <span className="ml-2 text-xs">({company.cnpj})</span>}
          </DialogDescription>
        </DialogHeader>

        {/* Resultado STC (se disponível) */}
        {stcResult && (
          <div className="bg-muted/50 border rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-sm mb-2">📊 Resultado da Verificação STC</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge className="ml-2">{stcResult.status}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Confiança:</span>
                <Badge variant="outline" className="ml-2">{stcResult.confidence}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Triple Matches:</span>
                <span className="ml-2 font-mono">{stcResult.tripleMatches}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Double Matches:</span>
                <span className="ml-2 font-mono">{stcResult.doubleMatches}</span>
              </div>
            </div>
          </div>
        )}

        {/* Motivos de Descarte */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>Selecione o motivo do descarte:</span>
          </div>

          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            <div className="space-y-2">
              {DISCARD_REASONS.map((reason) => (
                <div
                  key={reason.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedReason === reason.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedReason(reason.id)}
                >
                  <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                  <Label htmlFor={reason.id} className="flex-1 cursor-pointer">
                    <div className="font-medium text-sm">{reason.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{reason.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {/* Campo de texto para "Outro motivo" */}
          {selectedReason === 'other' && (
            <div className="mt-4">
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                Descreva o motivo do descarte:
              </Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Descreva detalhadamente o motivo do descarte..."
                className="mt-2"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {customReason.length}/500 caracteres
              </p>
            </div>
          )}
        </div>

        {/* Ações */}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDiscard}
            disabled={loading}
            variant="destructive"
          >
            {loading ? 'Descartando...' : 'Confirmar Descarte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
