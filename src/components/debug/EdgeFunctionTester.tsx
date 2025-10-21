/**
 * 🔧 COMPONENTE DE DEBUG - TESTADOR DE EDGE FUNCTIONS
 * 
 * Use este componente para testar manualmente as Edge Functions
 * diretamente da interface do sistema.
 * 
 * Adicione em qualquer página: <EdgeFunctionTester />
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  duration?: number;
}

export function EdgeFunctionTester() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  
  // Inputs
  const [cnpj, setCnpj] = useState('18.627.195/0001-60');
  const [name, setName] = useState('Frederico Lacerda');
  const [domain, setDomain] = useState('magazineluiza.com.br');
  const [linkedinUrl, setLinkedinUrl] = useState('https://www.linkedin.com/company/magazineluiza/');
  const [companyId, setCompanyId] = useState('478d8d7d-a679-4c29-a558-f72385453a2c');

  const updateResult = (fn: string, result: Partial<TestResult>) => {
    setTestResults(prev => ({
      ...prev,
      [fn]: { ...prev[fn], ...result }
    }));
  };

  const testSearchCompanies = async () => {
    const fn = 'search-companies';
    updateResult(fn, { status: 'loading' });
    const start = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { cnpj }
      });

      if (error) throw error;

      updateResult(fn, {
        status: 'success',
        data,
        duration: Date.now() - start
      });
    } catch (error: any) {
      updateResult(fn, {
        status: 'error',
        error: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testEnrichEmail = async () => {
    const fn = 'enrich-email';
    updateResult(fn, { status: 'loading' });
    const start = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { name, company_domain: domain }
      });

      if (error) throw error;

      updateResult(fn, {
        status: 'success',
        data,
        duration: Date.now() - start
      });
    } catch (error: any) {
      updateResult(fn, {
        status: 'error',
        error: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testLinkedInScrape = async () => {
    const fn = 'linkedin-scrape';
    updateResult(fn, { status: 'loading' });
    const start = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { linkedin_url: linkedinUrl }
      });

      if (error) throw error;

      updateResult(fn, {
        status: 'success',
        data,
        duration: Date.now() - start
      });
    } catch (error: any) {
      updateResult(fn, {
        status: 'error',
        error: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testAnalyzeTOTVSFit = async () => {
    const fn = 'analyze-totvs-fit';
    updateResult(fn, { status: 'loading' });
    const start = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { companyId }
      });

      if (error) throw error;

      updateResult(fn, {
        status: 'success',
        data,
        duration: Date.now() - start
      });
    } catch (error: any) {
      updateResult(fn, {
        status: 'error',
        error: error.message,
        duration: Date.now() - start
      });
    }
  };

  const renderResult = (fn: string) => {
    const result = testResults[fn];
    if (!result) return null;

    const { status, data, error, duration } = result;

    if (status === 'idle') return null;

    return (
      <div className="mt-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          {status === 'loading' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Testando...</span>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Sucesso!</span>
              {duration && (
                <Badge variant="outline" className="ml-auto">{duration}ms</Badge>
              )}
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Erro</span>
            </>
          )}
        </div>

        {status === 'error' && (
          <div className="bg-destructive/10 p-3 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {status === 'success' && data && (
          <div className="bg-muted p-3 rounded-md max-h-96 overflow-auto">
            <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <div>
            <CardTitle>🔧 Edge Function Tester</CardTitle>
            <CardDescription>Ferramenta de debug para testar Edge Functions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="totvs">TOTVS Fit</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <Button
              onClick={testSearchCompanies}
              disabled={testResults['search-companies']?.status === 'loading'}
              className="w-full"
            >
              {testResults['search-companies']?.status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar search-companies'
              )}
            </Button>
            {renderResult('search-companies')}
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domínio</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="empresa.com.br"
              />
            </div>
            <Button
              onClick={testEnrichEmail}
              disabled={testResults['enrich-email']?.status === 'loading'}
              className="w-full"
            >
              {testResults['enrich-email']?.status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar enrich-email'
              )}
            </Button>
            {renderResult('enrich-email')}
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/company/..."
              />
            </div>
            <Button
              onClick={testLinkedInScrape}
              disabled={testResults['linkedin-scrape']?.status === 'loading'}
              className="w-full"
            >
              {testResults['linkedin-scrape']?.status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar linkedin-scrape'
              )}
            </Button>
            {renderResult('linkedin-scrape')}
          </TabsContent>

          <TabsContent value="totvs" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="uuid"
              />
            </div>
            <Button
              onClick={testAnalyzeTOTVSFit}
              disabled={testResults['analyze-totvs-fit']?.status === 'loading'}
              className="w-full"
            >
              {testResults['analyze-totvs-fit']?.status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar analyze-totvs-fit'
              )}
            </Button>
            {renderResult('analyze-totvs-fit')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
