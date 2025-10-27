import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import apolloLogo from "@/assets/logos/apollo.ico";

interface ApolloOrgIdDialogProps {
  onEnrich: (apolloOrgId: string) => Promise<void>;
  disabled?: boolean;
}

export function ApolloOrgIdDialog({ onEnrich, disabled }: ApolloOrgIdDialogProps) {
  const [open, setOpen] = useState(false);
  const [apolloOrgId, setApolloOrgId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEnrich = async () => {
    if (!apolloOrgId.trim()) return;
    
    setIsLoading(true);
    try {
      await onEnrich(apolloOrgId.trim());
      setOpen(false);
      setApolloOrgId("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <img src={apolloLogo} alt="Apollo" className="h-4 w-4" />
          Apollo ID Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={apolloLogo} alt="Apollo" className="h-5 w-5" />
            Buscar por Apollo Organization ID
          </DialogTitle>
          <DialogDescription>
            Cole o Organization ID do Apollo.io para buscar os contatos diretamente. 
            Você encontra o ID na URL da página da empresa no Apollo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apollo-org-id">Apollo Organization ID</Label>
            <Input
              id="apollo-org-id"
              placeholder="Ex: 5a9d68c2a6da98d9466cf9bc"
              value={apolloOrgId}
              onChange={(e) => setApolloOrgId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Exemplo de URL: https://app.apollo.io/#/organizations/<strong>5a9d68c2a6da98d9466cf9bc</strong>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleEnrich} 
            disabled={!apolloOrgId.trim() || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Buscar Contatos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
