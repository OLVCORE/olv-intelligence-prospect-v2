-- Enable required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Schedule IMAP polling every 5 minutes
select cron.schedule(
  'imap_poll_every_5min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-imap-poll',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);