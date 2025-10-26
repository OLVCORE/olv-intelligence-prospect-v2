import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnrichmentSourceBadgeProps {
  source: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const sourceColors: Record<string, string> = {
  receitaws: 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200',
  apollo: 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border-purple-200',
  hunter: 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-200',
  phantombuster: 'bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 border-[#0A66C2]/20',
  linkedin: 'bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 border-[#0A66C2]/20',
  google: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200',
  serper: 'bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 border-indigo-200',
};

const sizeClasses = {
  sm: 'h-6 w-6 p-1',
  default: 'h-8 w-8 p-1.5',
  lg: 'h-10 w-10 p-2',
};

export function EnrichmentSourceBadge({ source, icon, size = 'default', className }: EnrichmentSourceBadgeProps) {
  const normalizedSource = source.toLowerCase();
  const colorClass = sourceColors[normalizedSource] || 'bg-muted text-muted-foreground border-border';

  if (icon) {
    return (
      <div className={cn(
        'flex items-center justify-center rounded-lg shadow-md transition-all hover:shadow-lg',
        colorClass,
        sizeClasses[size],
        className
      )}>
        {icon}
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium transition-all',
        colorClass,
        className
      )}
    >
      {source}
    </Badge>
  );
}
