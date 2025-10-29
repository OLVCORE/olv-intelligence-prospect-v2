import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Target, Bot, Rocket, Clock, TrendingUp, Users, Trophy, Flame, Thermometer,
  Snowflake, Package, MessageSquare, Phone, DollarSign, AlertTriangle, Sparkles,
  CheckCircle2, ArrowRight, Building2, MapPin, Briefcase, Activity, Eye, Play
} from 'lucide-react';

export function DocumentationQualificacaoTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-primary border-b pb-3 flex items-center gap-3">
        <Target className="h-8 w-8" />
        Módulo 3: Qualificação ICP + IA
      </h2>
      
      {/* Visão Geral */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-400" />
            O QUE É QUALIFICAÇÃO ICP?
          </h3>
          <p className="text-muted-foreground mb-4">
            ICP (Ideal Customer Profile) é o perfil do cliente ideal para sua empresa. 
            A Máquina de Vendas OLV usa Inteligência Artificial para:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: Target, text: "Calcular automaticamente o score ICP (0-100 pontos)" },
              { icon: Flame, text: "Classificar leads por temperatura (🔥 HOT, 🟡 WARM, 🔵 COLD)" },
              { icon: AlertTriangle, text: "Detectar pain points (dores do cliente)" },
              { icon: Package, text: "Recomendar produtos TOTVS específicos" },
              { icon: MessageSquare, text: "Gerar proposta de valor personalizada com IA" },
              { icon: Phone, text: "Criar script de abordagem comercial pronto" },
              { icon: DollarSign, text: "Estimar ROI (retorno sobre investimento)" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                <item.icon className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Por que usar */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-green-400" />
            POR QUE USAR?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Clock, title: "Economiza 2-3 horas", desc: "de pesquisa por lead" },
              { icon: TrendingUp, title: "Aumenta conversão em 35%", desc: "foco em leads quentes" },
              { icon: Users, title: "Padroniza abordagem", desc: "todos os SDRs usam o mesmo método" },
              { icon: Trophy, title: "Melhora qualidade", desc: "das conversas comerciais" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-background rounded-lg border border-green-500/20">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <item.icon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-400">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tempo do Processo */}
      <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-cyan-400" />
            TEMPO TOTAL DO PROCESSO
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-cyan-500/20">
              <span className="font-semibold">Análise ICP (automático):</span>
              <Badge className="bg-cyan-500">15-30 segundos</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-cyan-500/20">
              <span className="font-semibold">Leitura de proposta:</span>
              <Badge className="bg-cyan-500">5-7 minutos</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-cyan-500/20">
              <span className="font-semibold">Prática de script:</span>
              <Badge className="bg-cyan-500">15-20 minutos</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-cyan-500/20 rounded-lg border-2 border-cyan-500">
              <span className="font-bold text-cyan-400">TOTAL POR LEAD:</span>
              <Badge className="bg-cyan-600">~25-30 minutos</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Em breve: Documentação completa deste módulo</h3>
        <p className="text-muted-foreground mb-4">
          Este é o módulo mais poderoso do sistema, onde a IA analisa cada lead em 7 dimensões 
          diferentes e gera propostas comerciais personalizadas.
        </p>
        <p className="text-sm text-muted-foreground">
          Conteúdo detalhado incluirá: jornada do usuário passo a passo, análise de cada dimensão do score, 
          classificação de temperatura, pain points, produtos recomendados, scripts de abordagem, tratamento de objeções e muito mais.
        </p>
      </Card>
    </div>
  );
}
