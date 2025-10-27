import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, Mail, Phone, GripVertical, Eye, TrendingUp,
  Sparkles, Users, Calendar, DollarSign, Target, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { CallInterface } from './CallInterface';
import { LeadScoreBadge } from '@/components/common/LeadScoreBadge';
import { DealCardActions } from './DealCardActions';

interface DealCardProps {
  deal: {
    id: string;
    contact_id: string;
    company_id?: string;
    channel: string;
    status: string;
    priority: string;
    last_message_at?: string;
    contact?: { name: string; email?: string; phone?: string };
    company?: { 
      name: string; 
      industry?: string;
      employees?: number;
      digital_maturity_score?: number;
    };
    // Campos enriquecidos
    estimated_value?: number;
    win_probability?: number;
    next_action?: string;
    ai_insight?: string;
    lead_score?: number;
  };
}

export function DealCard({ deal }: DealCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  } as const;

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-4 cursor-move hover:shadow-lg transition-all hover:border-primary/50',
        isDragging && 'shadow-xl ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{deal.contact?.name}</h3>
                {deal.lead_score !== undefined && deal.lead_score > 0 && (
                  <LeadScoreBadge score={deal.lead_score} size="sm" showLabel={false} />
                )}
              </div>
              {deal.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{deal.company.name}</span>
                </p>
              )}
            </div>
              <Badge
                variant={priorityColors[deal.priority as keyof typeof priorityColors] || 'secondary'}
                className="text-xs shrink-0"
              >
                {deal.priority}
              </Badge>
              <DealCardActions
                dealId={deal.id}
                dealTitle={deal.contact?.name || 'Deal'}
                companyId={deal.company_id}
              />
            </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-primary/5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-muted-foreground text-[10px]">Valor Est.</p>
                <p className="font-semibold">{formatCurrency(deal.estimated_value)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-green-500/10">
              <Target className="h-3.5 w-3.5 text-green-600" />
              <div>
                <p className="text-muted-foreground text-[10px]">Win Prob.</p>
                <p className="font-semibold">{deal.win_probability || 0}%</p>
              </div>
            </div>
          </div>

          {/* Company Insights */}
          {deal.company && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {deal.company.industry && (
                <Badge variant="outline" className="text-[10px]">
                  {deal.company.industry}
                </Badge>
              )}
              {deal.company.employees && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {deal.company.employees}
                </span>
              )}
              {deal.company.digital_maturity_score && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {deal.company.digital_maturity_score.toFixed(0)}
                </span>
              )}
            </div>
          )}

          {/* AI Insight */}
          {deal.ai_insight && (
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="h-3 w-3 text-purple-600 mt-0.5 shrink-0" />
                <p className="text-xs text-foreground/80 line-clamp-2">{deal.ai_insight}</p>
              </div>
            </div>
          )}

          {/* Next Action */}
          {deal.next_action && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="truncate">{deal.next_action}</span>
            </div>
          )}

          {/* Contact Info & Quick Actions */}
          <div className="flex items-center gap-2">
            {deal.contact?.email && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `mailto:${deal.contact.email}`;
                }}
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>
            )}
            {deal.contact?.phone && (
              <CallInterface
                phoneNumber={deal.contact.phone}
                contactName={deal.contact.name}
                companyName={deal.company?.name}
                dealId={deal.id}
                companyId={deal.company_id}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => navigate('/sdr/inbox')}
            >
              <Eye className="h-3 w-3 mr-1.5" />
              Conversa
            </Button>
            {deal.company_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => navigate(`/intelligence-360?company=${deal.company_id}`)}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
