import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  channel: 'email' | 'whatsapp' | 'sms';
  subject?: string | null;
  body: string;
  variables?: string[] | null;
  is_active?: boolean | null;
  created_by?: string | null;
}

interface UseMessageTemplatesOptions {
  channel: 'email' | 'whatsapp' | 'sms';
}

export const useMessageTemplates = ({ channel }: UseMessageTemplatesOptions) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('message_templates')
        .select('id, name, category, channel, subject, body, variables, is_active, created_by')
        .eq('channel', channel)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (!isMounted) return;
      if (error) {
        setError(error.message);
      } else {
        setTemplates((data || []) as unknown as MessageTemplate[]);
      }
      setLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [channel]);

  const categories = useMemo(() => {
    const map: Record<string, MessageTemplate[]> = {};
    for (const t of templates) {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    }
    return map;
  }, [templates]);

  const applyTemplate = (
    template: MessageTemplate,
    context?: Record<string, string>
  ) => {
    const replacer = (text?: string | null) => {
      if (!text) return '';
      if (!context) return text;
      return text.replace(/\{\{(.*?)\}\}/g, (_, key) => {
        const k = String(key).trim();
        return context[k] ?? `{{${k}}}`;
      });
    };

    return {
      subject: replacer(template.subject ?? ''),
      body: replacer(template.body),
    };
  };

  return { templates, categories, loading, error, applyTemplate };
};
