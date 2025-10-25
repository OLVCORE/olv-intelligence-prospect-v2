import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, Send, FileText, Sparkles, Phone, Video, 
  MoreVertical, Paperclip, Smile, Check, CheckCheck, Clock,
  User, TrendingUp, Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  text: string;
  direction: 'in' | 'out';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

interface EnhancedWhatsAppInterfaceProps {
  contactPhone?: string;
  contactName?: string;
  companyId?: string;
  dealId?: string;
}

export function EnhancedWhatsAppInterface({ 
  contactPhone, 
  contactName, 
  companyId,
  dealId 
}: EnhancedWhatsAppInterfaceProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const templates = [
    { 
      id: 1, 
      name: '👋 Introdução', 
      category: 'intro',
      text: 'Olá {nome}! Sou {consultor} da equipe OLV Internacional. Notamos que sua empresa tem grande potencial no setor de {setor}. Gostaria de conversar sobre como podemos otimizar seus processos de procurement e supply chain?' 
    },
    { 
      id: 2, 
      name: '📊 Follow-up Proposta', 
      category: 'followup',
      text: 'Oi {nome}! Espero que esteja bem. Só passando para retomar nossa conversa sobre a proposta de {servico}. Teve tempo de avaliar? Posso esclarecer alguma dúvida?' 
    },
    { 
      id: 3, 
      name: '🎯 Agendamento Demo', 
      category: 'demo',
      text: 'Olá! Preparamos uma demonstração personalizada das nossas plataformas (STRATEVO + EXCELTTA) focada nas necessidades de {empresa}. Que tal esta semana? Tenho disponibilidade na terça às 14h ou quarta às 10h.' 
    },
    { 
      id: 4, 
      name: '💰 Proposta Comercial', 
      category: 'proposal',
      text: 'Oi {nome}! Acabamos de finalizar uma proposta comercial sob medida para {empresa}. Inclui análise de ROI detalhada e projeção de economia. Posso enviar por e-mail ou prefere que façamos uma call rápida para apresentar?' 
    },
    { 
      id: 5, 
      name: '🚀 Urgência/Oportunidade', 
      category: 'urgency',
      text: 'Olá! Identificamos uma oportunidade importante: {oportunidade}. Isso pode gerar economia imediata de {valor}% em seus custos de {area}. Podemos conversar ainda hoje?' 
    },
    { 
      id: 6, 
      name: '🎓 Conteúdo Educativo', 
      category: 'content',
      text: 'Oi {nome}! Acabamos de publicar um estudo sobre {tema} no setor de {setor}. Os resultados são impressionantes. Quer que eu envie o material?' 
    },
  ];

  const aiPrompts = [
    { id: 1, name: 'Mensagem de Vendas', prompt: 'Gere uma mensagem persuasiva focada em vendas' },
    { id: 2, name: 'Follow-up Amigável', prompt: 'Crie um follow-up informal e amigável' },
    { id: 3, name: 'Proposta de Valor', prompt: 'Escreva focando no valor e ROI' },
    { id: 4, name: 'Superação de Objeção', prompt: 'Responda uma objeção com empatia' },
  ];

  useEffect(() => {
    // Carregar mensagens do histórico
    loadMessages();
  }, [contactPhone]);

  const loadMessages = async () => {
    if (!contactPhone) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel', 'whatsapp')
        .or(`from_id.eq.${contactPhone},to_id.eq.${contactPhone}`)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data) {
        const formattedMessages: Message[] = data.map(msg => {
          const metadata = typeof msg.metadata === 'object' && msg.metadata !== null ? msg.metadata as any : {};
          const direction: 'in' | 'out' = msg.direction === 'out' ? 'out' : 'in';
          const status: 'sent' | 'delivered' | 'read' | 'failed' = 
            metadata.status === 'sent' || metadata.status === 'delivered' || metadata.status === 'read' || metadata.status === 'failed' 
              ? metadata.status 
              : 'delivered';
          return {
            id: msg.id,
            text: msg.body,
            direction,
            timestamp: new Date(msg.created_at),
            status
          };
        });
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !contactPhone) {
      toast({ title: 'Preencha a mensagem e tenha um contato válido', variant: 'destructive' });
      return;
    }

    setSending(true);
    const tempMessage: Message = {
      id: Date.now().toString(),
      text: message,
      direction: 'out',
      timestamp: new Date(),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    const currentMessage = message;
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('sdr-send-message', {
        body: {
          channel: 'whatsapp',
          to: contactPhone,
          message: currentMessage,
          companyId: companyId,
          dealId: dealId
        }
      });

      if (error) throw error;

      // Atualizar status da mensagem
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, status: 'delivered' }
          : msg
      ));

      toast({ title: '✅ Mensagem enviada com sucesso!' });
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
      toast({ 
        title: 'Erro ao enviar WhatsApp', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setSending(false);
    }
  };

  const useTemplate = (template: any) => {
    let text = template.text;
    text = text.replace('{nome}', contactName || 'Cliente');
    text = text.replace('{consultor}', 'da equipe OLV');
    text = text.replace('{empresa}', 'sua empresa');
    text = text.replace('{setor}', 'seu setor');
    text = text.replace('{servico}', 'consultoria');
    text = text.replace('{oportunidade}', 'uma oportunidade estratégica');
    text = text.replace('{valor}', '15-25');
    text = text.replace('{area}', 'procurement');
    text = text.replace('{tema}', 'otimização de custos');
    
    setMessage(text);
  };

  const generateAIMessage = async (prompt: string) => {
    setIsTyping(true);
    toast({ title: '🤖 Gerando mensagem...', description: 'Aguarde alguns segundos' });

    try {
      const { data, error } = await supabase.functions.invoke('ai-suggest-replies', {
        body: {
          context: {
            contactName,
            companyId,
            recentMessages: messages.slice(-3).map(m => m.text),
            prompt
          }
        }
      });

      if (error) throw error;

      if (data?.suggestions?.[0]) {
        setMessage(data.suggestions[0].text);
        toast({ title: '✨ Mensagem gerada!', description: 'Revise antes de enviar' });
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({ 
        title: 'Erro ao gerar mensagem', 
        description: 'Tente novamente',
        variant: 'destructive' 
      });
    } finally {
      setIsTyping(false);
    }
  };

  const makeCall = () => {
    toast({ title: '📞 Iniciando chamada WhatsApp...', description: 'Em desenvolvimento' });
  };

  const startVideoCall = () => {
    toast({ title: '📹 Iniciando videochamada...', description: 'Em desenvolvimento' });
  };

  if (!contactPhone) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <h3 className="font-semibold text-lg mb-2">WhatsApp não disponível</h3>
        <p className="text-sm text-muted-foreground">
          Adicione um telefone ao contato para começar a conversar
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[800px]">
      {/* Header */}
      <Card className="rounded-b-none border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-green-100 text-green-700">
                {contactName?.charAt(0) || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{contactName || 'Contato'}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {contactPhone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={makeCall}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={startVideoCall}>
              <Video className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-muted/20">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-xs mt-1">Comece a conversa usando um template ou digite sua mensagem</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    msg.direction === 'out'
                      ? 'bg-green-600 text-white rounded-tr-sm'
                      : 'bg-card border rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    msg.direction === 'out' ? 'text-green-100 justify-end' : 'text-muted-foreground'
                  }`}>
                    <span>{format(msg.timestamp, 'HH:mm', { locale: ptBR })}</span>
                    {msg.direction === 'out' && (
                      msg.status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-300" /> :
                      msg.status === 'delivered' ? <CheckCheck className="h-3 w-3" /> :
                      msg.status === 'sent' ? <Check className="h-3 w-3" /> :
                      <Clock className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Templates Section */}
      <Card className="rounded-none border-x-0">
        <div className="p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Templates rápidos:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {templates.map(t => (
              <Button
                key={t.id}
                size="sm"
                variant="outline"
                onClick={() => useTemplate(t)}
                className="gap-1 whitespace-nowrap flex-shrink-0"
              >
                {t.name}
              </Button>
            ))}
          </div>
          
          <p className="text-xs font-medium text-muted-foreground mb-2 mt-3">Gerar com IA:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {aiPrompts.map(p => (
              <Button
                key={p.id}
                size="sm"
                variant="outline"
                onClick={() => generateAIMessage(p.prompt)}
                className="gap-1 whitespace-nowrap flex-shrink-0"
              >
                <Sparkles className="h-3 w-3" />
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Message Input */}
      <Card className="rounded-t-none">
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <Button size="icon" variant="ghost">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={2}
              className="resize-none flex-1"
            />
            <Button size="icon" variant="ghost">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={sending || !message.trim()}
            className="w-full gap-2 bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4" />
            {sending ? 'Enviando...' : 'Enviar Mensagem'}
          </Button>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>💡 Enter para enviar, Shift+Enter para quebra de linha</span>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {messages.filter(m => m.direction === 'out').length} enviadas
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
