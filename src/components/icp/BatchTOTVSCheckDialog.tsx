import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, AlertCircle, Zap } from "lucide-react";
import { useSimpleTOTVSCheckBatch } from "@/hooks/useSimpleTOTVSCheckBatch";

interface BatchTOTVSCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: any[];
}

const BATCH_OPTIONS = [
  { value: '10', label: '10 empresas por vez', cost: 'Baixo custo', speed: 'Rápido' },
  { value: '20', label: '20 empresas por vez', cost: 'Médio custo', speed: 'Balanceado' },
  { value: '30', label: '30 empresas por vez', cost: 'Alto custo', speed: 'Mais rápido' },
  { value: 'all', label: 'Todas de uma vez', cost: 'Máximo custo', speed: 'Mais rápido possível' },
];

export function BatchTOTVSCheckDialog({ open, onOpenChange, selectedItems }: BatchTOTVSCheckDialogProps) {
  const [batchSize, setBatchSize] = useState('20');
  const { mutate: executeBatch, isPending } = useSimpleTOTVSCheckBatch();

  const handleExecute = () => {
    const size = batchSize === 'all' ? selectedItems.length : parseInt(batchSize);
    const itemsToProcess = selectedItems.slice(0, size);
    
    executeBatch(itemsToProcess, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const estimatedCost = () => {
    const size = batchSize === 'all' ? selectedItems.length : parseInt(batchSize);
    const costPerCheck = 0.05; // Estimativa em créditos
    return (size * costPerCheck).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <DialogTitle>TOTVS Check em Lote</DialogTitle>
          </div>
          <DialogDescription>
            Executar verificação TOTVS para múltiplas empresas com controle de lote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{selectedItems.length} empresas</strong> selecionadas para verificação.
              Escolha o tamanho do lote para otimizar custo vs. velocidade.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label>Tamanho do Lote</Label>
            <RadioGroup value={batchSize} onValueChange={setBatchSize}>
              {BATCH_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="font-normal cursor-pointer flex items-center justify-between flex-1"
                  >
                    <span>{option.label}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{option.cost}</span>
                      <span className="flex items-center gap-1 text-primary">
                        <Zap className="h-3 w-3" />
                        {option.speed}
                      </span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Alert className="bg-muted">
            <AlertDescription>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Empresas a processar:</span>
                  <span className="text-sm">
                    {batchSize === 'all' ? selectedItems.length : Math.min(parseInt(batchSize), selectedItems.length)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Custo estimado:</span>
                  <span className="text-sm font-semibold text-primary">{estimatedCost()} créditos</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleExecute} disabled={isPending}>
            {isPending ? 'Processando...' : 'Executar Verificação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
