import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Linkedin, Phone, Search, Filter, Users, Building2, TrendingUp, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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

// Função para determinar senioridade baseada no título - INCLUSIVO para pessoal corporativo
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
  
  // Specialist / Analyst / Professional (Rank 1) - Pessoal corporativo
  if (titleLower.match(/\b(specialist|especialista|analyst|analista|consultant|consultor|buyer|comprador|purchaser|inside sales|sales|vendas|vendedor|executive|executivo|professional|profissional|pleno|senior|sênior|jr|junior|júnior)\b/)) {
    return { level: 'Professional', rank: 1 };
  }
  
  // Assistant / Auxiliary (Rank 1) - Apoio corporativo
  if (titleLower.match(/\b(assistant|assistente|auxiliar|auxiliary|secretary|secretária|administrative|administrativo|administrativa|intern|estagiário|trainee|aprendiz)\b/)) {
    return { level: 'Corporate', rank: 1 };
  }
  
  // Department roles (Rank 1) - Cargos de departamento
  if (titleLower.match(/\b(department|departamento|finance|financeiro|financial|sales|commercial|comercial|marketing|operations|operações|hr|rh|human resources|it|ti|technology|procurement|suprimentos|logistics|logística)\b/)) {
    return { level: 'Corporate', rank: 1 };
  }
  
  // Excluir apenas cargos operacionais/chão de fábrica
  if (titleLower.match(/\b(operator|operador|operadora|driver|motorista|forklift|empilhadeira|production worker|operário|ajudante|helper|mechanic|mecânico|technician|técnico de manutenção|porter|porteiro|cleaner|faxineiro|guard|segurança)\b/)) {
    return { level: 'Operational', rank: 0 };
  }
  
  return { level: 'Corporate', rank: 1 }; // Por padrão, considera corporativo
};

export function SeniorDecisorsPanel({ decisors, companyName }: SeniorDecisorsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // Processar todos os decisores sem filtrar por rank
  const allDecisors = useMemo(() => {
    return decisors
      .map(d => ({
        ...d,
        seniorityInfo: getSeniorityLevel(d.title)
      }))
      .sort((a, b) => b.seniorityInfo.rank - a.seniorityInfo.rank); // Ordenar por senioridade
  }, [decisors]);

  // Aplicar filtros
  const filteredDecisors = useMemo(() => {
    return allDecisors.filter(decisor => {
      const matchesSearch = !searchTerm || 
        decisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decisor.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decisor.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(decisor.seniorityInfo.level);
      
      const matchesDepartment = selectedDepartments.length === 0 || 
        (decisor.department && selectedDepartments.includes(decisor.department));
      
      return matchesSearch && matchesLevel && matchesDepartment;
    });
  }, [allDecisors, searchTerm, selectedLevels, selectedDepartments]);

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
    const withEmail = filteredDecisors.filter(d => d.email).length;
    const withLinkedIn = filteredDecisors.filter(d => d.linkedin_url).length;
    const withPhone = filteredDecisors.filter(d => d.phone).length;
    
    return {
      total: filteredDecisors.length,
      withEmail,
      withLinkedIn,
      withPhone,
      emailRate: Math.round((withEmail / filteredDecisors.length) * 100) || 0,
      linkedInRate: Math.round((withLinkedIn / filteredDecisors.length) * 100) || 0
    };
  }, [filteredDecisors]);

  const getEmailStatusColor = (status?: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 dark:text-green-400';
      case 'guessed': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  const getEmailStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified': return '✓';
      case 'guessed': return '~';
      default: return '?';
    }
  };

  const getSeniorityBadgeVariant = (level: string) => {
    switch (level) {
      case 'C-Level': return 'default';
      case 'VP': return 'secondary';
      case 'Director': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Decisores Seniores
              {companyName && <span className="text-muted-foreground">- {companyName}</span>}
            </CardTitle>
            <CardDescription>
              Pessoal corporativo: Assistentes, Analistas, Vendedores, Gerentes e Executivos
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{stats.emailRate}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {stats.withEmail} de {stats.total} com email
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">{stats.linkedInRate}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {stats.withLinkedIn} de {stats.total} com LinkedIn
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cargo ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Filtro de Níveis - Múltipla Escolha */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Níveis
                {selectedLevels.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedLevels.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Níveis de Senioridade</h4>
                  {selectedLevels.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLevels([])}
                      className="h-6 px-2 text-xs"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {availableLevels.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`level-${level}`}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLevels([...selectedLevels, level]);
                          } else {
                            setSelectedLevels(selectedLevels.filter(l => l !== level));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`level-${level}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Filtro de Departamentos - Múltipla Escolha */}
          {availableDepartments.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Departamentos
                  {selectedDepartments.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedDepartments.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Departamentos</h4>
                    {selectedDepartments.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDepartments([])}
                        className="h-6 px-2 text-xs"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {availableDepartments.map((dept) => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept}`}
                          checked={selectedDepartments.includes(dept)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDepartments([...selectedDepartments, dept]);
                            } else {
                              setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`dept-${dept}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {dept}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Limpar todos os filtros */}
          {(selectedLevels.length > 0 || selectedDepartments.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedLevels([]);
                setSelectedDepartments([]);
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Lista de Decisores */}
        <div className="space-y-3">
          {filteredDecisors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum contato corporativo encontrado</p>
              <p className="text-sm mt-1">Use o Apollo para buscar contatos da empresa</p>
            </div>
          ) : (
            filteredDecisors.map((decisor) => (
              <Card key={decisor.id} className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {decisor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info Principal */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{decisor.name}</h3>
                          <p className="text-sm text-muted-foreground">{decisor.title || 'Cargo não especificado'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeniorityBadgeVariant(decisor.seniorityInfo.level)}>
                            {decisor.seniorityInfo.level}
                          </Badge>
                          {decisor.source === 'apollo' && (
                            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
                              Apollo
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Departamento */}
                      {decisor.department && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{decisor.department}</span>
                        </div>
                      )}

                      {/* Contatos */}
                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        {/* Email */}
                        {decisor.email ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <Mail className={`h-4 w-4 ${getEmailStatusColor(decisor.email_status)}`} />
                                  <a 
                                    href={`mailto:${decisor.email}`}
                                    className="text-sm font-medium hover:underline"
                                  >
                                    {decisor.email}
                                  </a>
                                  <span className={`text-xs ${getEmailStatusColor(decisor.email_status)}`}>
                                    {getEmailStatusIcon(decisor.email_status)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {decisor.email_status === 'verified' && 'Email verificado'}
                                {decisor.email_status === 'guessed' && 'Email estimado'}
                                {!decisor.email_status && 'Status desconhecido'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email não disponível
                          </span>
                        )}

                        {/* LinkedIn */}
                        {decisor.linkedin_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="gap-2"
                          >
                            <a 
                              href={decisor.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Linkedin className="h-4 w-4 text-blue-600" />
                              LinkedIn
                            </a>
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Linkedin className="h-4 w-4" />
                            LinkedIn não disponível
                          </span>
                        )}

                        {/* Phone */}
                        {decisor.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${decisor.phone}`} className="hover:underline">
                              {decisor.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Rodapé com estatísticas */}
        {filteredDecisors.length > 0 && (
          <div className="pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Exibindo <strong>{filteredDecisors.length}</strong> de <strong>{allDecisors.length}</strong> contatos
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Qualidade de dados: <strong>{Math.round((stats.emailRate + stats.linkedInRate) / 2)}%</strong></span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
