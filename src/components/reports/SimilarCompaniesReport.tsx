import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  MapPin, 
  DollarSign,
  CheckCircle,
  Award,
  Briefcase,
  TrendingUp
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
    <div className="space-y-8">
      {/* Header */}
      <Card className="p-8 bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/30 shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-1">Empresas Similares</h1>
            <p className="text-xl text-foreground/80">
              <strong className="text-primary">{companies.length} empresas</strong> identificadas similares a {companyName}
            </p>
          </div>
        </div>
      </Card>

      {/* Lista */}
      <div className="space-y-6">
        {companies.map((company, index) => (
          <Card key={index} className="p-8 border-2 border-border hover:border-primary/50 transition-all duration-200 shadow-lg hover:shadow-xl bg-gradient-to-br from-card to-card/50">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-3xl font-bold text-primary-foreground">#{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-foreground mb-1">{company.name}</h3>
                  {company.cnpj && <p className="text-sm text-muted-foreground font-mono">CNPJ: {company.cnpj}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 rounded-xl shadow-md">
                <Award className="w-6 h-6 text-primary" />
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{company.similarityScore || 0}%</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Similaridade</p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-4 gap-5 mb-8">
              {company.sector && (
                <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/30 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Setor</p>
                  </div>
                  <p className="font-bold text-foreground text-lg">{company.sector}</p>
                </Card>
              )}
              {company.size && (
                <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-2 border-purple-500/30 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Porte</p>
                  </div>
                  <p className="font-bold text-foreground text-lg">{company.size}</p>
                </Card>
              )}
              {company.region && (
                <Card className="p-5 bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/30 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Região</p>
                  </div>
                  <p className="font-bold text-foreground text-lg">{company.region}</p>
                </Card>
              )}
              {company.revenue && (
                <Card className="p-5 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-2 border-orange-500/30 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Faturamento</p>
                  </div>
                  <p className="font-bold text-foreground text-lg">{company.revenue}</p>
                </Card>
              )}
            </div>

            {/* Motivos */}
            {company.reasons && company.reasons.length > 0 && (
              <Card className="p-6 bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border shadow-inner">
                <h4 className="font-bold mb-4 text-lg text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Motivos da Similaridade
                </h4>
                <ul className="space-y-3">
                  {company.reasons.map((reason: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-card/50 rounded-lg border border-border/50">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground font-medium leading-relaxed">{reason}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
