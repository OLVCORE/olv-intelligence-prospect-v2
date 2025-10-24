import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Phone, PhoneCall, PhoneOff, Mic, MicOff,
  Clock, User, Building2, Volume2, VolumeX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CallInterfaceProps {
  phoneNumber: string;
  contactName?: string;
  companyName?: string;
  dealId?: string;
  companyId?: string;
}

export function CallInterface({
  phoneNumber,
  contactName,
  companyName,
  dealId,
  companyId,
}: CallInterfaceProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');

  const startCall = async () => {
    try {
      setCallStatus('calling');
      
      const { data, error } = await supabase.functions.invoke('twilio-make-call', {
        body: {
          to: phoneNumber,
          dealId,
          companyId,
        },
      });

      if (error) throw error;

      setCallStatus('connected');
      setIsCallActive(true);

      // Start timer
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: 'Chamada iniciada',
        description: `Conectando com ${contactName || phoneNumber}`,
      });

      // Cleanup
      return () => clearInterval(interval);
    } catch (error: any) {
      console.error('Error starting call:', error);
      setCallStatus('idle');
      toast({
        title: 'Erro ao iniciar chamada',
        description: error.message || 'Verifique suas configurações do Twilio',
        variant: 'destructive',
      });
    }
  };

  const endCall = async () => {
    setCallStatus('ended');
    setIsCallActive(false);
    
    // Log call activity
    if (companyId) {
      try {
        await supabase
          .from('activities')
          .insert({
            company_id: companyId,
            activity_type: 'call',
            title: `Chamada com ${contactName || phoneNumber}`,
            description: `Duração: ${formatDuration(callDuration)}`,
            duration_minutes: Math.ceil(callDuration / 60),
          });
      } catch (error) {
        console.error('Error logging call:', error);
      }
    }

    toast({
      title: 'Chamada encerrada',
      description: `Duração: ${formatDuration(callDuration)}`,
    });

    // Reset after animation
    setTimeout(() => {
      setCallDuration(0);
      setCallStatus('idle');
      setIsOpen(false);
    }, 2000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Phone className="h-3.5 w-3.5" />
        Ligar
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              {callStatus === 'idle' && 'Iniciar Chamada'}
              {callStatus === 'calling' && 'Chamando...'}
              {callStatus === 'connected' && 'Em Chamada'}
              {callStatus === 'ended' && 'Chamada Encerrada'}
            </DialogTitle>
            <DialogDescription>
              {contactName && (
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-4 w-4" />
                  <span>{contactName}</span>
                </div>
              )}
              {companyName && (
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4" />
                  <span>{companyName}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-6">
            {/* Avatar/Status Circle */}
            <div className="relative">
              <div
                className={cn(
                  'w-32 h-32 rounded-full flex items-center justify-center transition-all',
                  callStatus === 'calling' && 'bg-blue-500/20 animate-pulse',
                  callStatus === 'connected' && 'bg-green-500/20',
                  callStatus === 'ended' && 'bg-gray-500/20',
                  callStatus === 'idle' && 'bg-primary/20'
                )}
              >
                {callStatus === 'calling' && (
                  <Phone className="h-16 w-16 text-blue-600 animate-bounce" />
                )}
                {callStatus === 'connected' && (
                  <PhoneCall className="h-16 w-16 text-green-600" />
                )}
                {callStatus === 'ended' && (
                  <PhoneOff className="h-16 w-16 text-gray-600" />
                )}
                {callStatus === 'idle' && (
                  <Phone className="h-16 w-16 text-primary" />
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="text-center">
              <p className="text-2xl font-semibold">{phoneNumber}</p>
              {callStatus === 'connected' && (
                <Badge variant="outline" className="mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(callDuration)}
                </Badge>
              )}
            </div>

            {/* Call Controls */}
            {callStatus === 'connected' && (
              <div className="flex gap-4">
                <Button
                  variant={isMuted ? 'destructive' : 'outline'}
                  size="icon"
                  className="rounded-full h-14 w-14"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>

                <Button
                  variant={isSpeakerOn ? 'default' : 'outline'}
                  size="icon"
                  className="rounded-full h-14 w-14"
                  onClick={toggleSpeaker}
                >
                  {isSpeakerOn ? (
                    <Volume2 className="h-6 w-6" />
                  ) : (
                    <VolumeX className="h-6 w-6" />
                  )}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              {!isCallActive && callStatus === 'idle' && (
                <Button
                  onClick={startCall}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Iniciar Chamada
                </Button>
              )}

              {isCallActive && (
                <Button
                  onClick={endCall}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  Encerrar
                </Button>
              )}

              {callStatus === 'ended' && (
                <Button
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                  size="lg"
                  variant="outline"
                >
                  Fechar
                </Button>
              )}
            </div>

            {/* Recording Notice */}
            {callStatus === 'connected' && (
              <Card className="w-full p-3 bg-amber-500/10 border-amber-500/20">
                <p className="text-xs text-center text-amber-700 dark:text-amber-300">
                  🔴 Esta chamada está sendo gravada e transcrita
                </p>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
