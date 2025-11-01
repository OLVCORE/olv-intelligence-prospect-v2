import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";

interface QuarantineCNPJStatusBadgeProps {
  cnpj?: string;
  cnpjStatus?: string;
}

export function QuarantineCNPJStatusBadge({ cnpj, cnpjStatus }: QuarantineCNPJStatusBadgeProps) {
  if (!cnpj) {
    return (
      <Badge variant="secondary" className="gap-1 bg-gray-500/10 text-gray-600 border-gray-500/20">
        <Clock className="w-3 h-3" />
        Não descoberto
      </Badge>
    );
  }

  // Verde limão sólido quando ATIVA (situação da Receita Federal)
  if (cnpjStatus === 'ativa' || cnpjStatus === 'ativo') {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="w-3 h-3" />
        Ativa
      </Badge>
    );
  }

  if (cnpjStatus === 'inativo') {
    return (
      <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
        <AlertTriangle className="w-3 h-3" />
        Inativo
      </Badge>
    );
  }

  if (cnpjStatus === 'inexistente') {
    return (
      <Badge variant="destructive" className="gap-1 bg-red-500/10 text-red-600 border-red-500/20">
        <XCircle className="w-3 h-3" />
        Inexistente
      </Badge>
    );
  }

  // Azul quando tem CNPJ mas status ainda não verificado
  return (
    <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
      <Clock className="w-3 h-3" />
      Pendente
    </Badge>
  );
}
