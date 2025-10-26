import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDecisionMaker } from "@/hooks/useDecisionMakers";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

interface Props {
  companyId: string;
  onAdded?: () => void;
}

export default function DecisionMakerAddDialog({ companyId, onAdded, trigger }: Props & { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [seniority, setSeniority] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const queryClient = useQueryClient();
  const createDecisor = useCreateDecisionMaker();

  const reset = () => {
    setName("");
    setTitle("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setSeniority("");
    setLinkedinUrl("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createDecisor.mutateAsync({
      company_id: companyId,
      name: name.trim(),
      title: title.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      department: department.trim() || null,
      seniority: seniority.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      verified_email: false,
      source: "manual",
    } as any);

    // Refresh company detail and decision makers caches
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["company-detail", companyId] }),
      queryClient.invalidateQueries({ queryKey: ["decision_makers", companyId] }),
    ]);

    onAdded?.();
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)} role="button" aria-label="Abrir diálogo de adicionar decisor" className="inline-flex">
          {trigger}
        </div>
      ) : (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Decisor
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Decisor</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div>
            <Label htmlFor="title">Cargo</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Diretor de TI" />
          </div>
          <div>
            <Label htmlFor="department">Departamento</Label>
            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Ex.: Tecnologia" />
          </div>
          <div>
            <Label htmlFor="seniority">Senioridade</Label>
            <Input id="seniority" value={seniority} onChange={(e) => setSeniority(e.target.value)} placeholder="Ex.: Diretor / Head" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/in/usuario" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={createDecisor.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || createDecisor.isPending}>
            {createDecisor.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
