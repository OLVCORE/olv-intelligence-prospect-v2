# 📧 Configuração de Email - Recebimento Automático

## Visão Geral

O sistema está configurado para **enviar emails via SMTP** (porta 465) e **receber emails via webhook**. Isso garante funcionamento em qualquer ambiente, incluindo Edge Functions.

## ✅ O que já está funcionando

### Envio de Email (SMTP)
- ✅ Configurado via SMTP na porta 465 (TLS)
- ✅ Servidor: `mail.olvinternacional.com.br`
- ✅ Usuário: `marcos.oliveira@olvinternacional.com.br`
- ✅ Funcionando perfeitamente

### Recebimento de Email (Webhook)
- ✅ Edge Function criada: `email-inbound-webhook`
- ✅ URL pública sem autenticação JWT
- ✅ Aceita JSON e form-data
- ✅ Cria contatos e conversas automaticamente
- ✅ Vincula emails às empresas quando configurado

## 🔧 Configuração Necessária

Para receber emails automaticamente, você precisa configurar um **encaminhamento de email** do seu servidor para o webhook.

### URL do Webhook

```
https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook
```

## 📋 Opções de Configuração

### Opção 1: Configurar no cPanel (Recomendado)

Se seu servidor de email usa cPanel:

1. Acesse o **cPanel** do seu domínio `olvinternacional.com.br`
2. Vá em **Email** → **Forwarders** (Encaminhadores)
3. Clique em **Add Forwarder** (Adicionar Encaminhador)
4. Configure:
   - **Email Address**: `marcos.oliveira@olvinternacional.com.br`
   - **Forward to**: Escolha "Pipe to a Program" ou "Advanced"
   - Cole este script:

```bash
#!/bin/bash
curl -X POST https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook \
  -H "Content-Type: application/json" \
  -d @-
```

5. Salve a configuração

### Opção 2: Configurar Filtro de Email (Email Filter)

Se o cPanel permite filtros:

1. Vá em **Email Filters** no cPanel
2. Crie um novo filtro para `marcos.oliveira@olvinternacional.com.br`
3. Configure a regra:
   - **Condition**: "Any header" contains "@" (para capturar todos)
   - **Action**: "Pipe to a Program"
   - Programa: Use o script curl acima

### Opção 3: Usar Serviço de Email Inbound (Mais Profissional)

Recomendamos usar um serviço especializado que oferece webhook nativo:

#### A) Mailgun (Recomendado - Grátis até 5.000 emails/mês)

