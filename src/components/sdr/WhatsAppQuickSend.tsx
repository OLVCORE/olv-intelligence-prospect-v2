import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppQuickSendProps {
  contactPhone?: string;
  contactName?: string;
  companyId?: string;
}

export function WhatsAppQuickSend({ contactPhone, contactName, companyId }: WhatsAppQuickSendProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [templates] = useState([
    { id: 1, name: 'Intro', text: 'Olá! Sou da equipe TOTVS. Gostaria de conversar sobre soluções para sua empresa.' },
    { id: 2, name: 'Follow-up', text: 'Oi! Só passando para retomar nossa conversa. Teve tempo de avaliar a proposta?' },
    { id: 3, name: 'Demo', text: 'Olá! Preparamos uma demo personalizada. Quando seria um bom horário para você?' }
  ]);

  const sendMessage = async () => {
    if (!message.trim() || !contactPhone) {
      toast({ title: 'Preencha a mensagem e tenha um contato válido', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('sdr-send-message', {
        body: {
          channel: 'whatsapp',
          to: contactPhone,
          message: message,
          companyId: companyId
        }
      });

      if (error) throw error;

      toast({ title: '✅ Mensagem enviada via WhatsApp!' });
      setMessage('');
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      toast({ 
        title: 'Erro ao enviar WhatsApp', 
        description: error.message || 'Verifique se Twilio está configurado',
        variant: 'destructive' 
      });
    } finally {
      setSending(false);
    }
  };

  const useTemplate = (template: any) => {
    setMessage(template.text);
  };

  const generateAIMessage = async () => {
    toast({ title: '🤖 Gerando mensagem com IA...', description: 'Em desenvolvimento' });
  };

  if (!contactPhone) {
    return (
      <Card className="p-4 text-center">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm text-muted-foreground">
          Adicione um telefone ao contato para enviar WhatsApp
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-semibold">WhatsApp</h3>
            <p className="text-xs text-muted-foreground">{contactPhone}</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <span className="w-2 h-2 bg-green-600 rounded-full" />
          Ativo
        </Badge>
      </div>

      {/* Templates */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Templates rápidos:</p>
        <div className="flex flex-wrap gap-2">
          {templates.map(t => (
            <Button
              key={t.id}
              size="sm"
              variant="outline"
              onClick={() => useTemplate(t)}
              className="gap-1"
            >
              <FileText className="h-3 w-3" />
              {t.name}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={generateAIMessage}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3" />
            IA
          </Button>
        </div>
      </div>

      {/* Message Input */}
      <Textarea
        placeholder="Digite sua mensagem..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="resize-none"
      />

      {/* Send Button */}
      <Button
        onClick={sendMessage}
        disabled={sending || !message.trim()}
        className="w-full gap-2"
      >
        <Send className="h-4 w-4" />
        {sending ? 'Enviando...' : 'Enviar WhatsApp'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        💡 Mensagem será enviada via Twilio WhatsApp Business API
      </p>
    </div>
  );
}
