import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeMessage {
  id: string;
  conversation_id: string;
  channel: string;
  direction: 'in' | 'out';
  body: string;
  created_at: string;
  from_id?: string;
  to_id?: string;
  metadata?: any;
}

export function useRealtimeInbox() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found for WebSocket');
        return;
      }

      // Use full URL to WebSocket endpoint
      const wsUrl = `wss://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/realtime-inbox`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Wait for WebSocket to be fully open before sending
        if (ws.current?.readyState === WebSocket.OPEN) {
          // Authenticate
          ws.current.send(JSON.stringify({
            type: 'auth',
            token: session.access_token,
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message:', data);

          if (data.type === 'message' && data.event === 'new') {
            setMessages(prev => [data.data, ...prev]);
          }

          if (data.type === 'auth' && data.status === 'authenticated') {
            console.log('WebSocket authenticated');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  };

  // Keep connection alive with ping
  useEffect(() => {
    if (!connected || !ws.current) return;

    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [connected]);

  return { connected, messages };
}
