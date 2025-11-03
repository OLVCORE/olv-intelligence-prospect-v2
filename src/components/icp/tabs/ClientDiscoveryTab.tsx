import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Building2, MapPin, TrendingUp, ExternalLink, Search } from 'lucide-react';
import { useCompanySimilar } from '@/hooks/useCompanySimilar';
import { useState } from 'react';

interface ClientDiscoveryTabProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  savedData?: any[];
}

export function ClientDiscoveryTab({ companyId, companyName, cnpj, savedData }: ClientDiscoveryTabProps) {
  const { data: similarCompanies, isLoading, refetch } = useCompanySimilar(companyId);
  const [expandedLevel, setExpandedLevel] = useState<'direct' | 'indirect'>('direct');

  // Usar dados salvos se disponíveis
  const loadedFromHistory = !!savedData;
  const directClients = savedData || similarCompanies || [];
  if (!companyId) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para descobrir clientes dos clientes
        </p>
      </Card>
    );
  }

  if (isLoading && !loadedFromHistory) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Users className="w-8 h-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Descobrindo clientes em múltiplos níveis...
          </p>
        </div>
      </Card>
    );
  }

  const totalDiscovered = directClients.length;

  // Simular expansão exponencial (em produção, viria de API)
  const potentialIndirectClients = Math.floor(totalDiscovered * 3.5);

  return (
    <div className="space-y-4">
      {/* Header com estratégia de expansão */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              Expansão Exponencial de Mercado
              {loadedFromHistory && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Histórico
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              Descobrir clientes dos clientes para ampliar oportunidades
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Atualizar
          </Button>
        </div>
      </Card>

      {/* Estatísticas de descoberta */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Nível 1 - Diretos</span>
          </div>
          <div className="text-2xl font-bold mb-1">{totalDiscovered}</div>
          <Badge variant="default" className="text-xs">empresas similares</Badge>
        </Card>

        <Card className="p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Nível 2 - Potencial</span>
            </div>
            <div className="text-2xl font-bold mb-1">~{potentialIndirectClients}</div>
            <Badge variant="secondary" className="text-xs">clientes dos clientes</Badge>
          </div>
        </Card>
      </div>

      {/* Tabs para alternar entre níveis */}
      <div className="flex gap-2">
        <Button
          variant={expandedLevel === 'direct' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setExpandedLevel('direct')}
        >
          Clientes Diretos ({totalDiscovered})
        </Button>
        <Button
          variant={expandedLevel === 'indirect' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setExpandedLevel('indirect')}
        >
          Expansão Nível 2 (~{potentialIndirectClients})
        </Button>
      </div>

      {/* Lista de clientes descobertos */}
      {expandedLevel === 'direct' ? (
        <div className="space-y-3">
          {directClients.length === 0 ? (
            <Card className="p-6">
              <div className="text-center">
                <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhum cliente descoberto</h3>
                <p className="text-sm text-muted-foreground">
                  Ainda não há clientes similares identificados
                </p>
              </div>
            </Card>
          ) : (
            directClients.map((company, index) => (
              <Card key={index} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {company.similar_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      {company.location && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {company.location}
                        </Badge>
                      )}
                      {company.employees_min && company.employees_max && (
                        <Badge variant="outline" className="text-xs">
                          {company.employees_min}-{company.employees_max} funcionários
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {(company.similarity_score * 100).toFixed(0)}% similaridade
                      </Badge>
                    </div>
                    {company.source && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Fonte: {company.source}
                      </div>
                    )}
                  </div>
                  {company.similar_company_external_id && (
                    <Button size="sm" variant="ghost" asChild>
                      <a 
                        href={`https://google.com/search?q=${encodeURIComponent(company.similar_name)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="p-6">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-primary/40 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Expansão de Nível 2</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Baseado nos {totalDiscovered} clientes diretos, estima-se ~{potentialIndirectClients} empresas
              nos clientes dos clientes (expansão 3.5x)
            </p>
            <div className="p-4 bg-muted/30 rounded-lg text-left space-y-2">
              <p className="text-sm">
                <strong>Estratégia de Expansão:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Analisar fornecedores dos clientes similares</li>
                <li>• Identificar empresas no mesmo segmento dos clientes</li>
                <li>• Mapear empresas com perfil ICP nos mesmos mercados</li>
                <li>• Aplicar mesmos critérios de similaridade recursivamente</li>
              </ul>
            </div>
            <Button className="mt-4" variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Executar Expansão Completa (Em breve)
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
