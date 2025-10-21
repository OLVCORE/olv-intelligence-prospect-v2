import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Users, TrendingUp, Zap } from 'lucide-react';

interface CompanyDataPanelProps {
  company: any;
  digitalMaturity?: any;
  techStack?: any[];
  buyingSignals?: any[];
}

export const CompanyDataPanel = ({ 
  company, 
  digitalMaturity, 
  techStack,
  buyingSignals 
}: CompanyDataPanelProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Company Info */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-2xl font-bold">{company?.name}</p>
              <p className="text-sm text-muted-foreground">{company?.industry}</p>
            </div>
            {company?.employees && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                {company.employees} funcionários
              </div>
            )}
            {company?.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Site
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Digital Maturity */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Maturidade Digital
          </CardTitle>
        </CardHeader>
        <CardContent>
          {digitalMaturity ? (
            <div className="space-y-2">
              <div className="text-3xl font-bold">{digitalMaturity.overall_score || 0}/100</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Sistemas</p>
                  <p className="font-semibold">{digitalMaturity.systems_score || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Infraestrutura</p>
                  <p className="font-semibold">{digitalMaturity.infrastructure_score || 0}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Não analisado</p>
          )}
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Tecnologias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {techStack && techStack.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {techStack.slice(0, 6).map((tech, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {techStack.length > 6 && (
                <Badge variant="secondary" className="text-xs">+{techStack.length - 6}</Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Não detectado</p>
          )}
        </CardContent>
      </Card>

      {/* Buying Signals */}
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sinais de Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          {buyingSignals && buyingSignals.length > 0 ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">{buyingSignals.length}</div>
              <div className="text-xs space-y-1">
                {buyingSignals.slice(0, 3).map((signal, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    <p className="line-clamp-2">{signal.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum sinal detectado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
