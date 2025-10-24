import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoCallInterfaceProps {
  roomName: string;
  displayName: string;
  onCallEnd?: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function VideoCallInterface({ roomName, displayName, onCallEnd }: VideoCallInterfaceProps) {
  const { toast } = useToast();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  useEffect(() => {
    loadJitsiScript();
    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, []);

  const loadJitsiScript = () => {
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => initJitsi();
    document.body.appendChild(script);
  };

  const initJitsi = () => {
    if (!jitsiContainerRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: `lovable-crm-${roomName}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: displayName,
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'chat',
          'filmstrip', 'hangup', 'settings', 'raisehand',
          'videoquality', 'fullscreen', 'tileview'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      }
    };

    const jitsiAPI = new window.JitsiMeetExternalAPI(domain, options);

    jitsiAPI.addListener('videoConferenceJoined', () => {
      setIsLoading(false);
      toast({ title: 'Conectado à videoconferência!' });
    });

    jitsiAPI.addListener('videoConferenceLeft', () => {
      onCallEnd?.();
    });

    jitsiAPI.addListener('readyToClose', () => {
      jitsiAPI.dispose();
      onCallEnd?.();
    });

    setApi(jitsiAPI);
  };

  const toggleVideo = () => {
    if (api) {
      api.executeCommand('toggleVideo');
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (api) {
      api.executeCommand('toggleAudio');
      setIsAudioOn(!isAudioOn);
    }
  };

  const shareScreen = () => {
    if (api) {
      api.executeCommand('toggleShareScreen');
    }
  };

  const endCall = () => {
    if (api) {
      api.executeCommand('hangup');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="text-center">
              <Video className="h-16 w-16 mx-auto mb-4 animate-pulse text-primary" />
              <p className="text-lg font-medium">Iniciando videoconferência...</p>
              <p className="text-sm text-muted-foreground">Sala: {roomName}</p>
            </div>
          </div>
        )}
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </Card>

      {/* Quick Controls */}
      <div className="flex items-center justify-center gap-3 p-4 bg-card border-t">
        <Button
          size="lg"
          variant={isVideoOn ? 'default' : 'destructive'}
          onClick={toggleVideo}
          className="rounded-full w-14 h-14"
        >
          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          size="lg"
          variant={isAudioOn ? 'default' : 'destructive'}
          onClick={toggleAudio}
          className="rounded-full w-14 h-14"
        >
          {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={shareScreen}
          className="rounded-full w-14 h-14"
        >
          <Monitor className="h-5 w-5" />
        </Button>

        <Button
          size="lg"
          variant="destructive"
          onClick={endCall}
          className="rounded-full w-14 h-14"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
