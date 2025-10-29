import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, ArrowRight, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function LeadsQuarantine() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['leads-quarantine', statusFilter, sourceFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('leads_quarantine')
        .select(`
          *,
          leads_sources (
            source_name,
            priority
          )
        `)
        .order('captured_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('validation_status', statusFilter)
      }

      if (sourceFilter !== 'all') {
        query = query.eq('source_id', sourceFilter)
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    }
  })

  const { data: sources } = useQuery({
    queryKey: ['leads-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_sources')
        .select('id, source_name')
        .order('source_name')
      
      if (error) throw error
      return data
    }
  })

  const validateLead = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.functions.invoke('validate-lead-comprehensive', {
        body: { leadId }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Validação iniciada')
      queryClient.invalidateQueries({ queryKey: ['leads-quarantine'] })
    }
  })

  const approveLead = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads_quarantine')
        .update({
          validation_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', leadId)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Lead aprovado')
      queryClient.invalidateQueries({ queryKey: ['leads-quarantine'] })
    }
  })

  const rejectLead = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads_quarantine')
        .update({
          validation_status: 'rejected',
          rejection_reason: 'Rejeitado manualmente',
          validated_at: new Date().toISOString()
        })
        .eq('id', leadId)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Lead rejeitado')
      queryClient.invalidateQueries({ queryKey: ['leads-quarantine'] })
    }
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quarentena de Leads</h1>
          <p className="text-muted-foreground mt-1">
            Validação e aprovação de leads capturados
          </p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="validating">Validando</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
              <SelectItem value="duplicate">Duplicados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {sources?.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.source_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="space-y-4">
        {leads?.map((lead) => (
          <Card key={lead.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold">{lead.name}</h3>
                  
                  {lead.validation_status === 'approved' && (
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aprovado
                    </Badge>
                  )}
                  {lead.validation_status === 'rejected' && (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Rejeitado
                    </Badge>
                  )}
                  {lead.validation_status === 'pending' && (
                    <Badge variant="secondary">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pendente
                    </Badge>
                  )}
                  {lead.validation_status === 'validating' && (
                    <Badge className="bg-blue-500">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Validando
                    </Badge>
                  )}

                  <Badge variant="outline">
                    {lead.leads_sources?.source_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {lead.cnpj && (
                    <div>
                      <div className="text-xs text-muted-foreground">CNPJ</div>
                      <div className="text-sm font-medium">{lead.cnpj}</div>
                    </div>
                  )}
                  {lead.sector && (
                    <div>
                      <div className="text-xs text-muted-foreground">Setor</div>
                      <div className="text-sm font-medium">{lead.sector}</div>
                    </div>
                  )}
                  {lead.state && (
                    <div>
                      <div className="text-xs text-muted-foreground">Estado</div>
                      <div className="text-sm font-medium">{lead.state}</div>
                    </div>
                  )}
                  {lead.employees && (
                    <div>
                      <div className="text-xs text-muted-foreground">Funcionários</div>
                      <div className="text-sm font-medium">{lead.employees}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  {lead.cnpj_valid && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      CNPJ Válido
                    </Badge>
                  )}
                  {lead.website_active && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Site Ativo
                    </Badge>
                  )}
                  {lead.has_linkedin && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      LinkedIn
                    </Badge>
                  )}
                  {lead.email_verified && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Email Verificado
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Score de Validação</span>
                      <span className="text-sm font-semibold">{lead.auto_score || 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (lead.auto_score || 0) >= 70 ? 'bg-green-500' :
                          (lead.auto_score || 0) >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${lead.auto_score || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Qualidade de Dados</span>
                      <span className="text-sm font-semibold">{lead.data_quality_score || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${lead.data_quality_score || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  Capturado em {new Date(lead.captured_at).toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {lead.validation_status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => validateLead.mutate(lead.id)}
                      disabled={validateLead.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${validateLead.isPending ? 'animate-spin' : ''}`} />
                      Validar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveLead.mutate(lead.id)}
                      disabled={approveLead.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectLead.mutate(lead.id)}
                      disabled={rejectLead.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </>
                )}

                {lead.validation_status === 'approved' && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/leads/icp-analysis?leadId=${lead.id}`)}
                  >
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Qualificar ICP
                  </Button>
                )}

                {lead.validation_status === 'validating' && (
                  <div className="text-sm text-blue-600 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Validando...
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {leads?.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum lead encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Ajuste os filtros ou capture novos leads
            </p>
            <Button onClick={() => navigate('/leads/capture')}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Capturar Leads
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
