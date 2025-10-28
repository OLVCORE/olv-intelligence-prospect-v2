import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code2, Calendar, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TechnologiesTabProps {
  companyId: string;
}

interface Technology {
  name: string;
  category?: string;
  source?: string;
  detected_at?: string;
  confidence?: number;
}

export function TechnologiesTab({ companyId }: TechnologiesTabProps) {
  const { data: company, isLoading } = useQuery({
    queryKey: ['company-technologies', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('technologies_full, technologies')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const technologies = (company?.technologies_full as unknown as Technology[]) || [];
  const fallbackTechs = (company?.technologies as unknown as string[]) || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-2/3 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (technologies.length === 0 && fallbackTechs.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma tecnologia detectada.</p>
        <p className="text-sm mt-2">Execute o enriquecimento Apollo para descobrir as tecnologias usadas.</p>
      </Card>
    );
  }

  // Se não há technologies_full, usar o fallback do campo antigo
  const techList = technologies.length > 0 
    ? technologies 
    : fallbackTechs.map((name: string) => ({ name }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Mostrando <strong>{techList.length}</strong> tecnologia(s) detectada(s)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techList.map((tech: Technology, index: number) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  {tech.name}
                </h4>
                {tech.confidence && (
                  <Badge variant="secondary" className="text-xs">
                    {tech.confidence}%
                  </Badge>
                )}
              </div>

              {tech.category && (
                <Badge variant="outline" className="text-xs">
                  {tech.category}
                </Badge>
              )}

              {tech.source && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  Fonte: {tech.source}
                </div>
              )}

              {tech.detected_at && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(tech.detected_at).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
