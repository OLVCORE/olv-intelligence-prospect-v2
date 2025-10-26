import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MessageCircle, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichContactsCardProps {
  rawData: any;
}

export function RichContactsCard({ rawData }: RichContactsCardProps) {
  const ContactSection = ({ 
    title, 
    icon, 
    items 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    items: Array<{ label: string; value: string | null | undefined; isList?: boolean; highlight?: boolean }> 
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="grid gap-3">
        {items.map((item, idx) => {
          const hasValue = item.value && item.value !== 'N/A';
          
          if (!hasValue) return null;
          
          return (
            <div 
              key={idx} 
              className={`p-3 rounded-lg border ${item.highlight ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">{item.label}</p>
              {item.isList ? (
                <ScrollArea className="h-20">
                  <pre className="text-xs font-mono whitespace-pre-wrap">{item.value}</pre>
                </ScrollArea>
              ) : (
                <p className={`text-sm ${item.highlight ? 'font-bold text-primary' : 'font-medium'} font-mono`}>
                  {item.value}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Phone className="h-5 w-5 text-primary" />
            Contatos Completos
          </CardTitle>
          {rawData.assertividade && (
            <Badge variant="default" className="text-base px-4 py-1">
              Assertividade: {rawData.assertividade}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Telefones Prioritários */}
            <ContactSection
              title="📞 Telefones Prioritários"
              icon={<Phone className="h-4 w-4 text-green-600" />}
              items={[
                { label: "Melhor Telefone", value: rawData.melhor_telefone, highlight: true },
                { label: "Segundo Melhor Telefone", value: rawData.segundo_melhor_telefone, highlight: true },
                { label: "Melhor Celular", value: rawData.melhor_celular, highlight: true },
              ]}
            />

            <Separator />

            {/* Telefones por Assertividade */}
            <ContactSection
              title="🎯 Telefones por Assertividade"
              icon={<Phone className="h-4 w-4 text-blue-600" />}
              items={[
                { label: "Alta Assertividade ⭐⭐⭐", value: rawData.telefones_alta_assertividade, isList: true },
                { label: "Média Assertividade ⭐⭐", value: rawData.telefones_media_assertividade, isList: true },
                { label: "Baixa Assertividade ⭐", value: rawData.telefones_baixa_assertividade, isList: true },
              ]}
            />

            <Separator />

            {/* Telefones por Localização */}
            <ContactSection
              title="🏢 Telefones por Unidade"
              icon={<Building2 className="h-4 w-4 text-purple-600" />}
              items={[
                { label: "Telefones - Matriz", value: rawData.telefones_matriz, isList: true },
                { label: "Telefones - Filiais", value: rawData.telefones_filiais, isList: true },
              ]}
            />

            <Separator />

            {/* Outros Telefones */}
            <ContactSection
              title="📱 Outros Contatos"
              icon={<MessageCircle className="h-4 w-4 text-orange-600" />}
              items={[
                { label: "Celulares", value: rawData.celulares, isList: true },
                { label: "Fixos", value: rawData.fixos, isList: true },
                { label: "PAT - Telefone", value: rawData.pat_telefone },
                { label: "WhatsApp", value: rawData.whatsapp, highlight: true },
              ]}
            />

            <Separator />

            {/* E-mails */}
            <ContactSection
              title="✉️ E-mails"
              icon={<Mail className="h-4 w-4 text-red-600" />}
              items={[
                { label: "E-mails Departamentos", value: rawData.emails_validados_departamentos, isList: true, highlight: true },
                { label: "E-mails Sócios", value: rawData.emails_validados_socios, isList: true, highlight: true },
                { label: "E-mails Decisores", value: rawData.emails_validados_decisores, isList: true, highlight: true },
                { label: "E-mails Colaboradores", value: rawData.emails_validados_colaboradores, isList: true },
                { label: "Email PAT", value: rawData.email_pat },
                { label: "Email Receita Federal", value: rawData.email_receita_federal },
                { label: "Emails Públicos", value: rawData.emails_publicos, isList: true },
              ]}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
