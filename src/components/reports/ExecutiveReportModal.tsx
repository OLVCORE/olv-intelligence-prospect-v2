import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, ExternalLink } from 'lucide-react';
import { useCompanyReport } from '@/hooks/useCompanyReport';

interface ExecutiveReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function ExecutiveReportModal({ open, onOpenChange, companyId }: ExecutiveReportModalProps) {
  const { data: report, isLoading, isError } = useCompanyReport(companyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">Relatório Executivo</DialogTitle>
          <DialogDescription>Visão consolidada da empresa sem sair da página</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando relatório...
            </div>
          )}

          {isError && (
            <div className="text-destructive">Erro ao carregar o relatório.</div>
          )}

          {!isLoading && report && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold">Identificação</h3>
                  <div className="text-sm text-muted-foreground">{report.identificacao?.razao_social || report.identification?.name || '—'}</div>
                  <div className="text-sm text-muted-foreground">CNPJ: {report.identificacao?.cnpj || report.identification?.cnpj || '—'}</div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold">Presença Digital</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    Website:
                    {report.presenca_digital?.website || report.digital_presence?.website ? (
                      <a
                        className="text-primary hover:underline inline-flex items-center gap-1"
                        href={(report.presenca_digital?.website || report.digital_presence?.website)?.startsWith('http') ? (report.presenca_digital?.website || report.digital_presence?.website) : `https://${report.presenca_digital?.website || report.digital_presence?.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {report.presenca_digital?.website || report.digital_presence?.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </section>

                {report.contatos?.emails?.length ? (
                  <>
                    <Separator />
                    <section>
                      <h3 className="text-lg font-semibold">Contatos</h3>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        {report.contatos.emails.slice(0, 5).map((e: any, idx: number) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    </section>
                  </>
                ) : null}

                {report.analises?.icp?.score || report.analysis?.icp?.score ? (
                  <>
                    <Separator />
                    <section>
                      <h3 className="text-lg font-semibold">ICP</h3>
                      <div className="text-sm text-muted-foreground">
                        Score: {report.analises?.icp?.score || report.analysis?.icp?.score}
                      </div>
                    </section>
                  </>
                ) : null}
              </div>
            </ScrollArea>
          )}

          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
