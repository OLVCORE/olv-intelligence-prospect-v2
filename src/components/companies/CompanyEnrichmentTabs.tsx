import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DecisionMakersList } from "./DecisionMakersList";
import { SimilarCompaniesList } from "./SimilarCompaniesList";
import { TechnologiesFullList } from "./TechnologiesFullList";
import { 
  Users, 
  Building2, 
  Cpu, 
  TrendingUp, 
  Globe, 
  Lightbulb,
  Newspaper,
  Briefcase 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCompanyPeople } from "@/hooks/useCompanyPeople";
import { useCompanySimilar } from "@/hooks/useCompanySimilar";
import { useCompanyTechnologies } from "@/hooks/useCompanyTechnologies";
import { useCompanyNews } from "@/hooks/useCompanyNews";
import { useCompanyJobs } from "@/hooks/useCompanyJobs";

interface CompanyEnrichmentTabsProps {
  companyId: string;
  similarCompanies?: any[];
  technologiesFull?: any[];
  employeeTrends?: any;
  websiteVisitors?: any;
  companyInsights?: any;
  news?: any[];
  jobPostings?: any[];
}

export function CompanyEnrichmentTabs({
  companyId,
  similarCompanies = [],
  technologiesFull = [],
  employeeTrends,
  websiteVisitors,
  companyInsights,
  news = [],
  jobPostings = [],
}: CompanyEnrichmentTabsProps) {
  // Buscar dados das novas tabelas
  const { data: people = [] } = useCompanyPeople(companyId);
  const { data: similar = [] } = useCompanySimilar(companyId);
  const { data: technologies = [] } = useCompanyTechnologies(companyId);
  const { data: newsFromDB = [] } = useCompanyNews(companyId);
  const { data: jobsFromDB = [] } = useCompanyJobs(companyId);

  // Usar dados do banco se disponíveis, senão fallback para props
  const finalPeople = people.length > 0 ? people : [];
  const finalSimilar = similar.length > 0 ? similar : similarCompanies;
  const finalTechnologies = technologies.length > 0 ? technologies : technologiesFull;
  const finalNews = newsFromDB.length > 0 ? newsFromDB : news;
  const finalJobs = jobsFromDB.length > 0 ? jobsFromDB : jobPostings;

  const peopleCount = finalPeople.length;
  const similarCount = finalSimilar.length;
  const techCount = finalTechnologies.length;
  const insightsCount = companyInsights ? (Array.isArray(companyInsights) ? companyInsights.length : Object.keys(companyInsights).length) : 0;
  const trendsCount = employeeTrends ? (Array.isArray(employeeTrends) ? employeeTrends.length : Object.keys(employeeTrends).length) : 0;
  const visitorsCount = websiteVisitors ? (Array.isArray(websiteVisitors) ? websiteVisitors.length : Object.keys(websiteVisitors).length) : 0;
  const newsCount = finalNews.length;
  const jobsCount = finalJobs.length;

  return (
    <Tabs defaultValue="people" className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
        <TabsTrigger value="people" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">People</span>
          <Badge variant="secondary" className="ml-1">{peopleCount}</Badge>
        </TabsTrigger>
        
        <TabsTrigger value="similar" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Similares</span>
          <Badge variant="secondary" className="ml-1">{similarCount}</Badge>
        </TabsTrigger>
        
        <TabsTrigger value="technologies" className="gap-2">
          <Cpu className="h-4 w-4" />
          <span className="hidden sm:inline">Tech Stack</span>
          <Badge variant="secondary" className="ml-1">{techCount}</Badge>
        </TabsTrigger>
        
        <TabsTrigger value="insights" className="gap-2">
          <Lightbulb className="h-4 w-4" />
          <span className="hidden sm:inline">Insights</span>
          <Badge variant="secondary" className="ml-1">{insightsCount}</Badge>
        </TabsTrigger>
        
        <TabsTrigger value="trends" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Tendências</span>
          <Badge variant="secondary" className="ml-1">{trendsCount}</Badge>
        </TabsTrigger>
        
        <TabsTrigger value="visitors" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Visitantes</span>
          <Badge variant="secondary" className="ml-1">{visitorsCount}</Badge>
        </TabsTrigger>
        
        <TabsTrigger value="news" className="gap-2">
          <Newspaper className="h-4 w-4" />
          <span className="hidden sm:inline">News</span>
          <Badge variant="secondary" className="ml-1">{newsCount}</Badge>
        </TabsTrigger>
        
        <TabsTrigger value="jobs" className="gap-2">
          <Briefcase className="h-4 w-4" />
          <span className="hidden sm:inline">Vagas</span>
          <Badge variant="secondary" className="ml-1">{jobsCount}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="people" className="mt-6">
        {finalPeople.length > 0 ? (
          <div className="space-y-3">
            {finalPeople.map((person: any) => (
              <div key={person.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{person.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{person.job_title || person.title_at_company}</p>
                    {person.department && (
                      <p className="text-xs text-muted-foreground">{person.department}</p>
                    )}
                    {person.email_primary && (
                      <p className="text-sm">{person.email_primary}</p>
                    )}
                  </div>
                  {person.linkedin_url && (
                    <a
                      href={person.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      LinkedIn →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma pessoa encontrada. Clique em "Atualizar agora" para buscar dados.
          </div>
        )}
      </TabsContent>

      <TabsContent value="similar" className="mt-6">
        {finalSimilar.length > 0 ? (
          <div className="space-y-3">
            {finalSimilar.map((company: any, idx: number) => (
              <div key={company.similar_company_external_id || idx} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="space-y-1">
                  <h4 className="font-semibold">{company.similar_name || company.name}</h4>
                  {company.location && (
                    <p className="text-sm text-muted-foreground">{company.location}</p>
                  )}
                  {(company.employees_min || company.employees) && (
                    <p className="text-sm text-muted-foreground">
                      {company.employees_min && company.employees_max
                        ? `${company.employees_min} - ${company.employees_max} funcionários`
                        : `${company.employees || company.employees_min} funcionários`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma empresa similar encontrada. Clique em "Atualizar agora" para buscar dados.
          </div>
        )}
      </TabsContent>

      <TabsContent value="technologies" className="mt-6">
        {finalTechnologies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {finalTechnologies.map((tech: any, idx: number) => (
              <div key={tech.technology || tech.name || idx} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                <div className="font-medium text-sm">{tech.technology || tech.name}</div>
                {tech.category && (
                  <p className="text-xs text-muted-foreground mt-1">{tech.category}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma tecnologia encontrada. Clique em "Atualizar agora" para buscar dados.
          </div>
        )}
      </TabsContent>

      <TabsContent value="insights" className="mt-6">
        {companyInsights ? (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {JSON.stringify(companyInsights, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum insight disponível para esta empresa.
          </div>
        )}
      </TabsContent>

      <TabsContent value="trends" className="mt-6">
        {employeeTrends ? (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {JSON.stringify(employeeTrends, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma tendência de empregados disponível.
          </div>
        )}
      </TabsContent>

      <TabsContent value="visitors" className="mt-6">
        {websiteVisitors ? (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {JSON.stringify(websiteVisitors, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum dado de visitantes disponível.
          </div>
        )}
      </TabsContent>

      <TabsContent value="news" className="mt-6">
        {finalNews.length > 0 ? (
          <div className="space-y-3">
            {finalNews.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold">{item.title || "Sem título"}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {item.snippet || item.description || "Sem descrição"}
                </p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Ler mais →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma notícia disponível para esta empresa.
          </div>
        )}
      </TabsContent>

      <TabsContent value="jobs" className="mt-6">
        {finalJobs.length > 0 ? (
          <div className="space-y-3">
            {finalJobs.map((job: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold">{job.title || "Sem título"}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {job.location || "Localização não especificada"}
                </p>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Ver vaga →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma vaga disponível para esta empresa.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
