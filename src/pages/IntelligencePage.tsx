import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, TrendingUp, Building2 } from "lucide-react";

export default function IntelligencePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Intelligence</h1>
        <p className="text-muted-foreground">
          Análise de decisores, sinais de compra e inteligência competitiva
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decisores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhum decisor encontrado ainda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinais de Compra</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Aguardando análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Analisadas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Busque empresas primeiro</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Como Funciona a Intelligence
          </CardTitle>
          <CardDescription>
            Sistema de análise em tempo real usando múltiplas fontes de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">1. Identificação de Decisores</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Usando Apollo.io e PhantomBuster para encontrar:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                C-Level (CEO, CTO, CFO)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Diretores de TI e Tecnologia
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Gerentes de Compras e Procurement
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Enriquecimento de Contatos</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Hunter.io valida e encontra emails profissionais
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Detecção de Sinais de Compra</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Monitoramento automático de:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Vagas de emprego (novas contratações de TI)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Notícias de expansão ou investimento
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Mudanças organizacionais
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Busque uma empresa primeiro na aba "Buscar Empresas" para ver a intelligence em ação
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
