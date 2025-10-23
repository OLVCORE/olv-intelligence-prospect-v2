/**
 * Email Forwarder to Webhook (Lovable Cloud)
 * 
 * Como usar:
 * 1) Em https://script.google.com crie um projeto e faça Upload deste arquivo (.gs)
 * 2) Execute a função testWebhook uma vez (Run) e autorize o acesso
 * 3) Em Triggers (⏰) crie um gatilho: encaminharParaWebhook → Time-driven → Every minute
 * 4) Garanta que o seu cPanel esteja encaminhando para o Gmail que está rodando este script
 */

function testWebhook() {
  const webhook = "https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook";
  const res = UrlFetchApp.fetch(webhook, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      from: 'teste@olvinternacional.com.br',
      to: 'consultores@olvinternacional.com.br',
      subject: 'Ping de teste',
      html: '<b>Teste</b>',
      text: 'Teste'
    })
  });
  Logger.log(res.getResponseCode());
  Logger.log(res.getContentText());
}

function encaminharParaWebhook() {
  const webhook = "https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook";

  // Busca emails não lidos dos últimos 7 dias (ajuste conforme necessário)
  const threads = GmailApp.search('in:inbox is:unread newer_than:7d');

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      if (!message.isUnread()) continue;

      const payload = {
        from: message.getFrom(),
        to: message.getTo(),
        subject: message.getSubject(),
        html: message.getBody(),
        text: message.getPlainBody()
      };

      UrlFetchApp.fetch(webhook, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload)
      });

      // Evita reprocessar
      message.markRead();
    }
  }
}
