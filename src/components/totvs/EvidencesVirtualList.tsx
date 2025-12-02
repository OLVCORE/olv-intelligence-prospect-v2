/**
 * 📋 LISTA VIRTUALIZADA DE EVIDÊNCIAS
 * 
 * Usa @tanstack/react-virtual para renderizar apenas evidências visíveis
 * Melhora performance significativamente com muitas evidências (100+)
 */

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Search, 
  Sparkles, 
  CheckCircle, 
  Package, 
  Copy, 
  Check, 
  ExternalLink,
  Flame
} from 'lucide-react';

interface Evidence {
  url: string;
  title: string;
  snippet?: string;
  content?: string;
  match_type: 'single' | 'double' | 'triple';
  source?: string;
  source_name?: string;
  detected_products?: string[];
  intent_keywords?: string[];
  validation_method?: 'ai' | 'basic' | 'linkedin_profile';
  has_intent?: boolean;
  weight?: number;
}

interface EvidencesVirtualListProps {
  evidences: Evidence[];
  companyName?: string;
  onCopyUrl?: (url: string, id: string) => void;
  onCopyTerms?: (terms: string, id: string) => void;
  copiedUrl?: string | null;
  copiedTerms?: string | null;
}

export function EvidencesVirtualList({
  evidences,
  companyName = '',
  onCopyUrl,
  onCopyTerms,
  copiedUrl,
  copiedTerms,
}: EvidencesVirtualListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: evidences.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Altura estimada de cada evidência
    overscan: 5, // Renderizar 5 itens extras acima/abaixo
  });

  // 🎨 HIGHLIGHTS ELEGANTES - Destacar empresa, TOTVS e produtos
  const highlightTerms = (text: string, products: string[] = []) => {
    if (!text) return '';
    let highlighted = text;
    
    // Criar lista completa de termos para destacar
    const allTerms = [
      companyName, // Nome da empresa
      'TOTVS', 'Totvs', 'totvs', // Variações de TOTVS
      'TOTVS S.A.', 'TOTVS S/A', // Razão social
      ...products // Produtos detectados
    ].filter(Boolean);
    
    // Remover duplicatas e ordenar por tamanho (maiores primeiro para evitar sobreposição)
    const uniqueTerms = [...new Set(allTerms)].sort((a, b) => b.length - a.length);
    
    uniqueTerms.forEach((term, index) => {
      // Escapar caracteres especiais do regex
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      
      // Cores diferentes para cada tipo de termo
      let bgColor = 'bg-yellow-400/90 dark:bg-yellow-500/80'; // Padrão: amarelo brilhante
      let textColor = 'text-gray-900 dark:text-gray-900'; // Texto escuro para contraste
      
      if (term.toUpperCase().includes('TOTVS')) {
        // TOTVS = Verde neon brilhante
        bgColor = 'bg-emerald-400/95 dark:bg-emerald-500/90';
        textColor = 'text-gray-900 dark:text-gray-900';
      } else if (term === companyName || term.toLowerCase() === companyName?.toLowerCase()) {
        // Empresa = Azul neon brilhante
        bgColor = 'bg-cyan-400/95 dark:bg-cyan-500/90';
        textColor = 'text-gray-900 dark:text-gray-900';
      }
      
      // Aplicar highlight com estilo elegante
      highlighted = highlighted.replace(
        regex, 
        `<mark class="${bgColor} ${textColor} px-1.5 py-0.5 rounded-sm font-bold shadow-lg">$1</mark>`
      );
    });
    
    return highlighted;
  };

  if (evidences.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma evidência encontrada</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const evidence = evidences[virtualItem.index];
          const evidenceId = `${evidence.source}-${virtualItem.index}`;
          const allTerms = [
            companyName,
            'TOTVS',
            ...(evidence.detected_products || []),
            ...(evidence.intent_keywords || [])
          ].filter(Boolean).join(' | ');

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Card className={`
                m-2 p-5 
                transition-all duration-300 
                hover:shadow-xl hover:scale-[1.01]
                border-l-4 
                ${evidence.match_type === 'triple' 
                  ? 'border-l-emerald-500 bg-gradient-to-r from-emerald-500/5 to-transparent' 
                  : 'border-l-blue-500 bg-gradient-to-r from-blue-500/5 to-transparent'
                }
                hover:bg-accent/30
                h-full
              `}>
                {/* HEADER - Badges e Fonte */}
                <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                  {/* LEFT: Match Type + Validation */}
                  <div className="flex gap-2 flex-wrap">
                    <Badge 
                      className={`
                        text-sm font-bold flex items-center gap-2 px-3 py-1.5 shadow-md
                        ${evidence.match_type === 'triple'
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-emerald-400'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-blue-400'
                        }
                      `}
                    >
                      {evidence.match_type === 'triple' ? (
                        <>
                          <Target className="w-4 h-4" strokeWidth={3} />
                          TRIPLE MATCH
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" strokeWidth={3} />
                          DOUBLE MATCH
                        </>
                      )}
                    </Badge>
                    
                    {evidence.validation_method && (
                      <Badge 
                        className={`
                          text-xs flex items-center gap-1.5 px-2.5 py-1 shadow-md font-bold
                          ${evidence.validation_method === 'linkedin_profile'
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-400 animate-pulse'
                            : evidence.validation_method === 'ai' 
                              ? 'bg-purple-600/90 hover:bg-purple-700 text-white border-purple-400' 
                              : 'bg-gray-600/60 hover:bg-gray-700/70 text-gray-100 border-gray-500'
                          }
                        `}
                        title={
                          evidence.validation_method === 'linkedin_profile'
                            ? '🔥 PERFIL LINKEDIN - Funcionário com experiência em TOTVS (EVIDÊNCIA FORTÍSSIMA!)'
                            : evidence.validation_method === 'ai' 
                              ? 'Validado com Inteligência Artificial' 
                              : 'Validação básica (snippet do Google)'
                        }
                      >
                        {evidence.validation_method === 'linkedin_profile' ? (
                          <>
                            <Target className="w-3.5 h-3.5 animate-pulse" />
                            💼 PERFIL LINKEDIN
                          </>
                        ) : evidence.validation_method === 'ai' ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            IA Validada
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Validação Básica
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  
                  {/* RIGHT: Fonte + Pontuação */}
                  <Badge 
                    variant="outline" 
                    className="text-xs font-semibold px-3 py-1 bg-background/80 border-2"
                  >
                    {evidence.source_name || evidence.source} • {evidence.weight || 0} pts
                  </Badge>
                </div>
                
                {/* ALERTA DE INTENÇÃO DE COMPRA */}
                {evidence.has_intent && evidence.intent_keywords?.length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg border-2 border-red-500/40 shadow-lg">
                    <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs mb-2 flex items-center gap-1.5 w-fit px-3 py-1 shadow-md">
                      <Flame className="w-4 h-4 animate-pulse" strokeWidth={2.5} />
                      🔥 INTENÇÃO DE COMPRA DETECTADA
                    </Badge>
                    <div className="text-xs text-red-200 dark:text-red-300 font-medium mt-1">
                      <strong className="text-red-100">Keywords:</strong> {evidence.intent_keywords.join(', ')}
                    </div>
                  </div>
                )}
                
                {/* TÍTULO CLICÁVEL - Com highlights elegantes */}
                <a 
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <h4 
                    className="text-base font-bold mb-3 leading-relaxed hover:text-blue-400 transition-colors cursor-pointer group-hover:underline" 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightTerms(evidence.title, evidence.detected_products) 
                    }}
                  />
                </a>
                
                {/* CONTEÚDO - Com highlights e mais espaço */}
                <p 
                  className="text-sm text-muted-foreground mb-4 line-clamp-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightTerms(evidence.content || evidence.snippet || '', evidence.detected_products) 
                  }}
                />
                
                {/* PRODUTOS DETECTADOS - Visual melhorado */}
                {evidence.detected_products?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 items-center p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                      Produtos TOTVS:
                    </span>
                    {evidence.detected_products.map((product: string) => (
                      <Badge 
                        key={product} 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs flex items-center gap-1.5 px-2.5 py-1 shadow-md font-semibold"
                      >
                        <Package className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {product}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* AÇÕES - Botões elegantes */}
                <div className="flex gap-3 flex-wrap pt-3 border-t border-border/50">
                  {onCopyUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`
                        text-xs h-8 px-4 font-semibold
                        transition-all duration-200
                        ${copiedUrl === evidenceId 
                          ? 'bg-green-500/20 border-green-500 text-green-400' 
                          : 'hover:bg-accent hover:scale-105'
                        }
                      `}
                      onClick={() => onCopyUrl(evidence.url, evidenceId)}
                    >
                      {copiedUrl === evidenceId ? (
                        <>
                          <Check className="w-4 h-4 mr-2" strokeWidth={3} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar URL
                        </>
                      )}
                    </Button>
                  )}
                  
                  {onCopyTerms && (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`
                        text-xs h-8 px-4 font-semibold
                        transition-all duration-200
                        ${copiedTerms === evidenceId 
                          ? 'bg-green-500/20 border-green-500 text-green-400' 
                          : 'hover:bg-accent hover:scale-105'
                        }
                      `}
                      onClick={() => onCopyTerms(allTerms, evidenceId)}
                    >
                      {copiedTerms === evidenceId ? (
                        <>
                          <Check className="w-4 h-4 mr-2" strokeWidth={3} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Termos
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    className="
                      text-xs h-8 px-4 font-bold
                      bg-gradient-to-r from-blue-600 to-cyan-600 
                      hover:from-blue-700 hover:to-cyan-700
                      text-white shadow-md
                      transition-all duration-200
                      hover:scale-105
                    "
                    asChild
                  >
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" strokeWidth={2.5} />
                      Ver Fonte
                    </a>
                  </Button>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

