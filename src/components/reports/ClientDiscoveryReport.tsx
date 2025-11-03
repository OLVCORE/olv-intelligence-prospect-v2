import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Building2, TrendingUp } from 'lucide-react';

interface ClientDiscoveryReportProps {
  data: any;
}

export default function ClientDiscoveryReport({ data }: ClientDiscoveryReportProps) {
  const clients = data?.clientDiscovery?.topClients || [];
  const totalFound = data?.clientDiscovery?.totalFound || 0;
  
  if (clients.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Nenhum Cliente Identificado</h3>
        <p className="text-muted-foreground mb-4">
          Não foram encontradas evidências de clientes desta empresa nas fontes analisadas.
        </p>
        <p className="text-sm text-muted-foreground">
          Isso pode ocorrer se a empresa não divulga seus clientes publicamente ou se o website não possui seção de cases/clientes.
        </p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Clientes Identificados</h2>
            <p className="text-muted-foreground">
              Empresas que compram desta organização
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{totalFound}</div>
            <div className="text-sm text-muted-foreground">Total encontrado</div>
          </div>
        </div>
      </Card>
      
      {/* Lista de Clientes */}
      <div className="grid gap-4">
        {clients.map((client: any, i: number) => (
          <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {client.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {client.snippet}
                </p>
              </div>
              <Badge variant="secondary">
                {client.confidence > 80 ? 'Alta Confiança' : 'Média Confiança'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Fonte: {new URL(client.source).hostname}</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={client.source} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Evidência
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Ações Estratégicas */}
      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Oportunidades Identificadas
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">→</span>
            <span>
              <strong>{clients.length} empresas</strong> foram identificadas como clientes ativos
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">→</span>
            <span>
              Essas empresas são <strong>prospects qualificados</strong> para prospecção TOTVS
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">→</span>
            <span>
              Recomenda-se <strong>análise individual</strong> de cada cliente para validação de fit
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
