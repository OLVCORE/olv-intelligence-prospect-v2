import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Globe, Linkedin, User, Mail } from "lucide-react";

interface ManualEnrichmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  initialData?: {
    website?: string;
    linkedin_url?: string;
    domain?: string;
  };
  onSaved?: () => void;
}

export function ManualEnrichmentDialog({ open, onOpenChange, companyId, initialData, onSaved }: ManualEnrichmentDialogProps) {
  const [website, setWebsite] = useState(initialData?.website || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedin_url || "");
  const [domain, setDomain] = useState(initialData?.domain || "");
  const [dmName, setDmName] = useState("");
  const [dmRole, setDmRole] = useState("");
  const [dmEmail, setDmEmail] = useState("");
  const [dmLinkedin, setDmLinkedin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setWebsite(initialData?.website || "");
      setLinkedinUrl(initialData?.linkedin_url || "");
      setDomain(initialData?.domain || "");
      setDmName("");
      setDmRole("");
      setDmEmail("");
      setDmLinkedin("");
    }
  }, [open, initialData]);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      // Atualiza dados básicos da empresa
      const updates: any = {};
      if (website) updates.website = website;
      if (linkedinUrl) updates.linkedin_url = linkedinUrl;
      if (domain) updates.domain = domain;

      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await supabase.from('companies').update(updates).eq('id', companyId);
        if (upErr) throw upErr;
      }

      // Insere 1 decisor opcional
      const hasDm = dmName || dmRole || dmEmail || dmLinkedin;
      if (hasDm) {
        const { error: dmErr } = await supabase.from('decision_makers').insert({
          company_id: companyId,
          name: dmName || null,
          role: dmRole || null,
          email: dmEmail || null,
          linkedin_url: dmLinkedin || null,
        });
        if (dmErr) throw dmErr;
      }

      toast.success('Informações complementares salvas!');
      onSaved?.();
    } catch (e) {
      console.error('Erro ao salvar informações:', e);
      toast.error('Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complementar Informações</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="digital" className="mt-2">
          <TabsList>
            <TabsTrigger value="digital">Presença Digital</TabsTrigger>
            <TabsTrigger value="dm">Decisor</TabsTrigger>
          </TabsList>

          <TabsContent value="digital" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Links e Domínio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website</Label>
                  <Input placeholder="https://empresa.com.br" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
                  <Input placeholder="https://linkedin.com/company/..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Domínio</Label>
                  <Input placeholder="empresa.com.br" value={domain} onChange={(e) => setDomain(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dm" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Adicionar Decisor</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Nome</Label>
                  <Input placeholder="Nome completo" value={dmName} onChange={(e) => setDmName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Cargo</Label>
                  <Input placeholder="Diretor de TI" value={dmRole} onChange={(e) => setDmRole(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</Label>
                  <Input type="email" placeholder="nome@empresa.com" value={dmEmail} onChange={(e) => setDmEmail(e.target.value)} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
                  <Input placeholder="https://linkedin.com/in/..." value={dmLinkedin} onChange={(e) => setDmLinkedin(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !companyId}>
            {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>) : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
