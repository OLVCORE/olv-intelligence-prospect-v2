import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Search, Database, Globe, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LeadCaptureDialog } from '@/components/leads/LeadCaptureDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function LeadsCapture() {
  const navigate = useNavigate();
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['capture-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_quarantine')
        .select('captured_at, validation_status, source_id')
      
      if (error) throw error

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      return {
        today: data.filter(l => new Date(l.captured_at) >= today).length,
        week: data.filter(l => new Date(l.captured_at) >= weekAgo).length,
        month: data.filter(l => new Date(l.captured_at) >= monthAgo).length,
        total: data.length,
        pending: data.filter(l => l.validation_status === 'pending').length,
        approved: data.filter(l => l.validation_status === 'approved').length,
        rejected: data.filter(l => l.validation_status === 'rejected').length
      }
    },
    refetchInterval: 30000
  })

  const { data: sources } = useQuery({
    queryKey: ['sources-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('source_performance')
        .select('*')
        .order('total_captured', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Captura de Leads</h1>
        <p className="text-muted-foreground mt-1">
          Múltiplas fontes de captura para alimentar seu pipeline de vendas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.today || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Leads capturados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.week || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.month || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Todos os leads</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status de Validação</CardTitle>
          <CardDescription>Distribuição dos leads por status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-400">Pendentes</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats?.approved || 0}</div>
                <div className="text-sm text-green-700 dark:text-green-400">Aprovados</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</div>
                <div className="text-sm text-red-700 dark:text-red-400">Rejeitados</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-4">Fontes de Captura</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upload Manual</CardTitle>
                  <CardDescription>CSV/Excel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Importe listas de empresas de eventos, feiras ou listas compradas
              </p>
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Empresas Aqui</CardTitle>
                  <CardDescription>Web Scraping</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Busque empresas por setor, estado e porte automaticamente
              </p>
              <Button 
                onClick={() => navigate('/central-icp/discovery')}
                variant="outline"
                className="w-full"
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar Agora
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Formulário Web</CardTitle>
                  <CardDescription>API Pública</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Leads vindos do formulário do site
              </p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://agentetotvs.olvinternacional.com.br/', '_blank')}
              >
                <Globe className="w-4 h-4 mr-2" />
                Ver Formulário
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {sources && sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance das Fontes</CardTitle>
            <CardDescription>Estatísticas de captura por fonte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sources.map((source) => (
                <div key={source.source_name} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      source.is_active ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-200'
                    }`}>
                      {source.source_name === 'upload_manual' && <Upload className="w-5 h-5 text-green-600" />}
                      {source.source_name === 'empresas_aqui' && <Search className="w-5 h-5 text-green-600" />}
                      {source.source_name === 'indicacao_website' && <Globe className="w-5 h-5 text-green-600" />}
                      {source.source_name === 'apollo_io' && <Database className="w-5 h-5 text-green-600" />}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {source.source_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Prioridade: {source.priority}/10
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{source.total_captured || 0}</div>
                      <div className="text-xs text-muted-foreground">Capturados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{source.total_approved || 0}</div>
                      <div className="text-xs text-muted-foreground">Aprovados</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/leads/quarantine')}
              variant="default"
            >
              <Users className="w-4 h-4 mr-2" />
              Ver Quarentena ({stats?.pending || 0} pendentes)
            </Button>
            <Button
              onClick={() => navigate('/central-icp')}
              variant="outline"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Ver Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>

      <LeadCaptureDialog 
        open={showUploadDialog} 
        onOpenChange={setShowUploadDialog} 
      />
    </div>
  );
}
