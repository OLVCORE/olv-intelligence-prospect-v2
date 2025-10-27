import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Linkedin, Phone, Search, Filter, Users, Building2, MapPin, CheckCircle2, ChevronDown, UserCheck, Download, ListPlus, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Decisor {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  department?: string;
  seniority?: string;
  email_status?: 'verified' | 'guessed' | 'unavailable';
  source?: string;
}

interface SeniorDecisorsPanelProps {
  decisors: Decisor[];
  companyName?: string;
}

// Função para determinar senioridade baseada no título
const getSeniorityLevel = (title?: string): { level: string; rank: number } => {
  if (!title) return { level: 'Unknown', rank: 0 };
  
  const titleLower = title.toLowerCase();
  
  // C-Level (Rank 6)
  if (titleLower.match(/\b(ceo|cto|cfo|coo|cio|cmo|president|presidente|chairman|owner|proprietário|sócio)\b/)) {
    return { level: 'C-Level', rank: 6 };
  }
  
  // VP / Vice President (Rank 5)
  if (titleLower.match(/\b(vp|vice.president|vice.presidente)\b/)) {
    return { level: 'VP', rank: 5 };
  }
  
  // Director / Diretor (Rank 4)
  if (titleLower.match(/\b(director|diretor|diretora|head of|head da)\b/)) {
    return { level: 'Director', rank: 4 };
  }
  
  // Manager / Gerente (Rank 3)
  if (titleLower.match(/\b(manager|gerente|coordinator|coordenador|coordenadora|account manager)\b/)) {
    return { level: 'Manager', rank: 3 };
  }
  
  // Supervisor (Rank 2)
  if (titleLower.match(/\b(supervisor|supervisora|lead|líder|team lead)\b/)) {
    return { level: 'Supervisor', rank: 2 };
  }
  
  // Specialist / Analyst / Professional (Rank 1)
  if (titleLower.match(/\b(specialist|especialista|analyst|analista|consultant|consultor|buyer|comprador|purchaser|inside sales|sales|vendas|vendedor|executive|executivo|professional|profissional|pleno|senior|sênior|jr|junior|júnior)\b/)) {
    return { level: 'Professional', rank: 1 };
  }
  
  // Assistant / Auxiliary (Rank 1)
  if (titleLower.match(/\b(assistant|assistente|auxiliar|auxiliary|secretary|secretária|administrative|administrativo|administrativa|intern|estagiário|trainee|aprendiz)\b/)) {
    return { level: 'Corporate', rank: 1 };
  }
  
  // Department roles (Rank 1)
  if (titleLower.match(/\b(department|departamento|finance|financeiro|financial|sales|commercial|comercial|marketing|operations|operações|hr|rh|human resources|it|ti|technology|procurement|suprimentos|logistics|logística)\b/)) {
    return { level: 'Corporate', rank: 1 };
  }
  
  // Excluir apenas cargos operacionais
  if (titleLower.match(/\b(operator|operador|operadora|driver|motorista|forklift|empilhadeira|production worker|operário|ajudante|helper|mechanic|mecânico|technician|técnico de manutenção|porter|porteiro|cleaner|faxineiro|guard|segurança)\b/)) {
    return { level: 'Operational', rank: 0 };
  }
  
  return { level: 'Corporate', rank: 1 };
};

