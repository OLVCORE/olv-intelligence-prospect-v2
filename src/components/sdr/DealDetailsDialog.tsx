import { useState, useEffect } from 'react';
import { DraggableDialog } from '@/components/ui/draggable-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, Clock, User, MessageSquare, Save, Phone, Building2, Video, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Deal } from '@/hooks/useDeals';
import { useUpdateDeal, useDealActivities } from '@/hooks/useDeals';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CallInterface } from '@/components/sdr/CallInterface';
import { DealQuickActions } from '@/components/sdr/DealQuickActions';
import { VideoCallInterface } from '@/components/sdr/VideoCallInterface';
import { CommunicationTimeline } from '@/components/sdr/CommunicationTimeline';
import { WhatsAppQuickSend } from '@/components/sdr/WhatsAppQuickSend';
import { EnhancedWhatsAppInterface } from '@/components/sdr/EnhancedWhatsAppInterface';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
interface DealDetailsDialogProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealDetailsDialog({ deal, open, onOpenChange }: DealDetailsDialogProps) {
  const navigate = useNavigate();
  const updateDeal = useUpdateDeal();
  const { data: activities } = useDealActivities(deal?.id || '');
  
  const [editedDeal, setEditedDeal] = useState<Partial<Deal>>({});
  const [note, setNote] = useState('');
  const [primaryContact, setPrimaryContact] = useState<{ id: string; name?: string; email?: string; phone?: string } | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  useEffect(() => {
    if (!deal?.company_id) {
      setPrimaryContact(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingContact(true);
      try {
        const { data } = await supabase
          .from('contacts')
          .select('id, name, email, phone')
          .eq('company_id', deal.company_id as string)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!cancelled) setPrimaryContact((data as any) || null);
      } finally {
        if (!cancelled) setLoadingContact(false);
      }
    })();
    return () => { cancelled = true; };
  }, [deal?.company_id, open]);

  if (!deal) return null;

  const handleSave = async () => {
    if (Object.keys(editedDeal).length > 0) {
      await updateDeal.mutateAsync({ dealId: deal.id, updates: editedDeal });
      setEditedDeal({});
      onOpenChange(false);
    }
  };

  const currentDeal = { ...deal, ...editedDeal };

  return (
    <DraggableDialog open={open} onOpenChange={onOpenChange} title={currentDeal.title} className="max-w-4xl max-h-[90vh]">
        <div className="flex items-center justify-end mb-2">
          <Button onClick={handleSave} disabled={Object.keys(editedDeal).length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="ai">IA Sugestões</TabsTrigger>
            <TabsTrigger value="comms">Comunicação</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="activity">Atividades</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={currentDeal.title}
                    onChange={(e) => setEditedDeal({ ...editedDeal, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={currentDeal.description || ''}
                    onChange={(e) => setEditedDeal({ ...editedDeal, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Value & Probability */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      value={currentDeal.value}
                      onChange={(e) => setEditedDeal({ ...editedDeal, value: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Probabilidade (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={currentDeal.probability}
                      onChange={(e) => setEditedDeal({ ...editedDeal, probability: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={currentDeal.priority}
                      onValueChange={(value) => setEditedDeal({ ...editedDeal, priority: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={currentDeal.status}
                      onValueChange={(value) => setEditedDeal({ ...editedDeal, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="won">Ganho</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                        <SelectItem value="abandoned">Abandonado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Expected Close Date */}
                <div className="space-y-2">
                  <Label>Data Esperada de Fechamento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !currentDeal.expected_close_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentDeal.expected_close_date ? (
                          format(new Date(currentDeal.expected_close_date), "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={currentDeal.expected_close_date ? new Date(currentDeal.expected_close_date) : undefined}
                        onSelect={(date) => setEditedDeal({ ...editedDeal, expected_close_date: date?.toISOString() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <DealQuickActions deal={currentDeal} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-3 pr-4">
                {activities?.map((activity) => (
                  <div key={activity.id} className="flex gap-3 p-3 rounded-lg border bg-card">
                    <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), "PPp", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activities || activities.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma atividade registrada
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Adicionar nota..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
              <Button onClick={() => setNote('')} disabled={!note}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Adicionar Nota
              </Button>
            </div>
            <ScrollArea className="h-[45vh]">
              <p className="text-sm text-muted-foreground text-center py-8">
                Sistema de notas em desenvolvimento
              </p>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comms" className="space-y-4">
            {showVideoCall ? (
              <VideoCallInterface
                roomName={`deal-${deal.id}`}
                displayName="SDR"
                onCallEnd={() => setShowVideoCall(false)}
              />
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="grid gap-4 pr-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-blue-600" />
                      Telefonia
                    </h3>
                    {loadingContact ? (
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : primaryContact?.phone ? (
                      <CallInterface
                        phoneNumber={primaryContact.phone}
                        contactName={primaryContact.name}
                        companyId={currentDeal.company_id}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Adicione um telefone ao contato principal
                      </p>
                    )}
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Video className="h-5 w-5 text-purple-600" />
                      Videoconferência
                    </h3>
                    <Button 
                      onClick={() => setShowVideoCall(true)}
                      className="w-full gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Iniciar Videochamada Jitsi
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      📹 Sala segura e criptografada - Compartilhe o link com o cliente
                    </p>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      WhatsApp Business
                    </h3>
                    <EnhancedWhatsAppInterface
                      contactPhone={primaryContact?.phone}
                      contactName={primaryContact?.name}
                      companyId={currentDeal.company_id}
                      dealId={deal.id}
                    />
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-orange-600" />
                      Email
                    </h3>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => navigate('/sdr/inbox')}
                    >
                      <Mail className="h-4 w-4" />
                      Abrir Inbox de Email
                    </Button>
                  </Card>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <CommunicationTimeline 
              dealId={deal.id} 
              companyId={currentDeal.company_id} 
            />
          </TabsContent>
        </Tabs>
    </DraggableDialog>
  );
}
