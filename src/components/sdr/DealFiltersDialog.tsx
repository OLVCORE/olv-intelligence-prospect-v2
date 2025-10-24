import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface DealFilters {
  priority?: string[];
  status?: string[];
  minValue?: number;
  maxValue?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

interface DealFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: DealFilters;
  onApplyFilters: (filters: DealFilters) => void;
}

export function DealFiltersDialog({ open, onOpenChange, filters, onApplyFilters }: DealFiltersDialogProps) {
  const [localFilters, setLocalFilters] = useState<DealFilters>(filters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    const emptyFilters: DealFilters = {};
    setLocalFilters(emptyFilters);
    onApplyFilters(emptyFilters);
    onOpenChange(false);
  };

  const togglePriority = (priority: string) => {
    const current = localFilters.priority || [];
    const updated = current.includes(priority)
      ? current.filter(p => p !== priority)
      : [...current, priority];
    setLocalFilters({ ...localFilters, priority: updated.length > 0 ? updated : undefined });
  };

  const toggleStatus = (status: string) => {
    const current = localFilters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    setLocalFilters({ ...localFilters, status: updated.length > 0 ? updated : undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Buscar</Label>
            <Input
              placeholder="Título, empresa..."
              value={localFilters.search || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value || undefined })}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="flex gap-2 flex-wrap">
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <Button
                  key={priority}
                  variant={localFilters.priority?.includes(priority) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePriority(priority)}
                >
                  {priority === 'low' && 'Baixa'}
                  {priority === 'medium' && 'Média'}
                  {priority === 'high' && 'Alta'}
                  {priority === 'urgent' && 'Urgente'}
                </Button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2 flex-wrap">
              {['open', 'won', 'lost', 'abandoned'].map((status) => (
                <Button
                  key={status}
                  variant={localFilters.status?.includes(status) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleStatus(status)}
                >
                  {status === 'open' && 'Aberto'}
                  {status === 'won' && 'Ganho'}
                  {status === 'lost' && 'Perdido'}
                  {status === 'abandoned' && 'Abandonado'}
                </Button>
              ))}
            </div>
          </div>

          {/* Value Range */}
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.minValue || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, minValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Máximo</Label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={localFilters.maxValue || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Data de Fechamento</Label>
            <div className="grid grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !localFilters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateFrom ? format(localFilters.dateFrom, "PP", { locale: ptBR }) : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateFrom}
                    onSelect={(date) => setLocalFilters({ ...localFilters, dateFrom: date })}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !localFilters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateTo ? format(localFilters.dateTo, "PP", { locale: ptBR }) : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateTo}
                    onSelect={(date) => setLocalFilters({ ...localFilters, dateTo: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button onClick={handleApply}>
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
