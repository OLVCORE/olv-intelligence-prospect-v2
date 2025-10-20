import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Gauge, TrendingUp } from "lucide-react";

export default function MaturityPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Maturidade Digital</h1>
        <p className="text-muted-foreground">
          Análise de maturidade tecnológica e recomendações de fit para soluções
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Sem empresas analisadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Avaliadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhuma avaliação realizada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Aguardando análises</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Dimensões de Maturidade
          </CardTitle>
          <CardDescription>
            Sistema de scoring baseado em 5 dimensões tecnológicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">1. Infraestrutura</h3>
            <p className="text-sm text-muted-foreground">
              Avalia servidores, cloud, conectividade e arquitetura de TI
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Sistemas Corporativos</h3>
            <p className="text-sm text-muted-foreground">
              Analisa ERP, CRM, BI e outros sistemas de gestão
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Processos Digitais</h3>
            <p className="text-sm text-muted-foreground">
              Mede automação, workflows e integração de sistemas
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4. Segurança & Compliance</h3>
            <p className="text-sm text-muted-foreground">
              Verifica políticas de segurança, backup e certificações
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5. Inovação Tecnológica</h3>
            <p className="text-sm text-muted-foreground">
              Identifica uso de IA, IoT, Analytics e tecnologias emergentes
            </p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Como os Dados São Coletados</h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                <span><strong>Serper API:</strong> Busca menções de tecnologias em notícias e websites</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                <span><strong>LinkedIn Jobs:</strong> Analisa vagas para identificar stack tecnológico</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                <span><strong>Website Analysis:</strong> Inspeciona headers e tecnologias do site</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
