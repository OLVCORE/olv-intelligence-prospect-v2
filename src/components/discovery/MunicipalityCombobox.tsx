import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Municipality {
  municipality_code: string;
  municipality_name: string;
}

interface MunicipalityComboboxProps {
  municipalities: Municipality[] | undefined;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MunicipalityCombobox({ 
  municipalities, 
  value, 
  onChange, 
  disabled 
}: MunicipalityComboboxProps) {
  const [open, setOpen] = useState(false);

  const displayValue = value === "all" 
    ? "Todos os municípios"
    : municipalities?.find((m) => m.municipality_name === value)?.municipality_name || "Selecione o município";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 popover-content-width" align="start">
        <Command>
          <CommandInput placeholder="Buscar município..." />
          <CommandList>
            <CommandEmpty>Nenhum município encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange("all");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                Todos os municípios
              </CommandItem>
              {municipalities?.map((municipality) => (
                <CommandItem
                  key={municipality.municipality_code}
                  value={municipality.municipality_name}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === municipality.municipality_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {municipality.municipality_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
