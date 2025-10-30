import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, Copy, Play, Star, Search, Filter,
  Mail, Phone, MessageSquare, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface SequenceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'cold_outreach' | 'follow_up' | 'nurturing' | 'closing';
  steps: number;
  duration_days: number;
  success_rate: number;
  used_count: number;
  channels: string[];
}

const TEMPLATES: SequenceTemplate[] = [
  {
    id: '1',
    name: 'Cold Outreach Executivos C-Level',
    description: 'Sequência premium para prospecção de executivos seniores com foco em valor e personalização',
    category: 'cold_outreach',
    steps: 7,
    duration_days: 21,
    success_rate: 32,
    used_count: 245,
    channels: ['email', 'linkedin', 'call']
  },
  {
    id: '2',
    name: 'Follow-up Pós-Demo',
    description: 'Sequência otimizada para converter leads após demonstração do produto',
    category: 'follow_up',
    steps: 5,
    duration_days: 14,
    success_rate: 45,
    used_count: 189,
    channels: ['email', 'call', 'whatsapp']
  },
  {
    id: '3',
    name: 'Nurturing Long-term',
    description: 'Cadência de nutrição para leads que não estão prontos para comprar agora',
    category: 'nurturing',
    steps: 12,
    duration_days: 90,
    success_rate: 18,
    used_count: 156,
    channels: ['email', 'linkedin']
  },
  {
    id: '4',
    name: 'Closing Fast-Track',
    description: 'Sequência acelerada para fechar deals quentes com urgência',
    category: 'closing',
    steps: 4,
    duration_days: 7,
    success_rate: 68,
    used_count: 321,
    channels: ['call', 'whatsapp', 'email']
  },
  {
    id: '5',
    name: 'Re-engagement Leads Frios',
    description: 'Reativar leads que pararam de responder ou ficaram inativos',
    category: 'follow_up',
    steps: 6,
    duration_days: 18,
    success_rate: 22,
    used_count: 98,
    channels: ['email', 'linkedin']
  },
  {
    id: '6',
    name: 'Prospecting SMB/PME',
    description: 'Sequência otimizada para pequenas e médias empresas com ciclo de venda curto',
    category: 'cold_outreach',
    steps: 5,
    duration_days: 10,
    success_rate: 38,
    used_count: 412,
    channels: ['email', 'whatsapp', 'call']
  }
];

export function SequenceTemplateLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const useTemplate = (template: SequenceTemplate) => {
    toast.success(`Template "${template.name}" carregado no editor!`);
    console.log('Usando template:', template);
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      cold_outreach: 'bg-blue-100 text-blue-700',
      follow_up: 'bg-green-100 text-green-700',
      nurturing: 'bg-purple-100 text-purple-700',
      closing: 'bg-orange-100 text-orange-700'
    };
    const labels = {
      cold_outreach: 'Cold Outreach',
      follow_up: 'Follow-up',
      nurturing: 'Nurturing',
      closing: 'Fechamento'
    };
    return (
      <Badge className={colors[category as keyof typeof colors]}>
        {labels[category as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Biblioteca de Templates de Sequências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            <Button
              variant={selectedCategory === 'cold_outreach' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('cold_outreach')}
            >
              Cold Outreach
            </Button>
            <Button
              variant={selectedCategory === 'follow_up' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('follow_up')}
            >
              Follow-up
            </Button>
            <Button
              variant={selectedCategory === 'nurturing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('nurturing')}
            >
              Nurturing
            </Button>
            <Button
              variant={selectedCategory === 'closing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('closing')}
            >
              Fechamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                  {getCategoryBadge(template.category)}
                </div>
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 py-3 border-t border-b">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{template.steps}</p>
                  <p className="text-xs text-muted-foreground">Passos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{template.success_rate}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Sucesso</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{template.duration_days}</p>
                  <p className="text-xs text-muted-foreground">Dias</p>
                </div>
              </div>

              {/* Channels */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Canais:</span>
                {template.channels.map((channel) => (
                  <Badge key={channel} variant="outline" className="text-xs">
                    {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                    {channel === 'call' && <Phone className="h-3 w-3 mr-1" />}
                    {(channel === 'linkedin' || channel === 'whatsapp') && <MessageSquare className="h-3 w-3 mr-1" />}
                    {channel}
                  </Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Usado {template.used_count} vezes
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => useTemplate(template)}
                >
                  <Copy className="h-4 w-4" />
                  Usar Template
                </Button>
                <Button variant="outline" size="icon">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum template encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
