import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, Building2, Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import type { Deal } from '@/hooks/useDeals';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DealCardActions } from './DealCardActions';

interface DraggableDealCardProps {
  deal: Deal;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (dealId: string, selected: boolean) => void;
  onClick?: (deal: Deal) => void;
}

export function DraggableDealCard({ deal, isDragging, isSelected, onSelect, onClick }: DraggableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: (isDragging || isSortableDragging) ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    high: 'bg-orange-500/10 text-orange-500',
    urgent: 'bg-red-500/10 text-red-500',
  };

  // Calcular dias no estágio
  const daysInStage = differenceInDays(new Date(), new Date(deal.created_at));
  const isStale = daysInStage > 7; // Mais de 7 dias no mesmo estágio

  return (
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "cursor-default hover:shadow-md transition-all",
          isSelected && "ring-2 ring-primary"
        )}
      >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(deal.id, checked as boolean)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
          )}
          <div className="mt-1 cursor-grab active:cursor-grabbing" {...attributes} {...listeners} aria-label="Arrastar deal">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div 
            className="flex-1 space-y-2 cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(deal);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onClick?.(deal);
            }}
          >
            {/* Title */}
            <h4 className="font-medium text-sm leading-tight">{deal.title}</h4>

            {/* Company */}
            {deal.companies && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {deal.companies.name}
              </div>
            )}

            {/* Value & Probability */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                R$ {(deal.value / 1000).toFixed(1)}k
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {deal.probability}%
              </div>
            </div>

            {/* Date & Days in Stage */}
            <div className="flex items-center justify-between">
              {deal.expected_close_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}
                </div>
              )}
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isStale ? "text-orange-600" : "text-muted-foreground"
              )}>
                <Clock className="h-3 w-3" />
                {daysInStage}d no estágio
                {isStale && <AlertCircle className="h-3 w-3" />}
              </div>
            </div>

            {/* Priority Badge */}
            <Badge
              variant="secondary"
              className={`text-xs ${priorityColors[deal.priority]}`}
            >
              {deal.priority === 'urgent' && '🔥 '}
              {deal.priority.toUpperCase()}
            </Badge>
          </div>
          
          <DealCardActions
            dealId={deal.id}
            dealTitle={deal.title}
            companyId={deal.company_id}
          />
        </div>
      </CardContent>
    </Card>
  );
}
