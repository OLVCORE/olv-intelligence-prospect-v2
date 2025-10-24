import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Target, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaybooksPage() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ['playbooks'],
    queryFn: async () => {
      // Busca empresas base
      const { data: baseCompanies } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!baseCompanies) return [];

      // Busca relações em paralelo para todas as empresas
      const companyIds = baseCompanies.map(c => c.id);
      const [decisorsRes, maturityRes] = await Promise.all([
        supabase.from('decision_makers').select('id, name, title, company_id').in('company_id', companyIds),
        supabase.from('digital_maturity').select('overall_score, company_id').in('company_id', companyIds),
      ]);

      // Agrupa por company_id
      const decisorsByCompany = (decisorsRes.data || []).reduce((acc: any, d: any) => {
        if (!acc[d.company_id]) acc[d.company_id] = [];
        acc[d.company_id].push(d);
        return acc;
      }, {});
      
      const maturityByCompany = (maturityRes.data || []).reduce((acc: any, m: any) => {
        acc[m.company_id] = m;
        return acc;
      }, {});

      // Monta resultado final
      return baseCompanies.map(company => ({
        ...company,
        decision_makers: decisorsByCompany[company.id] || [],
        digital_maturity: maturityByCompany[company.id] ? [maturityByCompany[company.id]] : [],
      })).filter(c => c.decision_makers.length > 0); // Apenas empresas com decisores
    }
  });

  const generatePlaybook = (company: any) => {
    const score = company.digital_maturity?.[0]?.overall_score || 0;
    const decisors = company.decision_makers?.length || 0;
    
    const strategy = score < 4 
      ? 'Abordagem Educativa - Estruturação'
      : score < 7 
      ? 'Abordagem Consultiva - Evolução'
      : 'Abordagem Estratégica - Transformação';

    return {
      strategy,
      priority: decisors > 3 ? 'Alta' : decisors > 1 ? 'Média' : 'Baixa',
      actions: [
        `${decisors} decisores mapeados`,
        `Score de maturidade: ${score.toFixed(1)}`,
        score < 5 ? 'Apresentar cases de estruturação' : 'Apresentar cases de transformação'
      ]
    };
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Playbooks</h1>
        <p className="text-muted-foreground">
          Roteiros de abordagem comercial personalizados por empresa
        </p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </>
        ) : companies && companies.length > 0 ? (
          companies.map((company: any) => {
            const playbook = generatePlaybook(company);
            
            return (
              <Card key={company.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {company.name}
                      </CardTitle>
                      <CardDescription>{company.industry}</CardDescription>
                    </div>
                    <Badge variant={
                      playbook.priority === 'Alta' ? 'destructive' : 
                      playbook.priority === 'Média' ? 'default' : 'secondary'
                    }>
                      Prioridade: {playbook.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Estratégia Recomendada</span>
                      </div>
                      <p className="text-sm">{playbook.strategy}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Ações Prioritárias</span>
                      </div>
                      <ul className="space-y-1">
                        {playbook.actions.map((action, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {company.decision_makers && company.decision_makers.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold mb-2">Decisores Mapeados:</p>
                      <div className="flex flex-wrap gap-2">
                        {company.decision_makers.slice(0, 5).map((decisor: any) => (
                          <Badge key={decisor.id} variant="outline">
                            {decisor.name} - {decisor.title}
                          </Badge>
                        ))}
                        {company.decision_makers.length > 5 && (
                          <Badge variant="secondary">+{company.decision_makers.length - 5} mais</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Playbook Completo (PDF)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhum playbook disponível. Busque empresas e mapeie decisores primeiro.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
