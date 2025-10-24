import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Company {
  id: string;
  name: string;
  industry?: string | null;
  employees?: number | null;
}

interface CompanySelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "single" | "multiple";
  onConfirm: (companyIds: string[]) => Promise<void> | void;
  title?: string;
  confirmLabel?: string;
}

export function CompanySelectDialog({
  open,
  onOpenChange,
  mode,
  onConfirm,
  title = "Selecionar Empresas",
  confirmLabel = "Analisar selecionadas",
}: CompanySelectDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("companies")
        .select("id,name,industry,employees")
        .order("name", { ascending: true })
        .limit(200);
      if (isMounted) {
        setCompanies(data || []);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
      setSelectedIds([]);
    };
  }, [open]);

  const toggleSelect = (id: string) => {
    if (mode === "single") {
      setSelectedIds([id]);
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    try {
      setConfirming(true);
      await onConfirm(selectedIds);
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="p-3 border-b bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/80">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {mode === "multiple" && (
            <Badge variant="secondary" className="ml-2">
              {selectedIds.length} selecionada{selectedIds.length === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
      </div>
      <CommandInput placeholder="Buscar empresa pelo nome..." />
      <CommandList>
        <CommandEmpty>
          {loading ? "Carregando empresas..." : "Nenhuma empresa encontrada."}
        </CommandEmpty>
        <CommandGroup heading="Empresas">
          {companies.map((c) => (
            <CommandItem
              key={c.id}
              value={c.name}
              onSelect={() => toggleSelect(c.id)}
              className="cursor-pointer"
            >
              {mode === "multiple" ? (
                <Checkbox
                  checked={selectedIds.includes(c.id)}
                  onCheckedChange={() => toggleSelect(c.id)}
                  className="mr-2"
                />
              ) : (
                <div
                  className={`mr-2 size-3 rounded-full border ${
                    selectedIds[0] === c.id ? "bg-primary border-primary" : "border-muted"
                  }`}
                />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">
                  {c.industry || "Sem setor"}
                  {typeof c.employees === "number" && ` • ${c.employees} funcionários`}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-end gap-2 border-t p-3 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/80">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={selectedIds.length === 0 || confirming}
        >
          {confirming ? "Processando..." : confirmLabel}
        </Button>
      </div>
    </CommandDialog>
  );
}
