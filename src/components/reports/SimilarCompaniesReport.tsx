import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  MapPin, 
  DollarSign,
  CheckCircle,
  Award,
  Briefcase
} from 'lucide-react';

interface SimilarCompaniesReportProps {
  companies: any[];
  companyName: string;
}

export default function SimilarCompaniesReport({ companies, companyName }: SimilarCompaniesReportProps) {
  
  if (!companies || companies.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma empresa similar</h3>
        <p className="text-muted-foreground">Não foram identificadas empresas similares</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Empresas Similares</h1>
        </div>
        <p className="text-foreground mt-2">
          <strong>{companies.length} empresas</strong> similares a {companyName}
        </p>
      </Card>

      {/* Lista */}
      <div className="space-y-4">
        {companies.map((company, index) => (
          <Card key={index} className="p-6 border-2 border-border hover:border-primary/50 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary-foreground">#{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{company.name}</h3>
                  {company.cnpj && <p className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</p>}
                </div>
              </div>
              <Badge variant="default" className="text-xl px-6 py-2 bg-primary">
                <Award className="w-5 h-5 mr-2" />
                {company.similarityScore || 0}%
              </Badge>
            </div>

            {/* Info */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {company.sector && (
                <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground">Setor</p>
                  </div>
                  <p className="font-bold text-foreground">{company.sector}</p>
                </div>
              )}
              {company.size && (
                <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground">Porte</p>
                  </div>
                  <p className="font-bold text-foreground">{company.size}</p>
                </div>
              )}
              {company.region && (
                <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground">Região</p>
                  </div>
                  <p className="font-bold text-foreground">{company.region}</p>
                </div>
              )}
              {company.revenue && (
                <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground">Faturamento</p>
                  </div>
                  <p className="font-bold text-foreground">{company.revenue}</p>
                </div>
              )}
            </div>

            {/* Motivos */}
            {company.reasons && company.reasons.length > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg border-2 border-border">
                <h4 className="font-bold mb-3 text-foreground">Motivos da Similaridade:</h4>
                <ul className="space-y-2">
                  {company.reasons.map((reason: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
