import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Building2, Globe, Share2, Store } from 'lucide-react';

const enhancedCompanySchema = z.object({
  // Identificação Oficial
  cnpj: z.string().optional(),
  razao_social: z.string().optional(),
  
  // Identificação Comercial
  nome_fantasia: z.string().optional(),
  marca_principal: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  domain: z.string().optional(),
  
  // Redes Sociais
  linkedin_url: z.string().url().optional().or(z.literal('')),
  linkedin_company: z.string().optional(),
  instagram_handle: z.string().optional(),
  facebook_handle: z.string().optional(),
  twitter_handle: z.string().optional(),
  youtube_channel: z.string().optional(),
  
  // Marketplaces (opcional - será detectado automaticamente)
  alibaba: z.string().optional(),
  b2b_brasil: z.string().optional(),
  mercado_livre: z.string().optional(),
  canal_rural: z.string().optional(),
  b21: z.string().optional(),
  outros_marketplaces: z.string().optional(),
  
  // Setores
  cnae: z.string().optional(),
  setor_vertical: z.string().optional(),
});

type EnhancedCompanyInput = z.infer<typeof enhancedCompanySchema>;

export function EnhancedCompanyInputForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<EnhancedCompanyInput>({
    resolver: zodResolver(enhancedCompanySchema),
    defaultValues: {
      cnpj: '',
      razao_social: '',
      nome_fantasia: '',
      marca_principal: '',
      website: '',
      domain: '',
      linkedin_url: '',
      linkedin_company: '',
      instagram_handle: '',
      facebook_handle: '',
      twitter_handle: '',
      youtube_channel: '',
      cnae: '',
      setor_vertical: '',
    },
  });

  const handleFetchReceitaWS = async () => {
    const cnpj = form.getValues('cnpj');
    if (!cnpj) {
      toast({
        title: 'CNPJ necessário',
        description: 'Por favor, insira um CNPJ antes de buscar os dados.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-receitaws', {
        body: { cnpj },
      });

      if (error) throw error;

      if (data) {
        const receita: any = (data as any)?.data ?? data; // aceita ambos formatos
        form.setValue('razao_social', receita?.nome || '');
        form.setValue('nome_fantasia', receita?.fantasia || '');
        form.setValue('cnae', receita?.atividade_principal?.[0]?.code || '');
        
        toast({
          title: 'Dados carregados',
          description: 'Dados oficiais carregados com sucesso.',
        });
      }
    } catch (error) {
      console.error('Error fetching ReceitaWS:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível buscar os dados da Receita Federal.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoDetectSocial = async () => {
    const companyName = form.getValues('razao_social') || form.getValues('nome_fantasia');
    const website = form.getValues('website');
    
    if (!companyName && !website) {
      toast({
        title: 'Dados insuficientes',
        description: 'Preencha o nome da empresa ou website para auto-detectar.',
        variant: 'destructive',
      });
      return;
    }

    setIsAutoDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-search', {
        body: {
          query: `${companyName} site:linkedin.com/company OR site:instagram.com OR site:facebook.com`,
          num: 10,
        },
      });

      if (error) throw error;

      if (data?.results) {
        // Parse LinkedIn
        const linkedinResult = data.results.find((r: any) => 
          r.link?.includes('linkedin.com/company')
        );
        if (linkedinResult) {
          form.setValue('linkedin_url', linkedinResult.link);
          const companySlug = linkedinResult.link.split('linkedin.com/company/')[1]?.split('/')[0];
          form.setValue('linkedin_company', companySlug);
        }

        // Parse Instagram
        const instagramResult = data.results.find((r: any) => 
          r.link?.includes('instagram.com')
        );
        if (instagramResult) {
          const handle = instagramResult.link.split('instagram.com/')[1]?.split('/')[0];
          form.setValue('instagram_handle', handle);
        }

        // Parse Facebook
        const facebookResult = data.results.find((r: any) => 
          r.link?.includes('facebook.com')
        );
        if (facebookResult) {
          const handle = facebookResult.link.split('facebook.com/')[1]?.split('/')[0];
          form.setValue('facebook_handle', handle);
        }

        toast({
          title: 'Redes sociais detectadas',
          description: 'Encontramos alguns perfis. Revise os dados antes de continuar.',
        });
      }
    } catch (error) {
      console.error('Error auto-detecting social:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível detectar as redes sociais automaticamente.',
        variant: 'destructive',
      });
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const onSubmit = async (data: EnhancedCompanyInput) => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('enrich-company-360', {
        body: data,
      });

      if (error) throw error;

      toast({
        title: 'Análise iniciada',
        description: 'A análise 360º foi iniciada com sucesso. Você será notificado quando concluir.',
      });

      // Redirect to company detail page
      if (result?.company_id) {
        window.location.href = `/company/${result.company_id}`;
      }
    } catch (error) {
      console.error('Error starting 360 analysis:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a análise 360º.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Análise 360º de Empresa</CardTitle>
        <CardDescription>
          Preencha os dados da empresa para iniciar uma análise completa com inteligência artificial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="oficial" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="oficial">
                <Building2 className="h-4 w-4 mr-2" />
                Oficial
              </TabsTrigger>
              <TabsTrigger value="comercial">
                <Globe className="h-4 w-4 mr-2" />
                Comercial
              </TabsTrigger>
              <TabsTrigger value="social">
                <Share2 className="h-4 w-4 mr-2" />
                Redes Sociais
              </TabsTrigger>
              <TabsTrigger value="marketplace">
                <Store className="h-4 w-4 mr-2" />
                Marketplaces
              </TabsTrigger>
            </TabsList>

            <TabsContent value="oficial" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <div className="flex gap-2">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    {...form.register('cnpj')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchReceitaWS();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleFetchReceitaWS}
                    disabled={isLoading}
                    variant="secondary"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input
                  id="razao_social"
                  placeholder="Razão social da empresa"
                  {...form.register('razao_social')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnae">CNAE</Label>
                <Input
                  id="cnae"
                  placeholder="Código CNAE"
                  {...form.register('cnae')}
                />
              </div>
            </TabsContent>

            <TabsContent value="comercial" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <Input
                  id="nome_fantasia"
                  placeholder="Nome comercial da empresa"
                  {...form.register('nome_fantasia')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marca_principal">Marca Principal</Label>
                <Input
                  id="marca_principal"
                  placeholder="Principal marca da empresa"
                  {...form.register('marca_principal')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.empresa.com.br"
                  {...form.register('website')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domínio</Label>
                <Input
                  id="domain"
                  placeholder="empresa.com.br"
                  {...form.register('domain')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setor_vertical">Setor Vertical</Label>
                <Input
                  id="setor_vertical"
                  placeholder="Ex: Agro, Manufatura, Distribuição"
                  {...form.register('setor_vertical')}
                />
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <Button
                type="button"
                onClick={handleAutoDetectSocial}
                disabled={isAutoDetecting}
                variant="outline"
                className="w-full mb-4"
              >
                {isAutoDetecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Detectando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Auto-detectar Redes Sociais
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn (URL completa)</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/company/empresa"
                  {...form.register('linkedin_url')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_company">LinkedIn (slug)</Label>
                <Input
                  id="linkedin_company"
                  placeholder="empresa"
                  {...form.register('linkedin_company')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_handle">Instagram (@handle)</Label>
                <Input
                  id="instagram_handle"
                  placeholder="@empresa"
                  {...form.register('instagram_handle')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_handle">Facebook (@handle)</Label>
                <Input
                  id="facebook_handle"
                  placeholder="@empresa"
                  {...form.register('facebook_handle')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_handle">Twitter (@handle)</Label>
                <Input
                  id="twitter_handle"
                  placeholder="@empresa"
                  {...form.register('twitter_handle')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_channel">YouTube (@canal)</Label>
                <Input
                  id="youtube_channel"
                  placeholder="@empresa"
                  {...form.register('youtube_channel')}
                />
              </div>
            </TabsContent>

            <TabsContent value="marketplace" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Detectaremos automaticamente a presença da empresa nos principais marketplaces.
                Você pode adicionar informações adicionais abaixo:
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alibaba">Alibaba</Label>
                  <Input
                    id="alibaba"
                    placeholder="URL ou ID"
                    {...form.register('alibaba')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="b2b_brasil">B2B Brasil</Label>
                  <Input
                    id="b2b_brasil"
                    placeholder="URL ou ID"
                    {...form.register('b2b_brasil')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mercado_livre">Mercado Livre</Label>
                  <Input
                    id="mercado_livre"
                    placeholder="URL ou ID"
                    {...form.register('mercado_livre')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canal_rural">Canal Rural</Label>
                  <Input
                    id="canal_rural"
                    placeholder="URL ou ID"
                    {...form.register('canal_rural')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="b21">B21</Label>
                  <Input
                    id="b21"
                    placeholder="URL ou ID"
                    {...form.register('b21')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outros_marketplaces">Outros</Label>
                  <Input
                    id="outros_marketplaces"
                    placeholder="Outros marketplaces"
                    {...form.register('outros_marketplaces')}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando Análise 360º...
              </>
            ) : (
              'Iniciar Análise 360º'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
