import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, FileJson } from "lucide-react";
import type { ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  data: any;
  filename: string;
  type?: 'company' | 'maturity' | 'fit' | 'general';
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function ExportButton({ data, filename, type = 'general', variant = 'outline', size = 'sm' }: ExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportAsJSON = () => {
    try {
      setIsExporting(true);
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Export concluído",
        description: "Arquivo JSON baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = () => {
    try {
      setIsExporting(true);
      
      // Flatten nested objects
      const flattenObject = (obj: any, prefix = ''): any => {
        return Object.keys(obj).reduce((acc: any, k: string) => {
          const pre = prefix.length ? prefix + '.' : '';
          if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
          } else if (Array.isArray(obj[k])) {
            acc[pre + k] = obj[k].join(', ');
          } else {
            acc[pre + k] = obj[k];
          }
          return acc;
        }, {});
      };

      const flatData = Array.isArray(data) 
        ? data.map(item => flattenObject(item))
        : [flattenObject(data)];

      const headers = Object.keys(flatData[0]);
      const csvRows = [
        headers.join(','),
        ...flatData.map((row: any) =>
          headers.map(header => {
            const value = row[header];
            const escaped = ('' + value).replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(',')
        )
      ];

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Export concluído",
        description: "Arquivo CSV baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsTXT = () => {
    try {
      setIsExporting(true);
      
      const formatObject = (obj: any, indent = 0): string => {
        const indentStr = '  '.repeat(indent);
        let result = '';
        
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result += `${indentStr}${key}:\n`;
            result += formatObject(value, indent + 1);
          } else if (Array.isArray(value)) {
            result += `${indentStr}${key}: ${value.join(', ')}\n`;
          } else {
            result += `${indentStr}${key}: ${value}\n`;
          }
        }
        
        return result;
      };

      const textContent = Array.isArray(data)
        ? data.map((item, idx) => `\n=== Item ${idx + 1} ===\n${formatObject(item)}`).join('\n')
        : formatObject(data);

      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Export concluído",
        description: "Arquivo TXT baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Formato de Export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsJSON} className="cursor-pointer">
          <FileJson className="h-4 w-4 mr-2" />
          JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCSV} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsTXT} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          TXT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
