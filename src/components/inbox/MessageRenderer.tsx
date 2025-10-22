import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  direction: 'in' | 'out';
  body: string;
  created_at: string;
  status?: string;
  channel: string;
  attachments?: any[];
}

interface MessageRendererProps {
  message: Message;
  channel: string;
}

export function MessageRenderer({ message, channel }: MessageRendererProps) {
  // Render email with HTML support
  if (channel === 'email') {
    return (
      <div
        className={cn(
          "flex mb-4",
          message.direction === 'out' ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[85%] rounded-lg overflow-hidden",
            message.direction === 'out'
              ? "bg-primary/10 border border-primary/20"
              : "bg-card border"
          )}
        >
          {/* Email header */}
          <div className="px-4 py-2 border-b bg-muted/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">
                {message.direction === 'out' ? 'Você' : 'Cliente'}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleString('pt-BR', { 
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Email body */}
          <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(message.body, {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img'],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
                }),
              }}
            />
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="px-4 pb-4">
              <div className="text-xs text-muted-foreground mb-2">Anexos:</div>
              {message.attachments.map((att: any, idx: number) => (
                <div key={idx} className="text-xs bg-muted rounded px-2 py-1 mb-1">
                  📎 {att.filename || `Arquivo ${idx + 1}`}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render WhatsApp / chat messages
  return (
    <div
      className={cn(
        "flex mb-3",
        message.direction === 'out' ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
          message.direction === 'out'
            ? "bg-green-600 text-white rounded-br-sm"
            : "bg-card border rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={cn(
            "text-[10px]",
            message.direction === 'out' ? 'text-green-50/70' : 'text-muted-foreground'
          )}>
            {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          {message.direction === 'out' && message.status && (
            <span className="text-[10px] text-green-50/70">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && <span className="text-blue-300">✓✓</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
