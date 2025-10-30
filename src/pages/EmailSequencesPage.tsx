import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Mail,
  Plus,
  Play,
  Pause,
  Archive,
  Edit,
  Trash2,
  RefreshCw,
  Users,
  Send,
} from 'lucide-react';
import { useEmailSequences } from '@/hooks/useEmailSequences';

export default function EmailSequencesPage() {
  const [search, setSearch] = useState('');
  const { data: sequences, isLoading } = useEmailSequences();

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'manual': return '✋';
      case 'stage_change': return '🔄';
      case 'deal_created': return '✨';
      case 'time_based': return '⏰';
      default: return '📧';
    }
  };

  const filteredSequences = sequences?.filter(seq =>
    seq.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary" />
            Email Sequences
          </h1>
          <p className="text-muted-foreground mt-1">
            Automatize seu follow-up com sequências inteligentes
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Sequência
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{sequences?.length || 0}</p>
            </div>
            <Mail className="w-8 h-8 text-primary opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ativas</p>
              <p className="text-2xl font-bold">
                {sequences?.filter(s => s.status === 'active').length || 0}
              </p>
            </div>
            <Play className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pausadas</p>
              <p className="text-2xl font-bold">
                {sequences?.filter(s => s.status === 'paused').length || 0}
              </p>
            </div>
            <Pause className="w-8 h-8 text-yellow-500 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rascunhos</p>
              <p className="text-2xl font-bold">
                {sequences?.filter(s => s.status === 'draft').length || 0}
              </p>
            </div>
            <Edit className="w-8 h-8 text-gray-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Buscar sequências..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Table */}
      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sequência</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inscritos</TableHead>
                <TableHead>Taxa Abertura</TableHead>
                <TableHead>Taxa Resposta</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSequences?.map((sequence) => (
                <TableRow key={sequence.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {sequence.name}
                      </div>
                      {sequence.description && (
                        <div className="text-sm text-muted-foreground">
                          {sequence.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{getTriggerIcon(sequence.trigger_type)}</span>
                      <span className="text-sm capitalize">
                        {sequence.trigger_type.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(sequence.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>0</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">--</div>
                      <Badge variant="outline" className="text-xs">Em breve</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">--</div>
                      <Badge variant="outline" className="text-xs">Em breve</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {sequence.status === 'active' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!isLoading && (!filteredSequences || filteredSequences.length === 0) && (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma sequência encontrada
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Sequência
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
