// ==========================================
// SeniorDecisorsPanel - Interface Apollo-Style Completa
// ==========================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, Mail, Phone, Linkedin, MapPin, Building2, Target, Download, UserPlus, ExternalLink, CheckCircle, AlertCircle, Info, Users } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Decisor {
  id?: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  seniority?: string;
  department?: string;
  location?: string;
  email_status?: 'verified' | 'guessed' | 'unavailable';
  contact_accuracy_score?: number;
  intent_signal?: string;
  source?: string;
  company_name?: string;
  employee_count?: number;
  company_industries?: string[];
  company_keywords?: string[];
  raw_data?: any;
}

interface SeniorDecisorsPanelProps {
  decisors: Decisor[];
  companyName?: string;
}

// ==========================================
// Função para determinar nível de senioridade
// ==========================================
const getSeniorityLevel = (title?: string): { level: string; rank: number } => {
  if (!title) return { level: 'N/A', rank: 99 };
  const t = title.toLowerCase();

  // C-Level
  if (/\b(ceo|cto|cfo|coo|cmo|cio|cso|chief|presidente|president)\b/.test(t)) {
    return { level: 'C-Level', rank: 1 };
  }
  // VP / Vice President
  if (/\b(vp|vice.?president|vice.?presidente)\b/.test(t)) {
    return { level: 'VP', rank: 2 };
  }
  // Director / Diretor
  if (/\b(director|diretor|diretora)\b/.test(t)) {
    return { level: 'Director', rank: 3 };
  }
  // Head / Líder
  if (/\b(head|líder|leader|lider)\b/.test(t)) {
    return { level: 'Head', rank: 4 };
  }
  // Manager / Gerente
  if (/\b(manager|gerente|gestor)\b/.test(t)) {
    return { level: 'Manager', rank: 5 };
  }
  // Coordinator / Coordenador
  if (/\b(coordinator|coordenador|coordenadora)\b/.test(t)) {
    return { level: 'Coordinator', rank: 6 };
  }
  // Specialist / Especialista
  if (/\b(specialist|especialista|senior|pleno)\b/.test(t)) {
    return { level: 'Specialist', rank: 7 };
  }
  // Analyst / Analista
  if (/\b(analyst|analista|junior)\b/.test(t)) {
    return { level: 'Analyst', rank: 8 };
  }
  // Assistant / Assistente
  if (/\b(assistant|assistente|auxiliar)\b/.test(t)) {
    return { level: 'Assistant', rank: 9 };
  }

  return { level: 'Other', rank: 10 };
};

// ==========================================
// Função para determinar departamento
// ==========================================
const getDepartment = (title?: string): string => {
  if (!title) return 'N/A';
  const t = title.toLowerCase();

  // Executivo (C-Level)
  if (/\b(ceo|presidente|president|chief.?executive|owner|sócio|socio|proprietário|proprietario)\b/.test(t)) return 'Executivo';
  
  // Operações & Produção
  if (/\b(operations?|operações|operacao|produção|producao|manufatura|fabrica|fábrica|industrial|plant|coo|production)\b/.test(t)) return 'Operações';
  
  // Financeiro & Contabilidade
  if (/\b(finance?|financeiro|contabil|contabilidade|cfo|tesouraria|controller|accounting|fiscal)\b/.test(t)) return 'Financeiro';
  
  // Vendas & Comercial
  if (/\b(sales|vendas|comercial|account|cmo|business.?development|revenue|negócios|negocios)\b/.test(t)) return 'Vendas';
  
  // Compras & Supply Chain
  if (/\b(compras|suprimento|purchasing|procurement|supply.?chain|logistic|logística|abastecimento)\b/.test(t)) return 'Compras & Supply';
  
  // Recursos Humanos
  if (/\b(hr|rh|recursos.?humanos|human.?resources|people|talent|gente|pessoas)\b/.test(t)) return 'RH';
  
  // Tecnologia & TI
  if (/\b(tech|tecnologia|ti|it|desenvolvimento|developer|engenharia|engineering|cto|cio|sistemas|information|software)\b/.test(t)) return 'Tecnologia';
  
  // Marketing & Comunicação
  if (/\b(marketing|mkt|brand|comunicação|comunicacao|publicidade|mídia|midia)\b/.test(t)) return 'Marketing';
  
  // Jurídico & Compliance
  if (/\b(legal|jurídico|juridico|compliance|regulatório|regulatorio|advocacia)\b/.test(t)) return 'Jurídico';
  
  // Customer Success & Suporte
  if (/\b(customer|cliente|success|suporte|support|atendimento|relacionamento|cs)\b/.test(t)) return 'Customer Success';
  
  // Qualidade & Processos
  if (/\b(quality|qualidade|processo|process|melhoria|improvement|qa|qc)\b/.test(t)) return 'Qualidade';
  
  // Produto & Inovação
  if (/\b(product|produto|pmo|innovation|inovação|inovacao|design)\b/.test(t)) return 'Produto';
  
  // P&D & Pesquisa
  if (/\b(p&d|pesquisa|research|desenvolvimento|r&d|innovation|inovação)\b/.test(t)) return 'P&D';
  
  // Administrativa
  if (/\b(administrativ|admin|geral|facility|facilities|services)\b/.test(t)) return 'Administrativo';

  return 'Outros';
};

