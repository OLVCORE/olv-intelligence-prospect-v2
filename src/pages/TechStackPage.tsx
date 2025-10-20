import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Cloud, Shield, Code, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function TechStackPage() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ['tech-stack'],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .not('technologies', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  const getTechIcon = (tech: string) => {
    const t = tech.toLowerCase();
    if (t.includes('cloud') || t.includes('aws') || t.includes('azure')) return Cloud;
    if (t.includes('database') || t.includes('sql') || t.includes('db')) return Database;
    if (t.includes('security') || t.includes('firewall')) return Shield;
    if (t.includes('api') || t.includes('integration')) return Code;
    return Wrench;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Tech Stack</h1>
        <p className="text-muted-foreground">
          Análise de tecnologias detectadas nas empresas prospectadas
        </p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
          </>
        ) : companies && companies.length > 0 ? (
          companies.map((company: any) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      {company.name}
                    </CardTitle>
                    <CardDescription>{company.industry || 'Setor não especificado'}</CardDescription>
                  </div>
                  {company.employees && (
                    <Badge variant="outline">{company.employees} funcionários</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {company.technologies && company.technologies.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">Tecnologias Detectadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {company.technologies.map((tech: string, idx: number) => {
                        const Icon = getTechIcon(tech);
                        return (
                          <Badge key={idx} variant="secondary" className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" />
                            {tech}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma tecnologia detectada</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhuma empresa com tecnologias detectadas. Faça buscas para coletar dados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
