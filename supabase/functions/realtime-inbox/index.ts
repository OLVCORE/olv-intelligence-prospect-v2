import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * WebSocket endpoint for real-time inbox updates
 * Pushes new messages to connected clients instantly
 */
serve(async (req) => {
  const upgrade = req.headers.get("upgrade") || "";
  
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected websocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let userId: string | null = null;
  let channel: any = null;

  socket.onopen = () => {
    console.log('WebSocket connection opened');
    socket.send(JSON.stringify({ 
      type: 'connection', 
      status: 'connected',
      message: 'Real-time inbox connected'
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received:', data);

      if (data.type === 'auth') {
        // Authenticate user
        const { data: { user }, error } = await supabase.auth.getUser(data.token);
        
        if (error || !user) {
          socket.send(JSON.stringify({ 
            type: 'error', 
            message: 'Authentication failed' 
          }));
          socket.close();
          return;
        }

        userId = user.id;

        // Subscribe to database changes
        channel = supabase
          .channel(`inbox:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
            },
            (payload) => {
              console.log('New message detected:', payload);
              socket.send(JSON.stringify({
                type: 'message',
                event: 'new',
                data: payload.new,
              }));
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'conversations',
            },
            (payload) => {
              console.log('Conversation updated:', payload);
              socket.send(JSON.stringify({
                type: 'conversation',
                event: 'update',
                data: payload.new,
              }));
            }
          )
          .subscribe();

        socket.send(JSON.stringify({ 
          type: 'auth', 
          status: 'authenticated',
          userId: userId,
        }));
      }

      if (data.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }));
      }

    } catch (error) {
      console.error('WebSocket message error:', error);
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
    if (channel) {
      supabase.removeChannel(channel);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return response;
});
