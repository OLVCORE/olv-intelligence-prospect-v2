import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Briefcase,
  Globe,
  TrendingUp,
  FileText
} from "lucide-react";

interface CompanyInsightsTabProps {
  companyInsights: any;
  company?: any;
}

export function CompanyInsightsTab({ companyInsights, company }: CompanyInsightsTabProps) {
  // Parse insights se vier como string
  const insights = typeof companyInsights === 'string' 
    ? (() => { try { return JSON.parse(companyInsights); } catch { return null; } })()
    : companyInsights;

  if (!insights && !company) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum insight disponível para esta empresa.
      </div>
    );
  }

  // Extrair dados de insights ou company
  const data = {
    description: insights?.description || company?.description,
    foundedYear: insights?.founded_year || company?.founded_year || company?.founding_year,
    industry: insights?.industry || company?.industry,
    subIndustry: insights?.sub_industry || company?.sub_industry,
    revenue: insights?.revenue || company?.revenue || company?.revenue_range,
    employees: insights?.employee_count || company?.employees || company?.employee_count,
    employeeRange: insights?.employee_count_range || company?.employee_count_range,
    headquarters: {
      city: insights?.hq_city || company?.headquarters_city,
      state: insights?.hq_state || company?.headquarters_state,
      country: insights?.hq_country || company?.headquarters_country
    },
    keywords: insights?.keywords || company?.keywords || [],
    stockSymbol: insights?.stock_symbol || company?.stock_symbol,
    alexaRanking: insights?.alexa_ranking || company?.alexa_ranking,
    totalFunding: insights?.total_funding || company?.total_funding,
    stockExchange: insights?.stock_exchange || company?.stock_exchange,
    latestFundingStage: insights?.latest_funding_stage || company?.latest_funding_stage,
    isPublic: insights?.is_public ?? company?.is_public
  };

  const hasData = Object.values(data).some(v => 
    v !== null && v !== undefined && v !== '' && 
    (Array.isArray(v) ? v.length > 0 : true) &&
    (typeof v === 'object' && !Array.isArray(v) ? Object.values(v).some(val => val) : true)
  );

  if (!hasData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum insight disponível. Clique em "Atualizar agora" para enriquecer os dados.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Descrição */}
      {data.description && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Descrição da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fundação */}
      {data.foundedYear && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Ano de Fundação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.foundedYear}</p>
          </CardContent>
        </Card>
      )}

      {/* Indústria */}
      {data.industry && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              Indústria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{data.industry}</p>
            {data.subIndustry && (
              <p className="text-sm text-muted-foreground mt-1">{data.subIndustry}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Receita */}
      {data.revenue && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Receita Estimada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{data.revenue}</p>
          </CardContent>
        </Card>
      )}

      {/* Funcionários */}
      {(data.employees || data.employeeRange) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.employees ? (
              <p className="text-2xl font-bold">{data.employees.toLocaleString()}</p>
            ) : (
              <p className="text-xl font-semibold">{data.employeeRange}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Localização */}
      {(data.headquarters.city || data.headquarters.state || data.headquarters.country) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Sede
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {[data.headquarters.city, data.headquarters.state, data.headquarters.country]
                .filter(Boolean)
                .join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status Público/Privado */}
      {data.isPublic !== null && data.isPublic !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={data.isPublic ? "default" : "secondary"} className="text-sm">
              {data.isPublic ? 'Empresa Pública' : 'Empresa Privada'}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Bolsa de Valores */}
      {data.stockSymbol && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{data.stockSymbol}</p>
            {data.stockExchange && (
              <p className="text-sm text-muted-foreground mt-1">{data.stockExchange}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financiamento */}
      {data.totalFunding && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Financiamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-purple-600">{data.totalFunding}</p>
            {data.latestFundingStage && (
              <p className="text-sm text-muted-foreground mt-1">
                Estágio: {data.latestFundingStage}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ranking Alexa */}
      {data.alexaRanking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Ranking Alexa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">#{data.alexaRanking.toLocaleString()}</p>
          </CardContent>
        </Card>
      )}

      {/* Keywords */}
      {data.keywords && data.keywords.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Palavras-chave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.keywords.slice(0, 20).map((keyword: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {data.keywords.length > 20 && (
                <Badge variant="secondary" className="text-xs">
                  +{data.keywords.length - 20} mais
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
