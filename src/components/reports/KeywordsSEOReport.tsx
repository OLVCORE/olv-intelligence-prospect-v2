import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, ExternalLink } from 'lucide-react';

interface KeywordsSEOReportProps {
  data: any;
}

export default function KeywordsSEOReport({ data }: KeywordsSEOReportProps) {
  const keywords = data?.keywords || [];
  
  if (keywords.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Keywords Não Disponíveis</h3>
        <p className="text-muted-foreground mb-4">
          Não foi possível extrair keywords SEO do website da empresa.
        </p>
        <p className="text-sm text-muted-foreground">
          Isso pode ocorrer se o website não foi fornecido ou se não está acessível.
        </p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Keywords & SEO</h2>
            <p className="text-muted-foreground">
              Palavras-chave identificadas no website e análise competitiva
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{keywords.length}</div>
            <div className="text-sm text-muted-foreground">Keywords</div>
          </div>
        </div>
      </Card>
      
      {/* Top Keywords */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Top Keywords da Empresa
        </h3>
        <div className="flex flex-wrap gap-2">
          {keywords.slice(0, 30).map((keyword: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-sm">
              {keyword}
            </Badge>
          ))}
        </div>
      </Card>
      
      {/* Categorias de Keywords */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Análise de Categorias</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="font-semibold mb-2">Produto/Serviço</div>
            <div className="text-sm text-muted-foreground">
              {keywords.filter(k => 
                k.toLowerCase().includes('produto') || 
                k.toLowerCase().includes('serviço') ||
                k.toLowerCase().includes('solução')
              ).length} keywords
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="font-semibold mb-2">Tecnologia</div>
            <div className="text-sm text-muted-foreground">
              {keywords.filter(k => 
                k.toLowerCase().includes('tecnologia') || 
                k.toLowerCase().includes('sistema') ||
                k.toLowerCase().includes('software')
              ).length} keywords
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="font-semibold mb-2">Indústria/Setor</div>
            <div className="text-sm text-muted-foreground">
              {keywords.filter(k => 
                k.toLowerCase().includes('indústria') || 
                k.toLowerCase().includes('industrial') ||
                k.toLowerCase().includes('manufatura')
              ).length} keywords
            </div>
          </div>
        </div>
      </Card>
      
      {/* Estratégia SEO */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Insights de Estratégia SEO
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <span className="text-purple-600">→</span>
            <div>
              <strong>Keywords de Marca:</strong> Identificadas {keywords.filter(k => k.length > 10).length} keywords de marca/produto
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">→</span>
            <div>
              <strong>Competitividade:</strong> Use essas keywords para buscar empresas similares no mesmo nicho
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">→</span>
            <div>
              <strong>Oportunidade:</strong> Empresas com keywords similares são prospects qualificados
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">→</span>
            <div>
              <strong>Próximos Passos:</strong> Executar busca por keywords compartilhadas em ferramentas como SEMrush ou Ahrefs
            </div>
          </li>
        </ul>
      </Card>
      
      {/* Keywords Técnicas */}
      {keywords.some((k: string) => k.toLowerCase().includes('erp') || k.toLowerCase().includes('crm') || k.toLowerCase().includes('sistema')) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Keywords Técnicas Detectadas</h3>
          <div className="flex flex-wrap gap-2">
            {keywords
              .filter((k: string) => 
                k.toLowerCase().includes('erp') || 
                k.toLowerCase().includes('crm') ||
                k.toLowerCase().includes('sistema') ||
                k.toLowerCase().includes('gestão') ||
                k.toLowerCase().includes('software')
              )
              .map((keyword: string, i: number) => (
                <Badge key={i} variant="outline" className="text-sm border-primary">
                  {keyword}
                </Badge>
              ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Estas keywords indicam que a empresa tem forte presença digital em tecnologia/software.
          </p>
        </Card>
      )}
    </div>
  );
}
