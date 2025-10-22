import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Users, 
  Globe, 
  Zap, 
  Shield, 
  Award,
  ExternalLink,
  ChevronRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EnrichedCompanyResultProps {
  company: any;
  decisionMakers?: any[];
  digitalPresence?: any;
  maturityScore?: number;
  fitScore?: number;
  legalScore?: number;
}

export function EnrichedCompanyResult({
  company,
  decisionMakers = [],
  digitalPresence,
  maturityScore,
  fitScore,
  legalScore,
}: EnrichedCompanyResultProps) {
  const navigate = useNavigate();

  const enrichmentLevel = [
    !!decisionMakers.length,
    !!digitalPresence,
    !!maturityScore,
    !!fitScore,
    !!legalScore,
  ].filter(Boolean).length;

  const enrichmentPercentage = (enrichmentLevel / 5) * 100;

  return (
    <Card className="glass-card glass-card-hover group cursor-pointer" onClick={() => navigate(`/company/${company.id}`)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{company.name}</h3>
              </div>
              {company.cnpj && (
                <p className="text-sm text-muted-foreground">{company.cnpj}</p>
              )}
            </div>
            <Button variant="ghost" size="sm" className="group-hover:bg-accent">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Enrichment Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Enriquecimento</span>
              <span className="font-medium">{enrichmentPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={enrichmentPercentage} className="h-2" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatBadge
              icon={Users}
              label="Decisores"
              value={decisionMakers.length}
              active={decisionMakers.length > 0}
            />
            <StatBadge
              icon={Globe}
              label="Digital"
              value={digitalPresence?.overall_score?.toFixed(0) || 0}
              active={!!digitalPresence}
            />
            <StatBadge
              icon={Zap}
              label="Maturidade"
              value={maturityScore?.toFixed(0) || 0}
              active={!!maturityScore}
            />
            <StatBadge
              icon={Award}
              label="Fit TOTVS"
              value={fitScore?.toFixed(0) || 0}
              active={!!fitScore}
            />
            <StatBadge
              icon={Shield}
              label="Legal"
              value={legalScore?.toFixed(0) || 0}
              active={!!legalScore}
            />
          </div>

          {/* Info Row */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {company.industry && (
                <Badge variant="outline">{company.industry}</Badge>
              )}
              {company.employees && (
                <span>{company.employees} funcionários</span>
              )}
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Website
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBadge({ 
  icon: Icon, 
  label, 
  value, 
  active 
}: { 
  icon: any; 
  label: string; 
  value: number | string; 
  active: boolean;
}) {
  return (
    <div className={`p-2 rounded-lg border text-center transition-all ${
      active 
        ? 'bg-primary/10 border-primary/20' 
        : 'bg-muted/50 border-border'
    }`}>
      <Icon className={`h-4 w-4 mx-auto mb-1 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
      <p className="text-xs font-medium">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
