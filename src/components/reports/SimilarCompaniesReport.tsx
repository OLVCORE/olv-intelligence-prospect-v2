import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  Building2, 
  MapPin, 
  DollarSign,
  CheckCircle,
  Award,
  Briefcase,
  TrendingUp,
  Info,
  Target,
  TrendingDown
} from 'lucide-react';

interface SimilarCompaniesReportProps {
  companies: any[];
  companyName: string;
}

export default function SimilarCompaniesReport({ companies, companyName }: SimilarCompaniesReportProps) {
  
  if (!companies || companies.length === 0) {
    return (
      <Card className="p-12 text-center border-2 border-dashed">
        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma empresa similar</h3>
        <p className="text-muted-foreground">Não foram identificadas empresas similares</p>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Compacto */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-background border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Empresas Similares</h1>
              <p className="text-sm text-muted-foreground">
                <strong className="text-primary">{companies.length}</strong> empresas identificadas • {companyName}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger className="ml-auto">
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">Empresas com perfil similar baseado em setor, porte, região e faturamento</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Lista Compacta */}
        <div className="space-y-4">
          {companies.map((company, index) => (
            <Card key={index} className="p-5 border border-border hover:border-primary/30 transition-all duration-200 bg-card">
              {/* Header Compacto */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary-foreground">#{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{company.name}</h3>
                    {company.cnpj && <p className="text-xs text-muted-foreground font-mono">CNPJ: {company.cnpj}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                  <Award className="w-4 h-4 text-primary" />
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{company.similarityScore || 0}%</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                          Match <Info className="w-2.5 h-2.5" />
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Score calculado com base em similaridade de setor, porte, região e faturamento</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Info Grid Compacto */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {company.sector && (
                  <Card className="p-3 bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 bg-blue-500/20 rounded">
                        <Briefcase className="w-3 h-3 text-blue-600" />
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Setor</p>
                    </div>
                    <p className="font-bold text-foreground text-sm">{company.sector}</p>
                  </Card>
                )}
                {company.size && (
                  <Card className="p-3 bg-purple-500/5 border border-purple-500/20">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 bg-purple-500/20 rounded">
                        <Building2 className="w-3 h-3 text-purple-600" />
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Porte</p>
                    </div>
                    <p className="font-bold text-foreground text-sm">{company.size}</p>
                  </Card>
                )}
                {company.region && (
                  <Card className="p-3 bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 bg-green-500/20 rounded">
                        <MapPin className="w-3 h-3 text-green-600" />
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Região</p>
                    </div>
                    <p className="font-bold text-foreground text-sm">{company.region}</p>
                  </Card>
                )}
                {company.revenue && (
                  <Card className="p-3 bg-orange-500/5 border border-orange-500/20">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 bg-orange-500/20 rounded">
                        <DollarSign className="w-3 h-3 text-orange-600" />
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Faturamento</p>
                    </div>
                    <p className="font-bold text-foreground text-sm">{company.revenue}</p>
                  </Card>
                )}
              </div>

              {/* Motivos Compactos */}
              {company.reasons && company.reasons.length > 0 && (
                <Card className="p-4 bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-sm text-foreground">Pontos de Convergência</h4>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground ml-auto" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Características em comum que justificam a similaridade</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <ul className="space-y-2">
                    {company.reasons.map((reason: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 p-2 bg-card/50 rounded border border-border/50">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-foreground leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
