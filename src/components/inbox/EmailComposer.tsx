import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, Paperclip, Bold, Italic, List, ListOrdered, 
  Link2, Image, Smile, ChevronDown, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';

interface EmailComposerProps {
  to: string;
  onToChange?: (value: string) => void;
  subject: string;
  body: string;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  allowEditTo?: boolean;
}

export function EmailComposer({
  to,
  onToChange,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  onSend,
  sending = false,
  allowEditTo = false
}: EmailComposerProps) {
  const [showCc, setShowCc] = useState(false);
  const [showCco, setShowCco] = useState(false);
  const [cc, setCc] = useState('');
  const [cco, setCco] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const { templates, categories, loading: loadingTemplates, applyTemplate } = useMessageTemplates({ channel: 'email' });

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onSend();
    }
  };
  return (
    <div className="flex flex-col gap-2 border rounded-lg p-4 bg-card">
      {/* Header - Para, Cc, Cco */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium w-12">Para:</span>
          <Input 
            value={to}
            onChange={(e) => onToChange?.(e.target.value)}
            disabled={!allowEditTo}
            className={allowEditTo ? "flex-1" : "flex-1 bg-muted/50"}
            placeholder={allowEditTo ? "Digite o email do destinatário" : ""}
          />
          <div className="flex gap-1">
            {!showCc && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCc(true)}
                className="text-xs"
              >
                Cc
              </Button>
            )}
            {!showCco && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCco(true)}
                className="text-xs"
              >
                Cco
              </Button>
            )}
          </div>
        </div>

        {showCc && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-12">Cc:</span>
            <Input 
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Adicionar destinatários em cópia"
              className="flex-1"
            />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowCc(false);
                setCc('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {showCco && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-12">Cco:</span>
            <Input 
              value={cco}
              onChange={(e) => setCco(e.target.value)}
              placeholder="Adicionar destinatários em cópia oculta"
              className="flex-1"
            />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowCco(false);
                setCco('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium w-12">Assunto:</span>
          <Input 
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Adicionar assunto"
            className="flex-1"
          />
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 py-2 border-y">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Image className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Smile className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              Modelos
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Selecionar modelo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loadingTemplates && (
              <DropdownMenuItem disabled>Carregando...</DropdownMenuItem>
            )}
            {!loadingTemplates && Object.keys(categories).length === 0 && (
              <DropdownMenuItem disabled>Nenhum modelo disponível</DropdownMenuItem>
            )}
            {!loadingTemplates && Object.entries(categories).map(([cat, items]) => (
              <div key={cat}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">{cat}</DropdownMenuLabel>
                {items.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => {
                      const applied = applyTemplate(t);
                      if (t.subject) onSubjectChange(applied.subject);
                      onBodyChange(applied.body);
                    }}
                    className="whitespace-normal h-auto py-2"
                  >
                    <div>
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{t.body}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <label htmlFor="email-attachment">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <span>
              <Paperclip className="h-4 w-4" />
            </span>
          </Button>
          <input
            id="email-attachment"
            type="file"
            multiple
            className="hidden"
            onChange={handleAttachment}
          />
        </label>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 py-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm"
            >
              <Paperclip className="h-3 w-3" />
              <span>{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <Textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escreva sua mensagem aqui..."
        className="min-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          Ctrl + Enter para enviar
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Rascunho
          </Button>
          <Button 
            onClick={onSend} 
            disabled={sending || !body.trim() || !subject.trim()}
            size="sm"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