1. Crie uma conta em [mailgun.com](https://mailgun.com)
2. Adicione e verifique seu domínio `olvinternacional.com.br`
3. Configure os **DNS Records** que o Mailgun fornecer:
   ```
   Tipo   Nome                              Valor
   MX     @                                 mxa.mailgun.org (priority 10)
   MX     @                                 mxb.mailgun.org (priority 10)
   TXT    @                                 v=spf1 include:mailgun.org ~all
   ```
4. Em **Receiving** → **Routes**, crie uma rota:
   - **Expression**: `match_recipient("marcos.oliveira@olvinternacional.com.br")`
   - **Actions**: 
     - Forward: `https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook`
     - Store: Yes (opcional, para backup)

#### B) SendGrid Inbound Parse

1. Crie conta em [sendgrid.com](https://sendgrid.com)
2. Configure **Inbound Parse**
3. Aponte para: `https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook`

#### C) Postmark Inbound

1. Crie conta em [postmarkapp.com](https://postmarkapp.com)
2. Configure **Inbound Webhook**
3. URL: `https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook`

### Opção 4: Script Manual no Servidor

Se você tem acesso SSH ao servidor:

1. Crie o arquivo `/etc/postfix/forward_to_webhook.sh`:

```bash
#!/bin/bash
# Recebe email via stdin e envia para webhook

EMAIL_CONTENT=$(cat)

curl -X POST https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"marcos.oliveira@olvinternacional.com.br\",
    \"from\": \"$(echo "$EMAIL_CONTENT" | grep -i '^From:' | cut -d' ' -f2-)\",
    \"subject\": \"$(echo "$EMAIL_CONTENT" | grep -i '^Subject:' | cut -d' ' -f2-)\",
    \"text\": \"$(echo "$EMAIL_CONTENT" | sed -n '/^$/,/^--/p')\"
  }"

exit 0
```

2. Dê permissão de execução:
```bash
chmod +x /etc/postfix/forward_to_webhook.sh
```

3. Configure no Postfix em `/etc/aliases`:
```
marcos.oliveira: "|/etc/postfix/forward_to_webhook.sh"
```

4. Execute:
```bash
newaliases
postfix reload
```

## 🧪 Testar o Webhook

Você pode testar manualmente enviando uma requisição:

```bash
curl -X POST https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "to": "marcos.oliveira@olvinternacional.com.br",
    "from": "teste@example.com",
    "subject": "Email de Teste",
    "text": "Este é um email de teste para validar o webhook.",
    "html": "<p>Este é um email de teste para validar o webhook.</p>"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "conversationId": "uuid-da-conversa",
  "messageId": "uuid-da-mensagem"
}
```

## 🔍 Verificar Logs

Para ver se os emails estão chegando:

1. Abra o **Dev Console** do projeto Lovable
2. Vá em **Backend** → **Edge Functions** → **email-inbound-webhook**
3. Clique em **Logs**
4. Envie um email de teste
5. Verifique se aparece: `[Inbound Email] Stored message <uuid>`

## 📊 Formato de Dados Aceitos

O webhook aceita os seguintes formatos:

### JSON (Preferido)
```json
{
  "to": "marcos.oliveira@olvinternacional.com.br",
  "from": "sender@example.com",
  "subject": "Assunto do Email",
  "text": "Corpo em texto puro",
  "html": "<p>Corpo em HTML</p>",
  "messageId": "identificador-unico-opcional"
}
```

### Form Data (Mailgun, SendGrid)
```
to=marcos.oliveira@olvinternacional.com.br
from=sender@example.com
subject=Assunto do Email
text=Corpo em texto puro
html=<p>Corpo em HTML</p>
```

## ✨ Recursos Automáticos

Quando um email é recebido via webhook:

1. ✅ **Contato criado automaticamente** se não existir
2. ✅ **Conversa criada** ou atualizada se já existir uma aberta
3. ✅ **Mensagem armazenada** com todo o conteúdo
4. ✅ **HTML sanitizado** para segurança
5. ✅ **Atualização em tempo real** via WebSocket
6. ✅ **Notificação visual** na interface

## 🔐 Segurança

- O webhook é **público** (verify_jwt = false) por design
- Apenas emails para endereços configurados em `integration_configs` são aceitos
- Validação de endereços de remetente e destinatário
- HTML sanitizado antes de armazenar
- Logs completos de todas as requisições

## 🚀 Próximos Passos

1. ✅ Configure o encaminhamento usando uma das opções acima
2. ✅ Teste enviando um email real para `marcos.oliveira@olvinternacional.com.br`
3. ✅ Verifique se aparece na interface do Inbox
4. ✅ Configure alertas e notificações se desejar

## 💡 Dicas

- **Performance**: Mailgun/Postmark são mais rápidos que encaminhamento direto
- **Confiabilidade**: Serviços especializados têm melhor uptime
- **Análise**: Mailgun oferece estatísticas de entrega
- **Spam**: Serviços especializados filtram spam automaticamente

## ❓ Problemas Comuns

### Email não aparece na inbox
1. Verifique os logs do webhook
2. Confirme que o encaminhamento está ativo
3. Teste o webhook manualmente com curl
4. Verifique se há integração ativa em `integration_configs`

### Erro 403 "Recipient not configured"
- Adicione uma integração de email ativa para o usuário
- Verifique se o endereço em `integration_configs` corresponde ao destinatário

### HTML não renderiza
- O HTML é sanitizado por segurança
- Tags permitidas: p, br, strong, em, u, a, ul, ol, li, blockquote

## 📞 Suporte

Se precisar de ajuda, verifique:
- Logs do Edge Function
- Status da integração no banco de dados
- Testes manuais com curl
