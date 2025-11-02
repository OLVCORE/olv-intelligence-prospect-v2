import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bot, Loader2, Send, Sparkles, TrendingUp, Users, Target, Lightbulb, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'agent';
  content: string;
  data?: any;
  timestamp: Date;
}

interface Props {
  companyId: string;
  companyName: string;
  cnpj?: string;
}

/**
 * STC Agent (Sales & TOTVS Checker Agent)
 * Agente conversacional inteligente para análise profunda de empresas
 * Usa GPT-4O-MINI para custo-benefício otimizado
 */
export function STCAgent({ companyId, companyName, cnpj }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [costInfo, setCostInfo] = useState<{ tokens: any; cost: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Carregar histórico ao abrir modal
  useEffect(() => {
    if (open && messages.length === 0) {
      loadConversationHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadConversationHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('stc_agent_conversations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          role: msg.role as 'user' | 'agent',
          content: msg.content,
          data: msg.data,
          timestamp: new Date(msg.created_at)
        }));
        setMessages(loadedMessages);
        setInitialCheckDone(true);
      } else {
        // Se não tem histórico, fazer check inicial
        startInitialCheck();
      }
    } catch (err) {
      console.error('Error loading history:', err);
      startInitialCheck();
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveMessage = async (role: 'user' | 'agent', content: string, data?: any, metadata?: any) => {
    try {
      await supabase
        .from('stc_agent_conversations')
        .insert({
          company_id: companyId,
          role,
          content,
          data,
          metadata
        });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  // Auto-scroll para o final quando novas mensagens aparecerem
  useEffect(() => {
    setTimeout(() => {
      try {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } catch {}
      const viewport = (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null)
        ?? (document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null);
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  }, [messages]);

  // Habilita scroll manual por mouse e teclado no viewport do ScrollArea
  useEffect(() => {
    const viewport = (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null)
      ?? (document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null);
    if (!viewport) return;

    // Garante que o viewport seja rolável e focável
    viewport.style.overflowY = 'auto';
    viewport.tabIndex = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const step = 60;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowDown':
          viewport.scrollTop += step;
          break;
        case 'ArrowUp':
          viewport.scrollTop -= step;
          break;
        case 'PageDown':
          viewport.scrollTop += viewport.clientHeight * 0.9;
          break;
        case 'PageUp':
          viewport.scrollTop -= viewport.clientHeight * 0.9;
          break;
        case 'Home':
          viewport.scrollTop = 0;
          break;
        case 'End':
          viewport.scrollTop = viewport.scrollHeight;
          break;
      }
    };

    const focusViewport = () => viewport.focus();
    viewport.addEventListener('keydown', onKeyDown);
    viewport.addEventListener('mouseenter', focusViewport);
    viewport.addEventListener('click', focusViewport);
    return () => {
      viewport.removeEventListener('keydown', onKeyDown);
      viewport.removeEventListener('mouseenter', focusViewport);
      viewport.removeEventListener('click', focusViewport);
    };
  }, [open]);

  const startInitialCheck = async () => {
    setLoading(true);
    
    setMessages([{
      role: 'agent',
      content: '🔍 Iniciando verificação TOTVS...',
      timestamp: new Date()
    }]);
    
    try {
      const { data, error } = await supabase.functions.invoke('stc-agent', {
        body: { 
          companyId,
          companyName, 
          cnpj,
          mode: 'initial_check'
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro desconhecido');
      
      const result = data.data;
      const metadata = data.metadata;
      
      // Salvar info de custo
      if (metadata?.tokens) {
        setCostInfo({
          tokens: metadata.tokens,
          cost: metadata.estimatedCost
        });
      }
      
      // Formatar mensagem de resposta
      let responseText = `## 📊 Análise Inicial Concluída\n\n`;
      responseText += `**Status:** ${result.status || 'N/A'}\n`;
      responseText += `**Confiança:** ${result.confidence || 'N/A'}\n`;
      responseText += `**Score:** ${result.totalScore || 0} pts\n`;
      responseText += `**Matches:** 🎯 ${result.tripleMatches || 0} Triple | 🔍 ${result.doubleMatches || 0} Double\n\n`;
      responseText += `### 💡 Análise\n${result.quickAnalysis || 'Análise não disponível'}\n\n`;
      responseText += `### 🎯 Recomendação\n${result.recommendation || 'Recomendação não disponível'}`;
      
      setMessages([{
        role: 'agent',
        content: responseText,
        data: result,
        timestamp: new Date()
      }]);
      
      // Salvar mensagem do agente
      await saveMessage('agent', responseText, result, metadata);
      
      setInitialCheckDone(true);
    } catch (err: any) {
      setMessages([{
        role: 'agent',
        content: `❌ **Erro na análise**\n\n${err.message}\n\nTente novamente ou reformule a consulta.`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || loading) return;
    
    const userMessage = userInput.trim();
    setUserInput('');
    
    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    // Salvar mensagem do usuário
    await saveMessage('user', userMessage);
    
    setLoading(true);
    
    // Adicionar mensagem de loading
    setMessages(prev => [...prev, {
      role: 'agent',
      content: '🤔 Analisando...',
      timestamp: new Date()
    }]);
    
    try {
      const { data, error } = await supabase.functions.invoke('stc-agent', {
        body: { 
          companyId,
          companyName, 
          cnpj,
          mode: 'deep_analysis',
          userQuestion: userMessage,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro desconhecido');
      
      const result = data.data;
      const metadata = data.metadata;
      
      // Atualizar info de custo
      if (metadata?.tokens) {
        setCostInfo({
          tokens: metadata.tokens,
          cost: metadata.estimatedCost
        });
      }
      
      // Remover mensagem de loading
      setMessages(prev => prev.slice(0, -1));
      
      // Adicionar resposta do agente
      setMessages(prev => [...prev, {
        role: 'agent',
        content: result.answer || 'Resposta não disponível',
        data: result,
        timestamp: new Date()
      }]);
      
      // Salvar resposta do agente
      await saveMessage('agent', result.answer || 'Resposta não disponível', result, metadata);
    } catch (err: any) {
      // Remover mensagem de loading
      setMessages(prev => prev.slice(0, -1));
      
      setMessages(prev => [...prev, {
        role: 'agent',
        content: `❌ **Erro:** ${err.message}\n\nTente reformular a pergunta.`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setUserInput(question);
  };

  const renderAgentMessage = (msg: Message) => {
    const { data } = msg;
    
    return (
      <div className="space-y-4">
        {/* Texto principal */}
        <div className="prose prose-sm max-w-none">
          {msg.content.split('\n').map((line, i) => {
            if (line.startsWith('##')) {
              return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('##', '').trim()}</h3>;
            } else if (line.startsWith('###')) {
              return <h4 key={i} className="text-base font-semibold mt-3 mb-1">{line.replace('###', '').trim()}</h4>;
            } else if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} className="font-semibold">{line.replace(/\*\*/g, '')}</p>;
            } else if (line.trim()) {
              return <p key={i} className="text-sm">{line}</p>;
            }
            return null;
          })}
        </div>
        
        {/* Evidências */}
        {data?.evidences && data.evidences.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">📄 Evidências ({data.evidences.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {data.evidences.slice(0, 5).map((ev: any, i: number) => (
                <div key={i} className="bg-background border rounded p-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <Badge variant={ev.matchType === 'triple' ? 'default' : 'secondary'} className="text-xs">
                      {ev.matchType === 'triple' ? '🎯 TRIPLE' : '🔍 DOUBLE'}
                    </Badge>
                    <span className="text-muted-foreground">Tier {ev.tier}</span>
                  </div>
                  <p className="font-medium">{ev.title}</p>
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline flex items-center gap-1 mt-1">
                      Ver fonte <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Decisores */}
        {data?.decisionMakers && data.decisionMakers.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Decisores Identificados
            </h4>
            <div className="space-y-2">
              {data.decisionMakers.map((dm: any, i: number) => (
                <div key={i} className="bg-background border rounded p-2 text-sm">
                  <p className="font-medium">{dm.name}</p>
                  <p className="text-xs text-muted-foreground">{dm.role}</p>
                  {dm.linkedin && (
                    <a href={dm.linkedin} target="_blank" rel="noopener noreferrer"
                       className="text-primary text-xs hover:underline flex items-center gap-1 mt-1">
                      LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Sinais de Compra */}
        {data?.buyingSignals && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sinais de Compra
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Score:</span>
                <Badge variant={data.buyingSignals.score >= 70 ? 'default' : 'secondary'}>
                  {data.buyingSignals.score}/100
                </Badge>
              </div>
              {data.buyingSignals.timing && (
                <div>
                  <span className="text-sm font-medium">Timing:</span>
                  <p className="text-sm text-muted-foreground">{data.buyingSignals.timing}</p>
                </div>
              )}
              {data.buyingSignals.signals && data.buyingSignals.signals.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Sinais:</span>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {data.buyingSignals.signals.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Produtos Recomendados */}
        {data?.recommendedProducts && data.recommendedProducts.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Produtos TOTVS Recomendados
            </h4>
            <div className="space-y-2">
              {data.recommendedProducts.map((prod: any, i: number) => (
                <div key={i} className="bg-background border rounded p-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{prod.product}</span>
                    <Badge variant="outline">{prod.fit}% fit</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{prod.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Estratégia de Abordagem */}
        {data?.approachStrategy && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Estratégia de Abordagem
            </h4>
            <div className="space-y-2 text-sm">
              {data.approachStrategy.channel && (
                <div>
                  <span className="font-medium">Canal:</span> {data.approachStrategy.channel}
                </div>
              )}
              {data.approachStrategy.timing && (
                <div>
                  <span className="font-medium">Timing:</span> {data.approachStrategy.timing}
                </div>
              )}
              {data.approachStrategy.pain && (
                <div>
                  <span className="font-medium">Dor Identificada:</span>
                  <p className="text-muted-foreground">{data.approachStrategy.pain}</p>
                </div>
              )}
              {data.approachStrategy.message && (
                <div>
                  <span className="font-medium">Mensagem Sugerida:</span>
                  <p className="text-muted-foreground italic bg-background p-2 rounded border mt-1">
                    "{data.approachStrategy.message}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Insights */}
        {data?.insights && data.insights.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Insights
            </h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              {data.insights.map((insight: string, i: number) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Perguntas Sugeridas */}
        {data?.suggestedQuestions && data.suggestedQuestions.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">💬 Perguntas Sugeridas</h4>
            <div className="flex flex-wrap gap-2">
              {data.suggestedQuestions.map((q: string, i: number) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={loading}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {data?.nextQuestions && data.nextQuestions.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">🔮 Próximas Perguntas</h4>
            <div className="flex flex-wrap gap-2">
              {data.nextQuestions.map((q: string, i: number) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={loading}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Button 
        onClick={() => { 
          setOpen(true); 
          if (!initialCheckDone && messages.length === 0) {
            startInitialCheck();
          }
        }}
        variant="outline"
        size="sm"
        className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 transition-all group"
      >
        <Bot className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-medium leading-tight">STC</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col min-h-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  STC Agent
                  <Badge variant="outline" className="text-xs">GPT-4O-MINI</Badge>
                </div>
                <DialogDescription className="text-xs">
                  Sales & TOTVS Checker Agent
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Header da Empresa */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-3 rounded-lg border">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{companyName}</h3>
                {cnpj && <p className="text-xs text-muted-foreground">CNPJ: {cnpj}</p>}
              </div>
              {costInfo && (
                <div className="text-right text-xs text-muted-foreground">
                  <p>Tokens: {costInfo.tokens.total_tokens}</p>
                  <p>Custo: ${costInfo.cost}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Mensagens */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 pr-4 [&_[data-radix-scroll-area-viewport]]:overflow-y-auto">
            <div className="space-y-4">
              {loadingHistory && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando histórico...</span>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      renderAgentMessage(msg)
                    )}
                    <p className="text-xs opacity-70 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              
              {/* Referência para scroll automático */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input */}
          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Faça uma pergunta sobre a empresa..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              size="icon"
              disabled={loading || !userInput.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Sugestões rápidas */}
          {initialCheckDone && messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion('Quem são os decisores?')}
                disabled={loading}
              >
                <Users className="w-3 h-3 mr-1" />
                Decisores
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion('Qual o momento de compra?')}
                disabled={loading}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Momento de Compra
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion('Que produtos TOTVS recomendar?')}
                disabled={loading}
              >
                <Target className="w-3 h-3 mr-1" />
                Produtos
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion('Como abordar esta empresa?')}
                disabled={loading}
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Estratégia
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
