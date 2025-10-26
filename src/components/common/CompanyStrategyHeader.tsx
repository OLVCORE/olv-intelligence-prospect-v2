import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Users, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface CompanyStrategyHeaderProps {
  companyId: string;
}

export function CompanyStrategyHeader({ companyId }: CompanyStrategyHeaderProps) {
  const { data: company, isLoading } = useQuery({
    queryKey: ['company-header', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, industry, employees, cnpj')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!company) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">{company.name}</h2>
                <p className="text-sm text-muted-foreground">Estratégia de Conta</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {company.industry && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{company.industry}</span>
                </div>
              )}
              {company.employees && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{company.employees} funcionários</span>
                </div>
              )}
            </div>
          </div>

          {company.cnpj && (
            <Badge variant="outline" className="text-xs font-mono">
              CNPJ: {company.cnpj}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
