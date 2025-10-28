import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface Technology {
  name: string;
  category?: string;
  source?: string;
  detected_at?: string;
}

interface TechnologiesFullListProps {
  technologies: Technology[];
}

export function TechnologiesFullList({ technologies }: TechnologiesFullListProps) {
  if (!technologies || technologies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma tecnologia detectada para esta empresa.
      </div>
    );
  }

  // Agrupar por categoria
  const grouped = technologies.reduce((acc, tech) => {
    const category = tech.category || "Outras";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tech);
    return acc;
  }, {} as Record<string, Technology[]>);

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Total: {technologies.length} tecnologias detectadas
      </div>

      {Object.entries(grouped).map(([category, techs]) => (
        <div key={category} className="space-y-3">
          <h3 className="font-semibold text-lg border-b pb-2">{category}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {techs.map((tech, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{tech.name}</div>
                    
                    {tech.source && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Fonte: {tech.source}
                      </div>
                    )}
                    
                    {tech.detected_at && (
                      <div className="text-xs text-muted-foreground">
                        Detectado: {new Date(tech.detected_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                  
                  {tech.category && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {tech.category}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
