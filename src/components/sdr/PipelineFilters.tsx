import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, TrendingUp, DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface PipelineFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  industryFilter: string;
  onIndustryChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  valueRange: [number, number];
  onValueRangeChange: (value: [number, number]) => void;
  maturityRange: [number, number];
  onMaturityRangeChange: (value: [number, number]) => void;
  industries: string[];
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export function PipelineFilters({
  searchQuery,
  onSearchChange,
  industryFilter,
  onIndustryChange,
  priorityFilter,
  onPriorityChange,
  valueRange,
  onValueRangeChange,
  maturityRange,
  onMaturityRangeChange,
  industries,
  activeFiltersCount,
  onClearFilters,
}: PipelineFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por empresa, contato ou email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-4"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtros:</span>
        </div>

        {/* Industry */}
        <Select value={industryFilter} onValueChange={onIndustryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select value={priorityFilter} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>

        {/* Value Range */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg border bg-background">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                R$ {(valueRange[0] / 1000).toFixed(0)}K - R$ {(valueRange[1] / 1000).toFixed(0)}K
              </span>
            </div>
            <Slider
              value={valueRange}
              onValueChange={(value) => onValueRangeChange(value as [number, number])}
              min={0}
              max={500000}
              step={10000}
              className="w-full"
            />
          </div>
        </div>

        {/* Maturity Range */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg border bg-background">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div className="w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Score: {maturityRange[0]} - {maturityRange[1]}
              </span>
            </div>
            <Slider
              value={maturityRange}
              onValueChange={(value) => onMaturityRangeChange(value as [number, number])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* Active Filters Badge */}
        {activeFiltersCount > 0 && (
          <>
            <Badge variant="secondary" className="gap-1">
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
