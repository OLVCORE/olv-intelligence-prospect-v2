import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExplainabilityCard } from "./ExplainabilityCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataSource {
  name: string;
  description: string;
}

interface Criterion {
  name: string;
  weight?: string;
  description: string;
}

interface ExplainabilityButtonProps {
  title: string;
  description: string;
  analysisType: string;
  dataSources: DataSource[];
  criteria: Criterion[];
  methodology?: string;
  interpretation?: string;
  buttonText?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExplainabilityButton({
  title,
  description,
  analysisType,
  dataSources,
  criteria,
  methodology,
  interpretation,
  buttonText = "Entender os Critérios de Análise",
  variant = "outline",
  size = "sm",
}: ExplainabilityButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={() => setOpen(true)}
              className="gap-2"
            >
              <Info className="h-4 w-4" />
              {buttonText}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clique para ver a metodologia e critérios de análise</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <ExplainabilityCard
              title={title}
              description={description}
              analysisType={analysisType}
              dataSources={dataSources}
              criteria={criteria}
              methodology={methodology}
              interpretation={interpretation}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
