-- Inserir templates de exemplo (versão corrigida)
DO $$
BEGIN
  -- Template 1: Cold Outreach Email
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Cold Outreach - Email') THEN
    INSERT INTO public.message_templates (name, category, channel, subject, body, variables, created_by)
    VALUES (
      'Cold Outreach - Email',
      'cold_outreach',
      'email',
      'Oportunidade de otimização para {{company_name}}',
      'Olá {{contact_name}},

Vi que a {{company_name}} atua no segmento de {{segment}} e identifiquei uma oportunidade interessante de otimização.

Empresas similares à {{company_name}} conseguiram reduzir custos em até 30% com nossa solução.

Que tal agendar 15 minutos esta semana para explorar como podemos ajudar?

Atenciosamente,
{{sender_name}}',
      '["company_name", "contact_name", "segment", "sender_name"]'::jsonb,
      (SELECT id FROM auth.users LIMIT 1)
    );
  END IF;

  -- Template 2: Follow-up Email
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Follow-up após reunião') THEN
    INSERT INTO public.message_templates (name, category, channel, subject, body, variables, created_by)
    VALUES (
      'Follow-up após reunião',
      'follow_up',
      'email',
      'Próximos passos - {{company_name}}',
      'Olá {{contact_name}},

Foi ótimo conversar com você hoje sobre as necessidades da {{company_name}}.

Conforme combinado, seguem os próximos passos:
{{next_steps}}

Fico à disposição para qualquer dúvida.

Atenciosamente,
{{sender_name}}',
      '["company_name", "contact_name", "next_steps", "sender_name"]'::jsonb,
      (SELECT id FROM auth.users LIMIT 1)
    );
  END IF;

  -- Template 3: WhatsApp
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'WhatsApp - Proposta Enviada') THEN
    INSERT INTO public.message_templates (name, category, channel, subject, body, variables, created_by)
    VALUES (
      'WhatsApp - Proposta Enviada',
      'follow_up',
      'whatsapp',
      NULL,
      'Oi {{contact_name}}! 👋

Acabei de enviar a proposta para {{company_name}} por email.

Quando puder dar uma olhada, me avisa! Qualquer dúvida, estou aqui. 📊',
      '["company_name", "contact_name"]'::jsonb,
      (SELECT id FROM auth.users LIMIT 1)
    );
  END IF;

  -- Template 4: Negociação Email
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Negociação - Proposta Customizada') THEN
    INSERT INTO public.message_templates (name, category, channel, subject, body, variables, created_by)
    VALUES (
      'Negociação - Proposta Customizada',
      'negotiation',
      'email',
      'Proposta Especial para {{company_name}}',
      'Olá {{contact_name}},

Após nossa conversa, preparei uma proposta especial considerando as necessidades específicas da {{company_name}}.

Principais benefícios:
{{key_benefits}}

Investimento: {{investment_value}}
Condições: {{payment_terms}}

Essa proposta é válida até {{validity_date}}.

Quando podemos agendar para revisar juntos?

Atenciosamente,
{{sender_name}}',
      '["company_name", "contact_name", "key_benefits", "investment_value", "payment_terms", "validity_date", "sender_name"]'::jsonb,
      (SELECT id FROM auth.users LIMIT 1)
    );
  END IF;
END $$;