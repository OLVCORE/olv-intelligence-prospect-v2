import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadCSVParams {
  leads: any[];
  sourceName?: string;
}

interface CaptureLeadParams {
  name: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  website?: string;
  sector?: string;
  state?: string;
  city?: string;
  message?: string;
  source?: string;
  referrer?: string;
}

export function useLeadCapture() {
  const queryClient = useQueryClient();

  // Upload CSV
  const uploadCSV = useMutation({
    mutationFn: async ({ leads, sourceName = 'upload_manual' }: UploadCSVParams) => {
      const { data, error } = await supabase.functions.invoke('upload-leads-csv', {
        body: { leads, source_name: sourceName }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Upload concluído', {
        description: `${data.summary.inserted} leads adicionados à quarentena`,
      });
      queryClient.invalidateQueries({ queryKey: ['leads-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro no upload', {
        description: error.message,
      });
    }
  });

  // Capturar lead via API (formulário)
  const captureLead = useMutation({
    mutationFn: async (leadData: CaptureLeadParams) => {
      const { data, error } = await supabase.functions.invoke('capture-lead-api', {
        body: leadData
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Lead capturado', {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['leads-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao capturar lead', {
        description: error.message,
      });
    }
  });

  return {
    uploadCSV,
    captureLead
  };
}