// ==========================================
// Função para qualidade do contato
// ==========================================
const getContactQuality = (decisor: Decisor): { label: string; color: string; score: number } => {
  let score = decisor.contact_accuracy_score || 0;
  
  if (!score) {
    if (decisor.email) score += 40;
    if (decisor.phone) score += 20;
    if (decisor.linkedin_url) score += 20;
    if (decisor.email_status === 'verified') score += 20;
  }

  if (score >= 80) return { label: 'Excellent', color: 'text-green-600', score };
  if (score >= 50) return { label: 'Good', color: 'text-blue-600', score };
  if (score >= 30) return { label: 'Fair', color: 'text-orange-600', score };
  return { label: 'Poor', color: 'text-gray-500', score };
};

// ==========================================
// Componente Principal
// ==========================================
export function SeniorDecisorsPanel({ decisors, companyName }: SeniorDecisorsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmailStatuses, setSelectedEmailStatuses] = useState<Array<'verified' | 'guessed' | 'unavailable'>>([]);
  const [selectedDecisors, setSelectedDecisors] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'senior'>('all');

  // Processar decisores
  const processedDecisors = useMemo(() => {
    return decisors.map(d => {
      const seniorityInfo = getSeniorityLevel(d.title);
      const department = (d as any).department || (Array.isArray((d as any).departments) && (d as any).departments[0]) || getDepartment(d.title);
      const meta = (d as any).apollo_person_metadata || {};
      const location = d.location || (meta.city && meta.state ? `${meta.city}, ${meta.state}` : meta.city || meta.state || meta.country || undefined);
      const quality = getContactQuality(d);

      return {
        ...d,
        location,
        seniorityLevel: seniorityInfo.level,
        seniorityRank: seniorityInfo.rank,
        department,
        quality,
      } as any;
    }).sort((a, b) => a.seniorityRank - b.seniorityRank);
  }, [decisors]);

  // Extrair opções únicas para filtros
  const uniqueLevels = useMemo(() => {
    const levels = Array.from(new Set(processedDecisors.map(d => d.seniorityLevel)))
      .filter(l => l !== 'N/A');
    
    return levels.sort((a, b) => {
      const rankA = processedDecisors.find(d => d.seniorityLevel === a)?.seniorityRank || 99;
      const rankB = processedDecisors.find(d => d.seniorityLevel === b)?.seniorityRank || 99;
      return rankA - rankB;
    });
  }, [processedDecisors]);

  const uniqueDepartments = useMemo(() => 
    Array.from(new Set(processedDecisors.map(d => d.department).filter(d => d !== 'N/A'))).sort(),
    [processedDecisors]
  );

  const uniqueEmailStatuses = useMemo(() => {
    const set = new Set(processedDecisors.map(d => d.email_status).filter(Boolean));
    return Array.from(set) as Array<'verified' | 'guessed' | 'unavailable'>;
  }, [processedDecisors]);

  // Filtrar decisores
  const filteredDecisors = useMemo(() => {
    let filtered = processedDecisors;

    // Filtro por tab
    if (activeTab === 'verified') {
      filtered = filtered.filter(d => d.email_status === 'verified');
    } else if (activeTab === 'senior') {
      filtered = filtered.filter(d => ['C-Level', 'VP', 'Director'].includes(d.seniorityLevel));
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.name?.toLowerCase().includes(term) ||
        d.title?.toLowerCase().includes(term) ||
        d.email?.toLowerCase().includes(term) ||
        d.department?.toLowerCase().includes(term)
      );
    }

    // Filtro por níveis
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(d => selectedLevels.includes(d.seniorityLevel));
    }

    // Filtro por departamentos
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter(d => selectedDepartments.includes(d.department));
    }

    // Filtro por status de e-mail
    if (selectedEmailStatuses.length > 0) {
      filtered = filtered.filter(d => selectedEmailStatuses.includes(((d.email_status || 'unavailable') as any)));
    }

    return filtered;
  }, [processedDecisors, activeTab, searchTerm, selectedLevels, selectedDepartments]);

  // Estatísticas
  const stats = useMemo(() => ({
    total: filteredDecisors.length,
    withEmail: filteredDecisors.filter(d => d.email).length,
    verified: filteredDecisors.filter(d => d.email_status === 'verified').length,
    withLinkedIn: filteredDecisors.filter(d => d.linkedin_url).length,
    senior: filteredDecisors.filter(d => d.seniorityRank <= 3).length,
  }), [filteredDecisors]);

  // Handlers
  const toggleDecisor = (id: string) => {
    const newSelected = new Set(selectedDecisors);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDecisors(newSelected);
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const handleExport = () => {
    const selected = filteredDecisors.filter(d => d.id && selectedDecisors.has(d.id));
    console.log('Exportando contatos:', selected);
    // TODO: Implementar exportação
  };

  if (decisors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhum decisor encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Use os botões de enriquecimento para buscar contatos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Decision Makers
              {companyName && <span className="text-muted-foreground text-lg">@ {companyName}</span>}
            </CardTitle>
            <CardDescription className="mt-2">
              {stats.total} contatos • {stats.withEmail} com email • {stats.verified} verificados • {stats.senior} seniores
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({processedDecisors.length})</TabsTrigger>
            <TabsTrigger value="verified">
              Verified Email ({processedDecisors.filter(d => d.email_status === 'verified').length})
            </TabsTrigger>
            <TabsTrigger value="senior">
              Senior ({processedDecisors.filter(d => d.seniorityRank <= 3).length})
            </TabsTrigger>
          </TabsList>

          {/* Barra de Busca e Filtros */}
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Show Filters
                  {(selectedLevels.length > 0 || selectedDepartments.length > 0) && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedLevels.length + selectedDepartments.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  {uniqueLevels.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Seniority Levels</h4>
                      <div className="space-y-2">
                        {uniqueLevels.map(level => {
                          const count = processedDecisors.filter(d => d.seniorityLevel === level).length;
                          return (
                            <div key={level} className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <Checkbox
                                  checked={selectedLevels.includes(level)}
                                  onCheckedChange={() => toggleLevel(level)}
                                />
                                <span className="text-sm">{level}</span>
                              </label>
                              <Badge variant="secondary" className="text-xs">{count}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {uniqueDepartments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Departments</h4>
                      <div className="space-y-2">
                        {uniqueDepartments.map(dept => {
                          const count = processedDecisors.filter(d => d.department === dept).length;
                          return (
                            <div key={dept} className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <Checkbox
                                  checked={selectedDepartments.includes(dept)}
                                  onCheckedChange={() => toggleDepartment(dept)}
                                />
                                <span className="text-sm">{dept}</span>
                              </label>
                              <Badge variant="secondary" className="text-xs">{count}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(selectedLevels.length > 0 || selectedDepartments.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedLevels([]);
                        setSelectedDepartments([]);
                      }}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            {filteredDecisors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-lg">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contato encontrado com os filtros atuais</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm w-8">
                        <Checkbox
                          checked={selectedDecisors.size === filteredDecisors.length && filteredDecisors.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDecisors(new Set(filteredDecisors.map(d => d.id || d.name)));
                            } else {
                              setSelectedDecisors(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-3 font-medium text-sm">Name</th>
                      <th className="text-left p-3 font-medium text-sm">Reason</th>
                      <th className="text-left p-3 font-medium text-sm">Emails</th>
                      <th className="text-left p-3 font-medium text-sm">Location</th>
                      <th className="text-left p-3 font-medium text-sm">Department</th>
                      <th className="text-left p-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDecisors.map((decisor, idx) => {
                      const initials = decisor.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
                      const isSelected = decisor.id ? selectedDecisors.has(decisor.id) : selectedDecisors.has(decisor.name);

                      return (
                        <tr key={decisor.id || idx} className={cn(
                          "border-b hover:bg-muted/30 transition-colors",
                          isSelected && "bg-primary/5"
                        )}>
                          <td className="p-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleDecisor(decisor.id || decisor.name)}
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{decisor.name}</p>
                                <p className="text-sm text-muted-foreground">{decisor.title || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <Badge 
                                variant="secondary" 
                                className={cn("font-medium", decisor.quality.color)}
                              >
                                {decisor.quality.label}
                              </Badge>
                              {decisor.seniorityRank <= 3 && (
                                <Badge variant="outline" className="ml-1 border-purple-500 text-purple-700">
                                  <Target className="h-3 w-3 mr-1" />
                                  Targeted Seniority
                                </Badge>
                              )}
                              {decisor.source && decisor.source !== 'manual' && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "ml-1 text-xs",
                                    decisor.source === 'phantom' 
                                      ? 'border-purple-500 text-purple-700 dark:text-purple-400' 
                                      : 'border-blue-500 text-blue-700 dark:text-blue-400'
                                  )}
                                >
                                  {decisor.source === 'phantom' ? '🔮 Phantom' : '🚀 Apollo'}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {decisor.email ? (
                                <>
                                  <span className="text-sm">{decisor.email}</span>
                                  {decisor.email_status === 'verified' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : decisor.email_status === 'guessed' ? (
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                  ) : null}
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </div>
                            {decisor.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" />
                                {decisor.phone}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {decisor.location || 'N/A'}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{decisor.department}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {decisor.email && (
                                <Button size="sm" variant="default" className="h-8 bg-green-600 hover:bg-green-700">
                                  <Mail className="h-3 w-3 mr-1" />
                                  Access email
                                </Button>
                              )}
                              {!decisor.email && decisor.linkedin_url && (
                                <Button size="sm" variant="outline" className="h-8" asChild>
                                  <a href={decisor.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Floating Action Bar */}
        {selectedDecisors.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <span className="font-medium">{selectedDecisors.size} selected</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="secondary">
                <UserPlus className="h-4 w-4 mr-2" />
                Add to list
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-primary-foreground hover:bg-white/20"
                onClick={() => setSelectedDecisors(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
