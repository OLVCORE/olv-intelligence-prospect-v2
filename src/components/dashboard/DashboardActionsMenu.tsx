import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Settings2,
  Info,
  Loader2,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface DashboardActionsMenuProps {
  data: any;
  isExporting?: boolean;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onExportXLS: () => void;
  onExportJSON: () => void;
}

export function DashboardActionsMenu({
  data,
  isExporting = false,
  onExportPDF,
  onExportCSV,
  onExportXLS,
  onExportJSON
}: DashboardActionsMenuProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleCriteriaInfo = () => {
    toast({
      title: "📊 Critérios de Análise",
      description: (
        <div className="space-y-2 text-sm mt-2">
          <p><strong>Maturidade Digital:</strong> Score baseado em presença digital, tech stack e governança</p>
          <p><strong>Fit TOTVS:</strong> Compatibilidade com produtos TOTVS baseado em indústria, porte e necessidades</p>
          <p><strong>Health Score:</strong> Saúde financeira e operacional da empresa</p>
          <p><strong>Pipeline Value:</strong> Valor potencial estimado com base em histórico e perfil</p>
        </div>
      ),
      duration: 10000,
    });
    setIsOpen(false);
  };

  const handleAnalyticsConfig = () => {
    toast({
      title: "⚙️ Configurações",
      description: "Funcionalidade em desenvolvimento. Configure métricas personalizadas e alertas.",
      duration: 5000,
    });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="default"
          disabled={isExporting}
          aria-label="Menu de ações do dashboard"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg transition-all"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Settings2 className="h-4 w-4" />
          )}
          Ações
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 z-[100] bg-popover/95 backdrop-blur-md border-border/50"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Dashboard Command Center
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Exportar Dados</DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={onExportPDF}
            disabled={isExporting}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar como PDF
            <span className="ml-auto text-xs text-muted-foreground">Visual</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onExportCSV}
            disabled={isExporting}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar como CSV
            <span className="ml-auto text-xs text-muted-foreground">Dados</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onExportXLS}
            disabled={isExporting}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar como Excel
            <span className="ml-auto text-xs text-muted-foreground">XLS</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onExportJSON}
            disabled={isExporting}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <FileJson className="h-4 w-4 mr-2" />
            Exportar como JSON
            <span className="ml-auto text-xs text-muted-foreground">Dev</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Análise & Insights</DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={handleCriteriaInfo}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Info className="h-4 w-4 mr-2" />
            Entender Critérios de Análise
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              navigate('/companies');
              setIsOpen(false);
            }}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Target className="h-4 w-4 mr-2" />
            Ver Base de Empresas
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              navigate('/sdr/pipeline');
              setIsOpen(false);
            }}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Pipeline de Vendas
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={handleAnalyticsConfig}
          className="font-medium transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Configurações de Analytics
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
