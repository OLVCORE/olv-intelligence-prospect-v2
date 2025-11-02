import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Award,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  TrendingUp
} from 'lucide-react';

interface Analysis360ReportProps {
  data: any;
  companyName: string;
}

export default function Analysis360Report({ data, companyName }: Analysis360ReportProps) {
  
  if (!data) {
    return (
      <Card className="p-12 text-center border-2 border-dashed">
        <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">Dados não disponíveis</h3>
        <p className="text-muted-foreground">Execute a análise para gerar o relatório</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="p-8 bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/30 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Target className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Análise 360° - {companyName}</h1>
        </div>
      </Card>

      {/* Score ICP */}
      <Card className="p-8 bg-gradient-to-br from-primary/15 via-primary/8 to-background border-2 border-primary/30 shadow-lg">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-foreground">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Award className="w-8 h-8 text-primary" />
          </div>
          Score ICP (Ideal Customer Profile)
        </h2>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center justify-center w-40 h-40 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-2xl">
            <p className="text-7xl font-bold text-primary-foreground mb-1">
              {data.icpScore || 0}
            </p>
            <p className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-wide">
              Pontos
            </p>
          </div>
          <div className="flex-1">
            <div className="w-full bg-muted rounded-full h-8 shadow-inner border-2 border-border overflow-hidden">
              <div 
                className="h-8 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-4 bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-lg"
                style={{ width: `${data.icpScore || 0}%` }}
              >
                <span className="text-sm font-bold text-primary-foreground">
                  {data.icpScore || 0}%
                </span>
              </div>
            </div>
            <div className="flex justify-between mt-3 text-xs font-semibold text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* SWOT */}
      {data.swot && (
        <Card className="p-8 border-2 border-border shadow-lg bg-card">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-foreground">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            Análise SWOT
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/30 shadow-md">
              <h3 className="font-bold mb-5 flex items-center gap-2 text-foreground text-xl">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                Forças
              </h3>
              <ul className="space-y-3">
                {data.swot.strengths?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-card/50 rounded-lg border border-green-500/20">
                    <span className="text-green-600 font-bold text-lg flex-shrink-0">•</span>
                    <span className="text-sm text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border-2 border-red-500/30 shadow-md">
              <h3 className="font-bold mb-5 flex items-center gap-2 text-foreground text-xl">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                Fraquezas
              </h3>
              <ul className="space-y-3">
                {data.swot.weaknesses?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-card/50 rounded-lg border border-red-500/20">
                    <span className="text-red-600 font-bold text-lg flex-shrink-0">•</span>
                    <span className="text-sm text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/30 shadow-md">
              <h3 className="font-bold mb-5 flex items-center gap-2 text-foreground text-xl">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                </div>
                Oportunidades
              </h3>
              <ul className="space-y-3">
                {data.swot.opportunities?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-card/50 rounded-lg border border-blue-500/20">
                    <span className="text-blue-600 font-bold text-lg flex-shrink-0">•</span>
                    <span className="text-sm text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-2 border-amber-500/30 shadow-md">
              <h3 className="font-bold mb-5 flex items-center gap-2 text-foreground text-xl">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                Ameaças
              </h3>
              <ul className="space-y-3">
                {data.swot.threats?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-card/50 rounded-lg border border-amber-500/20">
                    <span className="text-amber-600 font-bold text-lg flex-shrink-0">•</span>
                    <span className="text-sm text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Card>
      )}

      {/* Redes Sociais */}
      {data.redesSociais && (
        <Card className="p-8 border-2 border-border shadow-lg bg-card">
          <h2 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            Presença Digital
          </h2>
          <div className="grid grid-cols-4 gap-6">
            {data.redesSociais.linkedin && (
              <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/30 text-center shadow-md hover:shadow-xl transition-shadow">
                <div className="p-4 bg-blue-500/20 rounded-full w-fit mx-auto mb-4">
                  <Linkedin className="w-12 h-12 text-blue-600" />
                </div>
                <p className="font-semibold mb-2 text-foreground">LinkedIn</p>
                <p className="text-4xl font-bold text-blue-600 mb-1">{data.redesSociais.linkedin.followers || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Seguidores</p>
              </Card>
            )}
            {data.redesSociais.facebook && (
              <Card className="p-6 bg-gradient-to-br from-blue-600/10 to-blue-600/5 border-2 border-blue-600/30 text-center shadow-md hover:shadow-xl transition-shadow">
                <div className="p-4 bg-blue-600/20 rounded-full w-fit mx-auto mb-4">
                  <Facebook className="w-12 h-12 text-blue-700" />
                </div>
                <p className="font-semibold mb-2 text-foreground">Facebook</p>
                <p className="text-4xl font-bold text-blue-700 mb-1">{data.redesSociais.facebook.followers || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Seguidores</p>
              </Card>
            )}
            {data.redesSociais.instagram && (
              <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-2 border-pink-500/30 text-center shadow-md hover:shadow-xl transition-shadow">
                <div className="p-4 bg-pink-500/20 rounded-full w-fit mx-auto mb-4">
                  <Instagram className="w-12 h-12 text-pink-600" />
                </div>
                <p className="font-semibold mb-2 text-foreground">Instagram</p>
                <p className="text-4xl font-bold text-pink-600 mb-1">{data.redesSociais.instagram.followers || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Seguidores</p>
              </Card>
            )}
            {data.redesSociais.twitter && (
              <Card className="p-6 bg-gradient-to-br from-sky-500/10 to-sky-500/5 border-2 border-sky-500/30 text-center shadow-md hover:shadow-xl transition-shadow">
                <div className="p-4 bg-sky-500/20 rounded-full w-fit mx-auto mb-4">
                  <Twitter className="w-12 h-12 text-sky-600" />
                </div>
                <p className="font-semibold mb-2 text-foreground">Twitter</p>
                <p className="text-4xl font-bold text-sky-600 mb-1">{data.redesSociais.twitter.followers || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Seguidores</p>
              </Card>
            )}
          </div>
        </Card>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <Card className="p-8 bg-gradient-to-br from-primary/15 via-primary/8 to-background border-2 border-primary/30 shadow-lg">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-foreground">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
            Insights Estratégicos
          </h2>
          <div className="space-y-4">
            {data.insights.map((insight: string, index: number) => (
              <Card key={index} className="p-6 bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/20 rounded-full flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-base text-foreground leading-relaxed font-medium">{insight}</p>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
