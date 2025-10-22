import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, GitBranch, MessageSquare, Link2, ArrowRight, Plus, Trash2, Edit } from 'lucide-react';
import type { CanvasActivity } from '@/hooks/useCanvasBlocks';

interface TimelinePanelProps {
  activities: CanvasActivity[];
}

export const TimelinePanel = ({ activities }: TimelinePanelProps) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created': return <Plus className="h-4 w-4" />;
      case 'updated': return <Edit className="h-4 w-4" />;
      case 'deleted': return <Trash2 className="h-4 w-4" />;
      case 'commented': return <MessageSquare className="h-4 w-4" />;
      case 'version_created': return <GitBranch className="h-4 w-4" />;
      case 'linked': return <Link2 className="h-4 w-4" />;
      case 'promoted': return <ArrowRight className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'created': return 'text-green-600 bg-green-100';
      case 'updated': return 'text-blue-600 bg-blue-100';
      case 'deleted': return 'text-red-600 bg-red-100';
      case 'commented': return 'text-purple-600 bg-purple-100';
      case 'version_created': return 'text-indigo-600 bg-indigo-100';
      case 'linked': return 'text-orange-600 bg-orange-100';
      case 'promoted': return 'text-emerald-600 bg-emerald-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Timeline de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma atividade registrada ainda
              </p>
            ) : (
              activities.map((activity, index) => (
                <div key={activity.id} className="relative">
                  {index < activities.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(activity.action_type)}`}>
                      {getActionIcon(activity.action_type)}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString('pt-BR')}
                          </p>
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(activity.metadata).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};