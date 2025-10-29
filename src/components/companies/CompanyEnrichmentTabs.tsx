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
import { useDecisionMakers } from "@/hooks/useDecisionMakers";

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
  const { data: decisionMakers } = useDecisionMakers(companyId);
  const peopleCount = decisionMakers?.length ?? 0;
  const similarCount = similarCompanies?.length ?? 0;
  const techCount = technologiesFull?.length ?? 0;
  const insightsCount = companyInsights ? (Array.isArray(companyInsights) ? companyInsights.length : Object.keys(companyInsights).length) : 0;
  const trendsCount = employeeTrends ? (Array.isArray(employeeTrends) ? employeeTrends.length : Object.keys(employeeTrends).length) : 0;
  const visitorsCount = websiteVisitors ? (Array.isArray(websiteVisitors) ? websiteVisitors.length : Object.keys(websiteVisitors).length) : 0;
  const newsCount = news?.length ?? 0;
  const jobsCount = jobPostings?.length ?? 0;

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
        <DecisionMakersList companyId={companyId} />
      </TabsContent>

      <TabsContent value="similar" className="mt-6">
        <SimilarCompaniesList similarCompanies={similarCompanies} />
      </TabsContent>

      <TabsContent value="technologies" className="mt-6">
        <TechnologiesFullList technologies={technologiesFull} />
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
        {news.length > 0 ? (
          <div className="space-y-4">
            {news.map((item, index) => (
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
        {jobPostings.length > 0 ? (
          <div className="space-y-4">
            {jobPostings.map((job, index) => (
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
