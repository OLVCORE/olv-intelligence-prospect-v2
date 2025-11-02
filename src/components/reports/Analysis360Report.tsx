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
  Twitter
} from 'lucide-react';

interface Analysis360ReportProps {
  data: any;
  companyName: string;
}

export default function Analysis360Report({ data, companyName }: Analysis360ReportProps) {
  
  if (!data) {
    return (
      <Card className="p-12 text-center">
        <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">Dados não disponíveis</h3>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Análise 360° - {companyName}</h1>
        </div>
      </Card>

      {/* Score ICP */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
          <Award className="w-6 h-6 text-primary" />
          Score ICP
        </h2>
        <div className="flex items-center gap-6">
          <div className="text-6xl font-bold text-primary">
            {data.icpScore || 0}
          </div>
          <div className="flex-1">
            <div className="w-full bg-muted rounded-full h-6">
              <div 
                className="bg-gradient-to-r from-primary to-primary/70 h-6 rounded-full transition-all"
                style={{ width: `${data.icpScore || 0}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* SWOT */}
      {data.swot && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
            <Shield className="w-6 h-6 text-primary" />
            Análise SWOT
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-500/10 p-5 rounded-lg border-2 border-green-500/20">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-foreground">
                <CheckCircle className="w-5 h-5 text-green-500" />Forças
              </h3>
              <ul className="space-y-2">
                {data.swot.strengths?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-500/10 p-5 rounded-lg border-2 border-red-500/20">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-foreground">
                <XCircle className="w-5 h-5 text-red-500" />Fraquezas
              </h3>
              <ul className="space-y-2">
                {data.swot.weaknesses?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-500/10 p-5 rounded-lg border-2 border-blue-500/20">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-foreground">
                <Lightbulb className="w-5 h-5 text-blue-500" />Oportunidades
              </h3>
              <ul className="space-y-2">
                {data.swot.opportunities?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-yellow-500/10 p-5 rounded-lg border-2 border-yellow-500/20">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />Ameaças
              </h3>
              <ul className="space-y-2">
                {data.swot.threats?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Redes Sociais */}
      {data.redesSociais && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Presença Digital</h2>
          <div className="grid grid-cols-4 gap-4">
            {data.redesSociais.linkedin && (
              <div className="bg-blue-500/10 p-5 rounded-lg text-center border-2 border-blue-500/20">
                <Linkedin className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                <p className="font-semibold mb-1 text-foreground">LinkedIn</p>
                <p className="text-2xl font-bold text-blue-500">{data.redesSociais.linkedin.followers || 0}</p>
              </div>
            )}
            {data.redesSociais.facebook && (
              <div className="bg-blue-500/10 p-5 rounded-lg text-center border-2 border-blue-500/20">
                <Facebook className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                <p className="font-semibold mb-1 text-foreground">Facebook</p>
                <p className="text-2xl font-bold text-blue-600">{data.redesSociais.facebook.followers || 0}</p>
              </div>
            )}
            {data.redesSociais.instagram && (
              <div className="bg-pink-500/10 p-5 rounded-lg text-center border-2 border-pink-500/20">
                <Instagram className="w-10 h-10 mx-auto mb-3 text-pink-500" />
                <p className="font-semibold mb-1 text-foreground">Instagram</p>
                <p className="text-2xl font-bold text-pink-500">{data.redesSociais.instagram.followers || 0}</p>
              </div>
            )}
            {data.redesSociais.twitter && (
              <div className="bg-sky-500/10 p-5 rounded-lg text-center border-2 border-sky-500/20">
                <Twitter className="w-10 h-10 mx-auto mb-3 text-sky-500" />
                <p className="font-semibold mb-1 text-foreground">Twitter</p>
                <p className="text-2xl font-bold text-sky-500">{data.redesSociais.twitter.followers || 0}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
            <Lightbulb className="w-6 h-6 text-primary" />
            Insights
          </h2>
          <div className="space-y-3">
            {data.insights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-card rounded-lg border-2 border-border">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
