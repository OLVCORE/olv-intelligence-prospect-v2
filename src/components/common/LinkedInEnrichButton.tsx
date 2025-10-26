import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin, Loader2, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LinkedInEnrichButtonProps {
  companyId: string;
  linkedinUrl?: string;
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function LinkedInEnrichButton({
  companyId,
  linkedinUrl,
  onSuccess,
  variant = 'outline',
  size = 'default',
  showLabel = true
}: LinkedInEnrichButtonProps) {
  const [isScrapingLinkedIn, setIsScrapingLinkedIn] = useState(false);
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  const [containerId, setContainerId] = useState<string | null>(null);
  const [scrapingComplete, setScrapingComplete] = useState(false);

  const handleLinkedInScrape = async () => {
    if (!linkedinUrl) {
      toast({
        title: '⚠️ URL do LinkedIn ausente',
        description: 'Configure a URL do LinkedIn da empresa primeiro',
        variant: 'destructive',
      });
      return;
    }

    setIsScrapingLinkedIn(true);
    setScrapingComplete(false);

    try {
      const { data, error } = await supabase.functions.invoke('linkedin-scrape', {
        body: { 
          linkedin_url: linkedinUrl,
          company_id: companyId
        }
      });

      if (error) throw error;

      if (data?.data?.containerId) {
        setContainerId(data.data.containerId);
        toast({
          title: '✅ Scraping LinkedIn iniciado',
          description: 'Os dados serão processados em breve. Clique novamente para buscar resultados.',
        });
        setScrapingComplete(true);
      } else {
        toast({
          title: '⚠️ Scraping iniciado',
          description: data?.message || 'PhantomBuster processando...',
        });
      }
    } catch (error: any) {
      console.error('Erro ao iniciar scraping LinkedIn:', error);
      toast({
        title: '❌ Erro no scraping',
        description: error.message || 'Falha ao iniciar análise do LinkedIn',
        variant: 'destructive',
      });
    } finally {
      setIsScrapingLinkedIn(false);
    }
  };

  const handleFetchResults = async () => {
    if (!containerId) {
      toast({
        title: '⚠️ Nenhum scraping em andamento',
        description: 'Inicie o scraping primeiro',
        variant: 'destructive',
      });
      return;
    }

    setIsFetchingResults(true);

    try {
      const { data, error } = await supabase.functions.invoke('linkedin-fetch-results', {
        body: { 
          container_id: containerId,
          company_id: companyId
        }
      });

      if (error) throw error;

      toast({
        title: '✅ Dados do LinkedIn obtidos',
        description: `${data?.count || 0} perfis processados e salvos como sinais de compra`,
      });

      if (onSuccess) onSuccess();
      setContainerId(null);
      setScrapingComplete(false);
    } catch (error: any) {
      console.error('Erro ao buscar resultados:', error);
      toast({
        title: '❌ Erro ao buscar resultados',
        description: error.message || 'O scraping pode ainda estar em processamento',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingResults(false);
    }
  };

  const isProcessing = isScrapingLinkedIn || isFetchingResults;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={scrapingComplete ? handleFetchResults : handleLinkedInScrape}
            disabled={isProcessing || !linkedinUrl}
            variant={variant}
            size={size}
            className={showLabel ? "group relative overflow-hidden" : "h-10 w-10"}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : scrapingComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <div className="relative h-8 w-8 flex items-center justify-center rounded-lg bg-[#0A66C2] shadow-lg">
                <Linkedin className="h-5 w-5 text-white" />
              </div>
            )}
            
            {showLabel && (
              <span className="ml-2">
                {isScrapingLinkedIn 
                  ? 'Iniciando...' 
                  : isFetchingResults 
                    ? 'Buscando...' 
                    : scrapingComplete
                      ? 'Buscar Resultados'
                      : 'Analisar LinkedIn'
                }
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {!linkedinUrl 
            ? 'LinkedIn não configurado' 
            : scrapingComplete 
              ? 'Buscar resultados do scraping'
              : 'Analisar perfil LinkedIn'
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
