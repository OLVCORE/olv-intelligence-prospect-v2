import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2, XCircle, Loader2, Copy, ExternalLink, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function EmailSettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Resend State
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendDomain, setResendDomain] = useState("");
  const [resendEmails, setResendEmails] = useState("");

  // IMAP State
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [imapUser, setImapUser] = useState("");
  const [imapPassword, setImapPassword] = useState("");
  const [imapSecure, setImapSecure] = useState(true);
  
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(true);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-inbound-webhook`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "URL copiada para área de transferência" });
  };

  const saveResendConfig = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const emails = resendEmails.split(',').map(e => e.trim()).filter(Boolean);

      const { error } = await supabase.from('integration_configs').insert({
        user_id: user.id,
        channel: 'email',
        provider: 'resend',
        status: 'active',
        credentials: {
          api_key: resendApiKey,
          domain: resendDomain,
          'resend.address': emails[0] || `noreply@${resendDomain}`
        },
        settings: {
          addresses: emails,
          webhook_url: webhookUrl
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Resend configurado!",
        description: "Agora configure o webhook no Resend"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveImapConfig = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from('integration_configs').insert({
        user_id: user.id,
        channel: 'email',
        provider: 'imap_smtp',
        status: 'active',
        credentials: {
          'imap.host': imapHost,
          'imap.port': parseInt(imapPort),
          'imap.user': imapUser,
          'imap.password': imapPassword,
          'imap.secure': imapSecure,
          'smtp.host': smtpHost,
          'smtp.port': parseInt(smtpPort),
          'smtp.user': smtpUser,
          'smtp.password': smtpPassword,
          'smtp.secure': smtpSecure,
        }
      });

      if (error) throw error;

      toast({
        title: "✅ IMAP/SMTP configurado!",
        description: "Sua conta de email está pronta"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('integration-health-check');
      
      if (error) throw error;
      
      setTestResult({
        success: data?.healthy || false,
        message: data?.healthy ? "Conexão funcionando!" : "Falha na conexão"
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuração de Email</h1>
          <p className="text-muted-foreground">
            Configure seu email em 3 passos simples. Escolha entre Resend (recomendado) ou IMAP/SMTP.
          </p>
        </div>

        <Tabs defaultValue="resend" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resend">
              <Mail className="w-4 h-4 mr-2" />
              Resend (Recomendado)
            </TabsTrigger>
            <TabsTrigger value="imap">
              <Mail className="w-4 h-4 mr-2" />
              IMAP/SMTP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Passo 1: Criar conta no Resend</CardTitle>
                <CardDescription>
                  Resend permite enviar e receber emails profissionalmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Como funciona?
                  </h4>
                  <ul className="text-sm space-y-1 ml-6 list-disc">
                    <li><strong>1 domínio</strong> = <strong>1 API key</strong> = <strong>∞ emails</strong></li>
                    <li>Você pode usar: vendas@seudominio.com, suporte@seudominio.com, etc</li>
                    <li>Grátis até 3.000 emails/mês</li>
                  </ul>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('https://resend.com/signup', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Criar conta no Resend (grátis)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Passo 2: Adicionar e validar seu domínio</CardTitle>
                <CardDescription>
                  Configure os registros DNS para validar seu domínio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>No Resend Dashboard:</strong>
                    <ol className="mt-2 space-y-1 ml-4 list-decimal text-sm">
                      <li>Vá em <strong>Domains</strong> → <strong>Add Domain</strong></li>
                      <li>Digite seu domínio (ex: seudominio.com.br)</li>
                      <li>Copie os registros DNS (MX, TXT, CNAME)</li>
                      <li>Adicione no painel do seu provedor de domínio</li>
                      <li>Aguarde validação (pode levar até 48h)</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('https://resend.com/domains', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ir para Resend Domains
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Passo 3: Configurar API Key e Webhook</CardTitle>
                <CardDescription>
                  Conecte o Resend ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key do Resend</Label>
                  <Input
                    type="password"
                    placeholder="re_..."
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pegue em: <a href="https://resend.com/api-keys" target="_blank" className="underline">resend.com/api-keys</a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Seu Domínio</Label>
                  <Input
                    placeholder="seudominio.com.br"
                    value={resendDomain}
                    onChange={(e) => setResendDomain(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Emails que vão receber (separados por vírgula)</Label>
                  <Input
                    placeholder="vendas@seudominio.com, suporte@seudominio.com"
                    value={resendEmails}
                    onChange={(e) => setResendEmails(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Webhook URL (copie e cole no Resend)</Label>
                  <div className="flex gap-2">
                    <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(webhookUrl)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>No Resend:</strong> Vá em <strong>Webhooks</strong> → <strong>Add Webhook</strong> → Cole a URL acima → Selecione evento <strong>"email.received"</strong>
                    </AlertDescription>
                  </Alert>
                </div>

                <Button
                  onClick={saveResendConfig}
                  disabled={!resendApiKey || !resendDomain || loading}
                  className="w-full"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Salvar Configuração</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="imap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração IMAP/SMTP</CardTitle>
                <CardDescription>
                  Use Gmail, Outlook ou qualquer provedor de email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Gmail:</strong> Use "Senha de app" (não sua senha normal).<br />
                    Ative em: Conta Google → Segurança → Verificação em duas etapas → Senhas de app
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h4 className="font-semibold">Configurações IMAP (Receber)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Servidor IMAP</Label>
                      <Input
                        placeholder="imap.gmail.com"
                        value={imapHost}
                        onChange={(e) => setImapHost(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Porta</Label>
                      <Input
                        placeholder="993"
                        value={imapPort}
                        onChange={(e) => setImapPort(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 flex items-end">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={imapSecure}
                          onCheckedChange={setImapSecure}
                        />
                        <Label>SSL/TLS</Label>
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={imapUser}
                        onChange={(e) => setImapUser(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Senha / Senha de App</Label>
                      <Input
                        type="password"
                        value={imapPassword}
                        onChange={(e) => setImapPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Configurações SMTP (Enviar)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Servidor SMTP</Label>
                      <Input
                        placeholder="smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Porta</Label>
                      <Input
                        placeholder="465"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 flex items-end">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={smtpSecure}
                          onCheckedChange={setSmtpSecure}
                        />
                        <Label>SSL/TLS</Label>
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Senha / Senha de App</Label>
                      <Input
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Alert className="bg-muted">
                  <AlertDescription className="text-xs">
                    <strong>Configurações comuns:</strong><br />
                    <strong>Gmail:</strong> IMAP: imap.gmail.com:993 | SMTP: smtp.gmail.com:465<br />
                    <strong>Outlook:</strong> IMAP: outlook.office365.com:993 | SMTP: smtp.office365.com:587
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={saveImapConfig}
                  disabled={!imapHost || !imapUser || !smtpHost || loading}
                  className="w-full"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Salvar Configuração</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Testar Conexão</CardTitle>
            <CardDescription>
              Verifique se tudo está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testConnection}
              disabled={testing}
              variant="outline"
              className="w-full"
            >
              {testing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testando...</>
              ) : (
                <>Testar Agora</>
              )}
            </Button>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
