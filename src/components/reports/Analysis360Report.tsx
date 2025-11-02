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
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Dados não disponíveis</h3>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold">Análise 360° - {companyName}</h1>
        </div>
      </Card>

      {/* Score ICP */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-blue-600" />
          Score ICP
        </h2>
        <div className="flex items-center gap-6">
          <div className="text-6xl font-bold text-blue-600">
            {data.icpScore || 0}
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-6 rounded-full"
                style={{ width: `${data.icpScore || 0}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* SWOT */}
      {data.swot && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Análise SWOT
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-50 p-5 rounded-lg border-2 border-green-200">
              <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />Forças
              </h3>
              <ul className="space-y-2">
                {data.swot.strengths?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 p-5 rounded-lg border-2 border-red-200">
              <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" />Fraquezas
              </h3>
              <ul className="space-y-2">
                {data.swot.weaknesses?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-600">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
              <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />Oportunidades
              </h3>
              <ul className="space-y-2">
                {data.swot.opportunities?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-yellow-50 p-5 rounded-lg border-2 border-yellow-200">
              <h3 className="font-bold text-yellow-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />Ameaças
              </h3>
              <ul className="space-y-2">
                {data.swot.threats?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span className="text-sm">{item}</span>
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
          <h2 className="text-2xl font-bold mb-6">Presença Digital</h2>
          <div className="grid grid-cols-4 gap-4">
            {data.redesSociais.linkedin && (
              <div className="bg-blue-50 p-5 rounded-lg text-center border border-blue-200">
                <Linkedin className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                <p className="font-semibold mb-1">LinkedIn</p>
                <p className="text-2xl font-bold text-blue-600">{data.redesSociais.linkedin.followers || 0}</p>
              </div>
            )}
            {data.redesSociais.facebook && (
              <div className="bg-blue-50 p-5 rounded-lg text-center border border-blue-200">
                <Facebook className="w-10 h-10 mx-auto mb-3 text-blue-700" />
                <p className="font-semibold mb-1">Facebook</p>
                <p className="text-2xl font-bold text-blue-700">{data.redesSociais.facebook.followers || 0}</p>
              </div>
            )}
            {data.redesSociais.instagram && (
              <div className="bg-pink-50 p-5 rounded-lg text-center border border-pink-200">
                <Instagram className="w-10 h-10 mx-auto mb-3 text-pink-600" />
                <p className="font-semibold mb-1">Instagram</p>
                <p className="text-2xl font-bold text-pink-600">{data.redesSociais.instagram.followers || 0}</p>
              </div>
            )}
            {data.redesSociais.twitter && (
              <div className="bg-sky-50 p-5 rounded-lg text-center border border-sky-200">
                <Twitter className="w-10 h-10 mx-auto mb-3 text-sky-500" />
                <p className="font-semibold mb-1">Twitter</p>
                <p className="text-2xl font-bold text-sky-500">{data.redesSociais.twitter.followers || 0}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-600" />
            Insights
          </h2>
          <div className="space-y-3">
            {data.insights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-amber-200">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
