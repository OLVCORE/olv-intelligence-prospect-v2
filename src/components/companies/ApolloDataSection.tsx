import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  TrendingUp, 
  Briefcase, 
  Target, 
  DollarSign, 
  Users, 
  Zap,
  Calendar,
  Award,
  BarChart3
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import apolloIcon from '@/assets/logos/apollo-icon.ico';

interface ApolloDataSectionProps {
  company: any;
}

export function ApolloDataSection({ company }: ApolloDataSectionProps) {
  if (!company.apollo_last_enriched_at) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <img src={apolloIcon} alt="Apollo" className="h-5 w-5" />
            <CardTitle>Dados Apollo.io</CardTitle>
          </div>
          <CardDescription>
            Nenhum dado Apollo disponível. Clique em "Enriquecer com Apollo" para buscar dados completos.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const lastEnriched = new Date(company.apollo_last_enriched_at).toLocaleDateString('pt-BR');
  
  return (
    <div className="space-y-6">
      {/* Header com timestamp */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={apolloIcon} alt="Apollo" className="h-6 w-6" />
              <div>
                <CardTitle>Dados Apollo.io</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Última atualização: {lastEnriched}
                </CardDescription>
              </div>
            </div>
            {company.account_score && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{company.account_score}</div>
                <div className="text-xs text-muted-foreground">Account Score</div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Market Segments & Classification */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Segmentação & Classificação</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.market_segments && company.market_segments.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Market Segments</div>
                <div className="flex flex-wrap gap-2">
                  {company.market_segments.map((segment: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{segment}</Badge>
                  ))}
                </div>
              </div>
            )}

            {company.sic_codes && company.sic_codes.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">SIC Codes</div>
                <div className="flex flex-wrap gap-2">
                  {company.sic_codes.map((code: string, idx: number) => (
                    <Badge key={idx} variant="outline">{code}</Badge>
                  ))}
                </div>
              </div>
            )}

            {company.naics_codes && company.naics_codes.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">NAICS Codes</div>
                <div className="flex flex-wrap gap-2">
                  {company.naics_codes.map((code: string, idx: number) => (
                    <Badge key={idx} variant="outline">{code}</Badge>
                  ))}
                </div>
              </div>
            )}

            {company.employee_count_from_apollo && (
              <div>
                <div className="text-sm font-medium mb-1">Funcionários (Apollo)</div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{company.employee_count_from_apollo.toLocaleString()}</span>
                </div>
              </div>
            )}

            {company.revenue_range_from_apollo && (
              <div>
                <div className="text-sm font-medium mb-1">Faixa de Receita</div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{company.revenue_range_from_apollo}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funding & Investment */}
        {(company.funding_total || company.investors?.length > 0) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Investimentos & Funding</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.funding_total && (
                <div>
                  <div className="text-sm font-medium mb-1">Total Captado</div>
                  <div className="text-2xl font-bold text-primary">
                    ${(company.funding_total / 1000000).toFixed(1)}M
                  </div>
                </div>
              )}

              {company.last_funding_round_date && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Última Rodada</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(company.last_funding_round_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  {company.last_funding_round_amount && (
                    <div>
                      <div className="text-sm font-medium mb-1">Valor</div>
                      <div className="font-semibold">
                        ${(company.last_funding_round_amount / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  )}
                </div>
              )}

              {company.funding_rounds && company.funding_rounds.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Rodadas de Investimento</div>
                  <div className="space-y-1">
                    {company.funding_rounds.slice(0, 3).map((round: any, idx: number) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        • {round.funding_type || 'N/A'} - {round.amount_display || 'N/A'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {company.investors && company.investors.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Investidores</div>
                  <div className="flex flex-wrap gap-1">
                    {company.investors.slice(0, 5).map((investor: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {investor.name || investor}
                      </Badge>
                    ))}
                    {company.investors.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{company.investors.length - 5} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Job Postings & Hiring Signals */}
        {company.job_postings_count > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Sinais de Contratação</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium mb-1">Vagas Abertas</div>
                  <div className="text-3xl font-bold text-primary">{company.job_postings_count}</div>
                </div>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
              </div>

              {company.job_postings && company.job_postings.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Áreas com Vagas</div>
                  <div className="space-y-1">
                    {company.job_postings.slice(0, 5).map((job: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{job.title || job.department}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  ✨ Empresa em crescimento - oportunidade para vendas
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buying Intent & Signals */}
        {(company.buying_intent_score || company.apollo_signals?.length > 0) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Sinais de Intenção</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.buying_intent_score && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Buying Intent Score</div>
                    <div className="text-lg font-bold text-primary">{company.buying_intent_score}/100</div>
                  </div>
                  <Progress value={company.buying_intent_score} className="h-2" />
                </div>
              )}

              {company.buying_intent_signals && company.buying_intent_signals.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Sinais Detectados</div>
                  <div className="space-y-2">
                    {company.buying_intent_signals.slice(0, 5).map((signal: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-accent/50">
                        <Zap className="h-4 w-4 text-primary mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{signal.type || signal.signal_type}</div>
                          <div className="text-xs text-muted-foreground">{signal.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {company.apollo_signals && company.apollo_signals.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Outros Sinais Apollo</div>
                  <div className="flex flex-wrap gap-2">
                    {company.apollo_signals.slice(0, 8).map((signal: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {signal.name || signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        {(company.phone_numbers?.length > 0 || company.social_urls) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Contatos & Redes Sociais</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.phone_numbers && company.phone_numbers.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Telefones</div>
                  <div className="space-y-1">
                    {company.phone_numbers.map((phone: string, idx: number) => (
                      <div key={idx} className="text-sm font-mono">{phone}</div>
                    ))}
                  </div>
                </div>
              )}

              {company.social_urls && Object.values(company.social_urls).some(url => url) && (
                <div>
                  <div className="text-sm font-medium mb-2">Redes Sociais</div>
                  <div className="space-y-1">
                    {company.social_urls.facebook && (
                      <a 
                        href={company.social_urls.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-2"
                      >
                        <span>Facebook</span>
                      </a>
                    )}
                    {company.social_urls.twitter && (
                      <a 
                        href={company.social_urls.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-2"
                      >
                        <span>Twitter/X</span>
                      </a>
                    )}
                    {company.social_urls.blog && (
                      <a 
                        href={company.social_urls.blog} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-2"
                      >
                        <span>Blog</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Apollo Metadata */}
        {company.apollo_metadata && Object.keys(company.apollo_metadata).length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Informações Adicionais</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.apollo_metadata.founded_year && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ano de Fundação</span>
                  <span className="font-medium">{company.apollo_metadata.founded_year}</span>
                </div>
              )}

              {company.apollo_metadata.ownership_type && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo de Propriedade</span>
                  <span className="font-medium">{company.apollo_metadata.ownership_type}</span>
                </div>
              )}

              {company.apollo_metadata.latest_funding_stage && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estágio de Funding</span>
                  <Badge variant="secondary">{company.apollo_metadata.latest_funding_stage}</Badge>
                </div>
              )}

              {company.apollo_metadata.keywords && company.apollo_metadata.keywords.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Keywords</div>
                  <div className="flex flex-wrap gap-1">
                    {company.apollo_metadata.keywords.slice(0, 10).map((keyword: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
