import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useCompanyMonitoring, useToggleCompanyMonitoring } from "@/hooks/useCompanyMonitoring";

interface MonitoringToggleButtonProps {
  companyId: string;
  companyName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function MonitoringToggleButton({ 
  companyId, 
  companyName, 
  variant = "outline",
  size = "default" 
}: MonitoringToggleButtonProps) {
  const { data: monitoring, isLoading } = useCompanyMonitoring(companyId);
  const { mutate: toggle, isPending } = useToggleCompanyMonitoring();

  const isMonitoring = monitoring?.is_active || false;

  const handleToggle = () => {
    toggle({
      companyId,
      isActive: !isMonitoring,
    });
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleToggle}
        disabled={isPending}
        variant={isMonitoring ? "default" : variant}
        size={size}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isMonitoring ? (
          <Eye className="h-4 w-4 mr-2" />
        ) : (
          <EyeOff className="h-4 w-4 mr-2" />
        )}
        {isMonitoring ? 'Monitorando' : 'Monitorar Empresa'}
      </Button>
      
      {isMonitoring && monitoring && (
        <Badge variant="outline" className="text-xs">
          🔄 A cada {monitoring.check_frequency_hours}h
        </Badge>
      )}
    </div>
  );
}
