import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Building2, Users, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SimilarCompaniesTabProps {
  companyId: string;
}

interface SimilarCompany {
  name: string;
  apollo_url: string;
  location?: string;
  employees?: number;
  apollo_id?: string;
}

export function SimilarCompaniesTab({ companyId }: SimilarCompaniesTabProps) {
  const { data: company, isLoading } = useQuery({
    queryKey: ['company-similar', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('similar_companies')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const similarCompanies = (company?.similar_companies as unknown as SimilarCompany[]) || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-2/3 mb-3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (similarCompanies.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma empresa similar encontrada.</p>
        <p className="text-sm mt-2">Execute o enriquecimento Apollo para descobrir empresas similares.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Mostrando <strong>{similarCompanies.length}</strong> empresa(s) similar(es)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {similarCompanies.map((similar, index) => (
          <Card key={index} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {similar.name}
                </h4>

                {similar.location && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {similar.location}
                  </div>
                )}

                {similar.employees && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {similar.employees.toLocaleString('pt-BR')} funcionários
                  </div>
                )}
              </div>

              {similar.apollo_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="shrink-0"
                >
                  <a
                    href={similar.apollo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver no Apollo"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