export function SeniorDecisorsPanel({ decisors, companyName }: SeniorDecisorsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedDecisors, setSelectedDecisors] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Processar todos os decisores
  const allDecisors = useMemo(() => {
    return decisors
      .map(d => ({
        ...d,
        seniorityInfo: getSeniorityLevel(d.title)
      }))
      .sort((a, b) => b.seniorityInfo.rank - a.seniorityInfo.rank);
  }, [decisors]);

  // Aplicar filtros
  const filteredDecisors = useMemo(() => {
    return allDecisors.filter(decisor => {
      // Filtro de busca
      const matchesSearch = !searchTerm || 
        decisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decisor.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decisor.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de nível
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(decisor.seniorityInfo.level);
      
      // Filtro de departamento
      const matchesDepartment = selectedDepartments.length === 0 || 
        (decisor.department && selectedDepartments.includes(decisor.department));
      
      // Filtro de tab
      let matchesTab = true;
      if (activeTab === 'verified') {
        matchesTab = decisor.email_status === 'verified';
      } else if (activeTab === 'senior') {
        matchesTab = decisor.seniorityInfo.rank >= 3;
      }
      
      return matchesSearch && matchesLevel && matchesDepartment && matchesTab;
    });
  }, [allDecisors, searchTerm, selectedLevels, selectedDepartments, activeTab]);

  // Extrair níveis e departamentos únicos
  const availableLevels = useMemo(() => {
    const levels = new Set(allDecisors.map(d => d.seniorityInfo.level));
    return Array.from(levels).sort((a, b) => {
      const rankA = allDecisors.find(d => d.seniorityInfo.level === a)?.seniorityInfo.rank || 0;
      const rankB = allDecisors.find(d => d.seniorityInfo.level === b)?.seniorityInfo.rank || 0;
      return rankB - rankA;
    });
  }, [allDecisors]);

  const availableDepartments = useMemo(() => {
    const depts = new Set(allDecisors.map(d => d.department).filter(Boolean));
    return Array.from(depts) as string[];
  }, [allDecisors]);

  // Estatísticas
  const stats = useMemo(() => {
    const withEmail = allDecisors.filter(d => d.email).length;
    const withLinkedIn = allDecisors.filter(d => d.linkedin_url).length;
    const withPhone = allDecisors.filter(d => d.phone).length;
    
    return {
      total: allDecisors.length,
      withEmail,
      withLinkedIn,
      withPhone,
      emailRate: Math.round((withEmail / allDecisors.length) * 100) || 0,
      linkedInRate: Math.round((withLinkedIn / allDecisors.length) * 100) || 0
    };
  }, [allDecisors]);

  // Cálculo de razão de qualificação
  const getLeadQualificationReason = (decisor: Decisor & { seniorityInfo: { level: string; rank: number } }): string => {
    const reasons = [];
    if (decisor.seniorityInfo.rank >= 3) reasons.push('Seniority');
    if (decisor.email && decisor.email_status === 'verified') reasons.push('Email Verificado');
    if (decisor.linkedin_url) reasons.push('LinkedIn');
    return reasons.length > 0 ? reasons.join(', ') : 'Contato Identificado';
  };

  // Determinar qualidade do lead
  const getLeadQuality = (decisor: Decisor & { seniorityInfo: { level: string; rank: number } }): 'excellent' | 'good' | 'fair' => {
    if (decisor.seniorityInfo.rank >= 4 && decisor.email && decisor.email_status === 'verified') return 'excellent';
    if (decisor.seniorityInfo.rank >= 3 || (decisor.email && decisor.email_status === 'verified')) return 'good';
    return 'fair';
  };

  // Selecionar/desselecionar todos
  const toggleSelectAll = () => {
    if (selectedDecisors.length === filteredDecisors.length) {
      setSelectedDecisors([]);
    } else {
      setSelectedDecisors(filteredDecisors.map(d => d.id));
    }
  };

  // Selecionar/desselecionar um decisor
  const toggleSelectDecisor = (id: string) => {
    if (selectedDecisors.includes(id)) {
      setSelectedDecisors(selectedDecisors.filter(d => d !== id));
    } else {
      setSelectedDecisors([...selectedDecisors, id]);
    }
  };

  return (
    <>
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Apollo Intelligence
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {filteredDecisors.length} contato(s) • {stats.withEmail} com email • {stats.emailRate}% cobertura
              </CardDescription>
            </div>
          </div>

          {/* Tabs e Busca */}
          <div className="space-y-4 mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="all" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Todos ({allDecisors.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="verified" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Email Verificado ({allDecisors.filter(d => d.email_status === 'verified').length})
                </TabsTrigger>
                <TabsTrigger 
                  value="senior" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Seniores ({allDecisors.filter(d => d.seniorityInfo.rank >= 3).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4 space-y-4">
                {/* Barra de Filtros e Busca */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Show Filters Button */}
                  <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2 justify-start">
                        <Filter className="h-4 w-4" />
                        Filtros
                        {(selectedLevels.length > 0 || selectedDepartments.length > 0) && (
                          <Badge variant="secondary" className="ml-1">
                            {selectedLevels.length + selectedDepartments.length}
                          </Badge>
                        )}
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-3">Níveis de Senioridade</h4>
                          <div className="space-y-2">
                            {availableLevels.map((level) => (
                              <div key={level} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`filter-level-${level}`}
                                  checked={selectedLevels.includes(level)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedLevels([...selectedLevels, level]);
                                    } else {
                                      setSelectedLevels(selectedLevels.filter(l => l !== level));
                                    }
                                  }}
                                />
                                <Label htmlFor={`filter-level-${level}`} className="text-sm font-normal cursor-pointer">
                                  {level}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {availableDepartments.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-3">Departamentos</h4>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {availableDepartments.map((dept) => (
                                <div key={dept} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`filter-dept-${dept}`}
                                    checked={selectedDepartments.includes(dept)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedDepartments([...selectedDepartments, dept]);
                                      } else {
                                        setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`filter-dept-${dept}`} className="text-sm font-normal cursor-pointer">
                                    {dept}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(selectedLevels.length > 0 || selectedDepartments.length > 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLevels([]);
                              setSelectedDepartments([]);
                            }}
                            className="w-full"
                          >
                            Limpar todos os filtros
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Busca */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar pessoas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tabela de Contatos - Estilo Apollo */}
                {filteredDecisors.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhum contato encontrado</p>
                    <p className="text-sm text-muted-foreground mt-1">Ajuste os filtros ou busque novamente</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedDecisors.length === filteredDecisors.length && filteredDecisors.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="font-semibold">Nome</TableHead>
                          <TableHead className="font-semibold">Razão</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Localização</TableHead>
                          <TableHead className="font-semibold">Departamento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDecisors.map((decisor) => {
                          const quality = getLeadQuality(decisor);
                          
                          return (
                            <TableRow key={decisor.id} className="hover:bg-muted/30">
                              <TableCell>
                                <Checkbox
                                  checked={selectedDecisors.includes(decisor.id)}
                                  onCheckedChange={() => toggleSelectDecisor(decisor.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                      {decisor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{decisor.name}</div>
                                    <div className="text-sm text-muted-foreground">{decisor.title || 'Cargo não especificado'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  {quality === 'fair' && (
                                    <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                      <span className="mr-1">⚠</span> Fair
                                    </Badge>
                                  )}
                                  {quality === 'good' && (
                                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                      <UserCheck className="h-3 w-3 mr-1" /> Good
                                    </Badge>
                                  )}
                                  {quality === 'excellent' && (
                                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                      <CheckCircle2 className="h-3 w-3 mr-1" /> Excellent
                                    </Badge>
                                  )}
                                  {decisor.seniorityInfo.rank >= 3 && (
                                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                      ⭐ Targeted Seniority
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {decisor.email ? (
                                  <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/30"
                                            onClick={() => window.location.href = `mailto:${decisor.email}`}
                                          >
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Acessar Email
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs font-medium">{decisor.email}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Status: {decisor.email_status === 'verified' ? '✓ Verificado' : '~ Estimado'}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Email não disponível</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>São Paulo, Brazil</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{decisor.department || 'N/A'}</span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      {/* Barra flutuante de seleção */}
      {selectedDecisors.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <Card className="shadow-2xl border-2 border-primary/20">
            <CardContent className="py-4 px-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">
                    {selectedDecisors.length} contato(s) selecionado(s)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                  <Button size="sm" variant="secondary" className="gap-2">
                    <ListPlus className="h-4 w-4" />
                    Adicionar à Lista
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedDecisors([])}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
