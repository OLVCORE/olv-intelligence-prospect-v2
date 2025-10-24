# Sincronização Automática Google Sheets

Este documento explica como configurar a sincronização automática de leads do Google Sheets para o sistema.

## Como Funciona

O sistema permite que você configure uma planilha do Google Sheets para ser sincronizada automaticamente em intervalos regulares. Sempre que novos dados forem adicionados à planilha, eles serão importados automaticamente no próximo ciclo de sincronização.

## Configuração

### 1. Preparar a Planilha Google Sheets

1. Abra sua planilha no Google Sheets
2. Clique em **"Compartilhar"** no canto superior direito
3. Selecione **"Qualquer pessoa com o link"**
4. Certifique-se de que a permissão está em **"Visualizador"**
5. Copie o link da planilha

### 2. Configurar no Sistema

1. Acesse **Gerenciar Empresas** no menu lateral
2. Na seção **"Sincronização Automática Google Sheets"**, cole o link copiado
3. Escolha a frequência de sincronização:
   - A cada 15 minutos (recomendado para alta frequência)
   - A cada 30 minutos
   - A cada 1 hora
   - A cada 2 horas
   - A cada 4 horas
   - A cada 8 horas
   - A cada 12 horas
   - Uma vez por dia

4. Ative o switch **"Sincronização Ativa"**
5. Clique em **"Salvar Configuração"**

### 3. Configurar Cron Job no Supabase (Admin)

⚠️ **Esta etapa requer acesso de administrador ao Supabase**

Para ativar a sincronização automática, você precisa configurar um cron job no Supabase:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o seguinte comando SQL:

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para sincronização a cada 15 minutos
SELECT cron.schedule(
  'google-sheets-auto-sync',
  '*/15 * * * *', -- A cada 15 minutos
  $$
  SELECT
    net.http_post(
        url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/google-sheets-auto-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

#### Ajustar Frequência do Cron

Para ajustar a frequência do cron job, modifique o padrão cron (`*/15 * * * *`):

- **A cada 15 minutos**: `*/15 * * * *`
- **A cada 30 minutos**: `*/30 * * * *`
- **A cada hora**: `0 * * * *`
- **A cada 2 horas**: `0 */2 * * *`
- **A cada 4 horas**: `0 */4 * * *`
- **A cada 8 horas**: `0 */8 * * *`
- **A cada 12 horas**: `0 */12 * * *`
- **Uma vez por dia** (00:00): `0 0 * * *`

#### Verificar Cron Jobs Ativos

```sql
SELECT * FROM cron.job;
```

#### Remover Cron Job

```sql
SELECT cron.unschedule('google-sheets-auto-sync');
```

## Formato da Planilha

A planilha deve ter as seguintes colunas (na primeira linha):

| Coluna | Obrigatório | Descrição |
|--------|-------------|-----------|
| CNPJ | Não* | CNPJ da empresa |
| Nome da Empresa | Não* | Razão social ou nome fantasia |
| Website | Não | URL do site |
| Instagram | Não | Perfil do Instagram |
| LinkedIn | Não | Perfil do LinkedIn |
| Produto/Categoria | Não | Tipo de produto ou categoria |
| Marca | Não | Nome da marca |
| Link Produto/Marketplace | Não | URL do produto |
| CEP | Não | CEP |
| Estado | Não | UF (ex: SP, RJ) |
| Pais | Não | País (ex: Brasil) |
| Municipio | Não | Cidade |
| Bairro | Não | Bairro |
| Logradouro | Não | Endereço |
| Numero | Não | Número |

\* Pelo menos **CNPJ**, **Nome da Empresa**, **Website**, **Instagram** ou **LinkedIn** deve estar preenchido.

### Valores Vazios Aceitos

O sistema reconhece automaticamente os seguintes valores como "vazio" e os ignora:
- `não encontrado`
- `nao encontrado`
- `---`
- `###`
- `N/A`
- `na`
- Células vazias

## Testando a Sincronização

Após configurar, você pode testar manualmente:

1. Clique no botão **"Testar Agora"** na seção de configuração
2. O sistema fará uma sincronização imediata
3. Você verá uma notificação com o resultado

## Monitoramento

### Ver Última Sincronização

A data e hora da última sincronização bem-sucedida são exibidas na seção de configuração.

### Logs

Os logs de sincronização podem ser visualizados no Supabase Dashboard:
1. Acesse **Edge Functions** → **google-sheets-auto-sync**
2. Clique em **Logs**

## Perguntas Frequentes

### A planilha precisa estar pública?

Sim, a planilha precisa ser acessível com "Qualquer pessoa com o link" como Visualizador.

### Posso ter múltiplas planilhas?

Atualmente, cada usuário pode configurar apenas uma planilha por vez. Se você precisar importar de múltiplas fontes, considere consolidá-las em uma única planilha.

### O que acontece com empresas duplicadas?

O sistema detecta duplicatas por CNPJ. Se uma empresa já existir, ela não será reimportada.

### Quanto tempo leva para sincronizar?

Depende do número de empresas na planilha:
- Até 100 empresas: ~10 segundos
- Até 500 empresas: ~30 segundos
- Até 1000 empresas: ~1 minuto

### Há limite de empresas?

Sim, o limite é de 1000 empresas por sincronização.

## Solução de Problemas

### Erro: "Não foi possível acessar a planilha"

- Verifique se a planilha está compartilhada como "Qualquer pessoa com o link"
- Confirme que a URL está correta
- Tente abrir a URL em uma aba anônima do navegador

### Sincronização não está executando automaticamente

- Verifique se o cron job foi configurado corretamente no Supabase
- Confirme se a sincronização está **ativa** nas configurações
- Verifique os logs do Edge Function no Supabase

### Algumas linhas não são importadas

- Verifique se pelo menos um identificador (CNPJ, Nome, Website, etc.) está preenchido
- Confirme se os valores não estão com "não encontrado" ou símbolos inválidos
- Veja os erros detalhados na resposta da sincronização

## Segurança

- A URL do Google Sheets é armazenada de forma segura no banco de dados
- Apenas o usuário que configurou tem acesso à configuração
- O sistema usa Row Level Security (RLS) para proteger os dados
- Não armazenamos credenciais do Google - apenas URLs públicas

## Suporte

Se você encontrar problemas ou tiver dúvidas, entre em contato com o suporte técnico.
