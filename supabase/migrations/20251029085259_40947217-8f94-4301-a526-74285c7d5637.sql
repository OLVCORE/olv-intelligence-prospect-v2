-- ========================================
-- TABELA: Setores (12 setores principais)
-- ========================================
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT NOT NULL UNIQUE,
    sector_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sectors_read_all" ON public.sectors FOR SELECT TO authenticated USING (true);

-- Inserir setores
INSERT INTO public.sectors (sector_code, sector_name, description) VALUES
('agro', 'Agro', 'Agronegócio, pecuária, agroindústria'),
('construcao', 'Construção', 'Construção civil, infraestrutura, materiais'),
('distribuicao', 'Distribuição', 'Atacado, distribuição, logística comercial'),
('educacional', 'Educacional', 'Escolas, universidades, edtechs'),
('financial_services', 'Financial Services', 'Bancos, fintechs, seguradoras'),
('hotelaria', 'Hotelaria e Turismo', 'Hotéis, agências, turismo'),
('juridico', 'Jurídico', 'Escritórios, legaltechs, compliance'),
('logistica', 'Logística', 'Transporte, armazenagem, 3PL'),
('manufatura', 'Manufatura', 'Indústria de transformação'),
('servicos', 'Prestadores de Serviços', 'Consultorias, TI, facilities'),
('saude', 'Saúde', 'Hospitais, clínicas, healthtechs'),
('varejo', 'Varejo', 'Comércio varejista, e-commerce')
ON CONFLICT (sector_code) DO NOTHING;

-- ========================================
-- RECRIAR TABELA: Nichos (70+ nichos detalhados)
-- ========================================
DROP TABLE IF EXISTS public.niches CASCADE;

CREATE TABLE public.niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT NOT NULL REFERENCES public.sectors(sector_code),
    niche_code TEXT NOT NULL UNIQUE,
    niche_name TEXT NOT NULL,
    description TEXT,
    cnaes TEXT[],
    ncms TEXT[],
    keywords TEXT[] NOT NULL,
    totvs_products TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_niches_code ON public.niches(niche_code);
CREATE INDEX idx_niches_sector ON public.niches(sector_code);

-- Habilitar RLS
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "niches_read_all" ON public.niches FOR SELECT TO authenticated USING (true);

-- ========================================
-- INSERIR NICHOS (70+ nichos)
-- ========================================

-- AGRO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('agro', 'agro_cooperativas', 'Cooperativas Agrícolas', 'Cooperativas de produtores rurais', ARRAY['0161-0/01', '0161-0/02'], ARRAY[]::TEXT[], ARRAY['cooperativa agrícola', 'cooperativa rural', 'produtores associados'], ARRAY['Protheus', 'RM TOTVS']),
('agro', 'agro_agroindustrias', 'Agroindústrias', 'Processamento de produtos agrícolas', ARRAY['1031-7/00', '1033-3/01'], ARRAY[]::TEXT[], ARRAY['agroindústria', 'processamento agrícola', 'beneficiamento'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_fazendas', 'Produtores Rurais e Fazendas', 'Cultivo de grãos, frutas, hortaliças', ARRAY['0111-3/01', '0111-3/02'], ARRAY[]::TEXT[], ARRAY['fazenda', 'produtor rural', 'cultivo', 'plantio'], ARRAY['Protheus Agro']),
('agro', 'agro_trading', 'Trading de Grãos', 'Comercialização de commodities agrícolas', ARRAY['4623-1/01'], ARRAY['1001', '1005', '1201'], ARRAY['trading agrícola', 'commodities', 'exportação grãos'], ARRAY['Protheus', 'TOTVS Gestão']),
('agro', 'agro_usinas', 'Usinas de Açúcar e Etanol', 'Produção de açúcar, etanol, bioenergia', ARRAY['1071-6/00', '1931-4/00'], ARRAY[]::TEXT[], ARRAY['usina', 'açúcar', 'etanol', 'bioenergia'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_fertilizantes', 'Indústrias de Fertilizantes', 'Fabricação de adubos e fertilizantes', ARRAY['2013-4/00'], ARRAY[]::TEXT[], ARRAY['fertilizante', 'adubo', 'NPK', 'insumo agrícola'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_maquinario', 'Fabricantes de Maquinário Agrícola', 'Tratores, colheitadeiras, implementos', ARRAY['2831-9/00', '2833-5/00'], ARRAY[]::TEXT[], ARRAY['trator', 'colheitadeira', 'maquinário agrícola', 'implemento'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_distribuidores_insumos', 'Distribuidores de Insumos', 'Distribuição de sementes, defensivos, adubos', ARRAY['4683-4/00'], ARRAY[]::TEXT[], ARRAY['distribuidor insumos', 'sementes', 'defensivos', 'agrotóxico'], ARRAY['Protheus', 'TOTVS Gestão']),
('agro', 'agro_agritechs', 'Agritechs', 'Startups de agricultura digital', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['agritech', 'agricultura digital', 'agricultura de precisão'], ARRAY['Fluig', 'TOTVS Gestão']),
('agro', 'agro_pecuaria', 'Pecuária de Corte e Leite', 'Criação de gado, suínos, aves', ARRAY['0151-2/01', '0155-5/01'], ARRAY[]::TEXT[], ARRAY['pecuária', 'gado', 'bovino', 'suíno', 'avicultura'], ARRAY['Protheus Agro']);

-- CONSTRUÇÃO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('construcao', 'construcao_construtoras', 'Construtoras e Incorporadoras', 'Construção de edifícios, obras civis', ARRAY['4120-4/00', '4110-7/00'], ARRAY[]::TEXT[], ARRAY['construtora', 'incorporadora', 'construção civil'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_loteadoras', 'Loteadoras e Urbanizadoras', 'Loteamento, urbanização, infraestrutura', ARRAY['4211-1/01'], ARRAY[]::TEXT[], ARRAY['loteadora', 'urbanização', 'loteamento'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_infraestrutura', 'Obras de Infraestrutura', 'Rodovias, pontes, saneamento', ARRAY['4211-1/02', '4222-7/01'], ARRAY[]::TEXT[], ARRAY['infraestrutura', 'rodovia', 'ponte', 'saneamento'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_engenharia', 'Engenharia Civil e Consultiva', 'Projetos, consultoria, fiscalização', ARRAY['7112-0/00'], ARRAY[]::TEXT[], ARRAY['engenharia civil', 'projeto estrutural', 'consultoria obras'], ARRAY['Fluig', 'TOTVS Gestão']),
('construcao', 'construcao_materiais', 'Indústria de Materiais de Construção', 'Cimento, cerâmica, argamassa', ARRAY['2330-3/01', '2349-4/01'], ARRAY[]::TEXT[], ARRAY['materiais construção', 'cimento', 'cerâmica', 'argamassa'], ARRAY['Protheus', 'TOTVS Manufatura']),
('construcao', 'construcao_serralheria', 'Serralherias e Marcenarias Industriais', 'Esquadrias, móveis planejados', ARRAY['2512-8/00', '3101-2/00'], ARRAY[]::TEXT[], ARRAY['serralheria', 'marcenaria', 'esquadrias', 'móveis planejados'], ARRAY['Protheus', 'TOTVS Manufatura']),
('construcao', 'construcao_manutencao', 'Empresas de Manutenção Predial', 'Manutenção, conservação, facilities', ARRAY['8121-4/00'], ARRAY[]::TEXT[], ARRAY['manutenção predial', 'conservação', 'facilities'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_premoldados', 'Fabricantes de Pré-Moldados', 'Estruturas pré-fabricadas, concreto', ARRAY['2330-3/05'], ARRAY[]::TEXT[], ARRAY['pré-moldado', 'pré-fabricado', 'concreto'], ARRAY['Protheus', 'TOTVS Manufatura']),
('construcao', 'construcao_arquitetura', 'Arquitetura e Design de Interiores', 'Projetos arquitetônicos, design', ARRAY['7111-1/00'], ARRAY[]::TEXT[], ARRAY['arquitetura', 'design interiores', 'projeto arquitetônico'], ARRAY['Fluig', 'TOTVS Gestão']),
('construcao', 'construcao_obras_publicas', 'Obras Públicas e Licitações', 'Construção para governo, licitações', ARRAY['4120-4/00'], ARRAY[]::TEXT[], ARRAY['obras públicas', 'licitação', 'governo'], ARRAY['Protheus', 'TOTVS Gestão']);

-- DISTRIBUIÇÃO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('distribuicao', 'dist_alimentos', 'Distribuidores de Alimentos e Bebidas', 'Atacado de alimentos, bebidas', ARRAY['4631-1/00', '4632-0/01'], ARRAY[]::TEXT[], ARRAY['distribuidor alimentos', 'atacado bebidas', 'food service'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_farmaceuticos', 'Distribuidores Farmacêuticos', 'Atacado de medicamentos', ARRAY['4644-3/01'], ARRAY[]::TEXT[], ARRAY['distribuidor farmacêutico', 'atacado medicamentos', 'pharma'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_autopecas', 'Distribuidores de Autopeças', 'Atacado de peças automotivas', ARRAY['4530-7/01'], ARRAY[]::TEXT[], ARRAY['distribuidor autopeças', 'atacado automotivo', 'peças veículos'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_eletricos', 'Atacadistas de Materiais Elétricos', 'Distribuição de materiais elétricos', ARRAY['4661-3/00'], ARRAY[]::TEXT[], ARRAY['atacado elétrico', 'materiais elétricos', 'distribuidor elétrica'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_cosmeticos', 'Distribuidores de Cosméticos', 'Atacado de cosméticos, perfumaria', ARRAY['4645-1/01'], ARRAY[]::TEXT[], ARRAY['distribuidor cosméticos', 'atacado perfumaria', 'beauty'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_hospitalares', 'Equipamentos Hospitalares', 'Distribuição de equipamentos médicos', ARRAY['4664-8/00'], ARRAY[]::TEXT[], ARRAY['equipamento hospitalar', 'distribuidor médico', 'material cirúrgico'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_tecnologia', 'Distribuição de Tecnologia e TI', 'Atacado de hardware, software', ARRAY['4651-6/01'], ARRAY[]::TEXT[], ARRAY['distribuidor TI', 'atacado tecnologia', 'hardware'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_eletrodomesticos', 'Eletrodomésticos e Utilidades', 'Atacado de eletrodomésticos', ARRAY['4649-4/01'], ARRAY[]::TEXT[], ARRAY['atacado eletrodomésticos', 'linha branca', 'utilidades domésticas'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_epis', 'Distribuidores de EPIs e Segurança', 'Equipamentos de proteção individual', ARRAY['4649-4/99'], ARRAY[]::TEXT[], ARRAY['distribuidor EPI', 'equipamento segurança', 'proteção individual'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_logistica', 'Logística e Cross Docking', 'Centros de distribuição, cross docking', ARRAY['5250-8/05'], ARRAY[]::TEXT[], ARRAY['cross docking', 'centro distribuição', 'CD'], ARRAY['Protheus', 'TOTVS Gestão']);

-- EDUCACIONAL (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('educacional', 'edu_escolas', 'Escolas Particulares e Redes de Ensino', 'Ensino fundamental, médio', ARRAY['8513-9/00'], ARRAY[]::TEXT[], ARRAY['escola particular', 'rede ensino', 'colégio'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_faculdades', 'Faculdades e Universidades', 'Ensino superior', ARRAY['8532-5/00'], ARRAY[]::TEXT[], ARRAY['faculdade', 'universidade', 'ensino superior'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_tecnicas', 'Escolas Técnicas e Profissionalizantes', 'Cursos técnicos, profissionalizantes', ARRAY['8541-4/00'], ARRAY[]::TEXT[], ARRAY['escola técnica', 'profissionalizante', 'SENAI', 'SENAC'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_edtechs', 'Edtechs', 'Startups de educação digital', ARRAY['8599-6/04'], ARRAY[]::TEXT[], ARRAY['edtech', 'educação digital', 'plataforma ensino'], ARRAY['Fluig', 'TOTVS Gestão']),
('educacional', 'edu_idiomas', 'Escolas de Idiomas', 'Cursos de inglês, espanhol, etc.', ARRAY['8593-7/00'], ARRAY[]::TEXT[], ARRAY['escola idiomas', 'curso inglês', 'language school'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_corporativo', 'Instituições de Ensino Corporativo', 'Treinamento empresarial', ARRAY['8599-6/03'], ARRAY[]::TEXT[], ARRAY['ensino corporativo', 'treinamento empresarial', 'universidade corporativa'], ARRAY['RM TOTVS', 'Fluig']),
('educacional', 'edu_ead', 'Plataformas EAD', 'Ensino a distância', ARRAY['8599-6/04'], ARRAY[]::TEXT[], ARRAY['EAD', 'ensino distância', 'plataforma online'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_treinamento', 'Centros de Treinamento Profissional', 'Capacitação técnica', ARRAY['8599-6/03'], ARRAY[]::TEXT[], ARRAY['centro treinamento', 'capacitação profissional'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_mba', 'Cursos de Especialização e MBA', 'Pós-graduação, MBA', ARRAY['8542-2/00'], ARRAY[]::TEXT[], ARRAY['MBA', 'pós-graduação', 'especialização'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_gestoras', 'Gestoras de Ensino Público e ONGs', 'Gestão educacional, ONGs', ARRAY['8412-4/00'], ARRAY[]::TEXT[], ARRAY['gestão educacional', 'ONG educação'], ARRAY['RM TOTVS', 'TOTVS Educacional']);

-- FINANCIAL SERVICES (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('financial_services', 'fin_bancos_digitais', 'Bancos Digitais', 'Bancos 100% digitais', ARRAY['6422-1/00'], ARRAY[]::TEXT[], ARRAY['banco digital', 'neobank', 'fintech bancária'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_cooperativas', 'Cooperativas de Crédito', 'Cooperativas financeiras', ARRAY['6421-2/00'], ARRAY[]::TEXT[], ARRAY['cooperativa crédito', 'Sicoob', 'Sicredi'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_fintechs', 'Fintechs', 'Startups de serviços financeiros', ARRAY['6499-9/99'], ARRAY[]::TEXT[], ARRAY['fintech', 'pagamento digital', 'crédito digital'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_seguradoras', 'Seguradoras', 'Seguros gerais, vida, saúde', ARRAY['6512-0/00'], ARRAY[]::TEXT[], ARRAY['seguradora', 'seguro', 'corretora seguros'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_corretoras', 'Corretoras de Investimentos', 'Corretoras de valores', ARRAY['6612-6/02'], ARRAY[]::TEXT[], ARRAY['corretora investimentos', 'corretora valores', 'XP', 'BTG'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_consultorias', 'Consultorias Financeiras', 'Consultoria de investimentos', ARRAY['6619-3/04'], ARRAY[]::TEXT[], ARRAY['consultoria financeira', 'planejamento financeiro'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_pagamentos', 'Meios de Pagamento / Gateways', 'Processamento de pagamentos', ARRAY['6619-3/02'], ARRAY[]::TEXT[], ARRAY['gateway pagamento', 'adquirente', 'processadora'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_factoring', 'Factoring / FIDC', 'Fomento mercantil, fundos', ARRAY['6499-9/01'], ARRAY[]::TEXT[], ARRAY['factoring', 'FIDC', 'fomento mercantil'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_credito_pme', 'Plataformas de Crédito PME', 'Crédito para pequenas empresas', ARRAY['6499-9/99'], ARRAY[]::TEXT[], ARRAY['crédito PME', 'empréstimo empresarial'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_bureaus', 'Bureaus de Crédito e Cobrança', 'Análise de crédito, cobrança', ARRAY['8291-1/00'], ARRAY[]::TEXT[], ARRAY['bureau crédito', 'cobrança', 'score crédito'], ARRAY['Protheus', 'TOTVS Gestão']);

-- HOTELARIA E TURISMO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('hotelaria', 'hotel_hoteis', 'Hotéis e Pousadas', 'Hospedagem', ARRAY['5510-8/01'], ARRAY[]::TEXT[], ARRAY['hotel', 'pousada', 'hospedagem'], ARRAY['Protheus', 'TOTVS Hotelaria']),
('hotelaria', 'hotel_resorts', 'Resorts e Spas', 'Resorts, spas, lazer', ARRAY['5510-8/02'], ARRAY[]::TEXT[], ARRAY['resort', 'spa', 'hotel fazenda'], ARRAY['Protheus', 'TOTVS Hotelaria']),
('hotelaria', 'hotel_agencias', 'Agências de Viagens', 'Agências de turismo', ARRAY['7911-2/00'], ARRAY[]::TEXT[], ARRAY['agência viagens', 'turismo', 'operadora'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_operadoras', 'Operadoras de Turismo', 'Operadoras turísticas', ARRAY['7912-1/00'], ARRAY[]::TEXT[], ARRAY['operadora turismo', 'pacotes viagem'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_eventos', 'Eventos e Feiras Corporativas', 'Organização de eventos', ARRAY['8230-0/01'], ARRAY[]::TEXT[], ARRAY['eventos corporativos', 'feira', 'congresso'], ARRAY['Fluig', 'TOTVS Gestão']),
('hotelaria', 'hotel_parques', 'Parques Temáticos', 'Parques de diversão', ARRAY['9321-2/00'], ARRAY[]::TEXT[], ARRAY['parque temático', 'parque diversão'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_locadoras', 'Locadoras de Veículos', 'Aluguel de carros', ARRAY['7711-0/00'], ARRAY[]::TEXT[], ARRAY['locadora veículos', 'aluguel carros', 'rent a car'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_ota', 'Plataformas OTA (Online Travel Agency)', 'Plataformas de reserva online', ARRAY['7990-2/00'], ARRAY[]::TEXT[], ARRAY['OTA', 'booking', 'reserva online'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_franquias', 'Franquias de Hospedagem', 'Redes de hotéis franqueados', ARRAY['5510-8/01'], ARRAY[]::TEXT[], ARRAY['franquia hotel', 'rede hoteleira'], ARRAY['Protheus', 'TOTVS Hotelaria']),
('hotelaria', 'hotel_condominios', 'Condomínios e Multipropriedades', 'Timeshare, condomínios turísticos', ARRAY['6810-2/02'], ARRAY[]::TEXT[], ARRAY['multipropriedade', 'timeshare', 'condomínio turístico'], ARRAY['Protheus', 'TOTVS Gestão']);

-- JURÍDICO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('juridico', 'jur_escritorios', 'Escritórios de Advocacia', 'Advocacia geral', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['escritório advocacia', 'advogado', 'jurídico'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_corporativo', 'Departamentos Jurídicos Corporativos', 'Jurídico interno de empresas', ARRAY['6911-7/02'], ARRAY[]::TEXT[], ARRAY['jurídico corporativo', 'departamento legal'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_legaltechs', 'Legaltechs', 'Startups de tecnologia jurídica', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['legaltech', 'tecnologia jurídica', 'automação jurídica'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_cartorios', 'Tabelionatos e Cartórios', 'Serviços notariais', ARRAY['6911-7/03'], ARRAY[]::TEXT[], ARRAY['cartório', 'tabelionato', 'notário'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_compliance', 'Consultorias de Compliance', 'Compliance, governança', ARRAY['7020-4/00'], ARRAY[]::TEXT[], ARRAY['compliance', 'governança corporativa', 'LGPD'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_cobranca', 'Empresas de Cobrança Jurídica', 'Cobrança judicial', ARRAY['8291-1/00'], ARRAY[]::TEXT[], ARRAY['cobrança jurídica', 'recuperação crédito'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_arbitragem', 'Arbitragem e Mediação', 'Resolução de conflitos', ARRAY['6911-7/04'], ARRAY[]::TEXT[], ARRAY['arbitragem', 'mediação', 'conciliação'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_patentes', 'Escritórios de Patentes e Marcas', 'Propriedade intelectual', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['patente', 'marca', 'propriedade intelectual'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_processos', 'Gestão de Processos e Contratos', 'Gestão documental jurídica', ARRAY['8219-9/01'], ARRAY[]::TEXT[], ARRAY['gestão processos', 'contratos', 'documental'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_due_diligence', 'Serviços de Due Diligence', 'Auditoria jurídica', ARRAY['6920-6/01'], ARRAY[]::TEXT[], ARRAY['due diligence', 'auditoria jurídica'], ARRAY['Fluig', 'TOTVS Gestão']);

-- LOGÍSTICA (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('logistica', 'log_transportadoras', 'Transportadoras', 'Transporte rodoviário de cargas', ARRAY['4930-2/01'], ARRAY[]::TEXT[], ARRAY['transportadora', 'transporte carga', 'frete'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_3pl', 'Operadores Logísticos (3PL / 4PL)', 'Operadores logísticos', ARRAY['5250-8/05'], ARRAY[]::TEXT[], ARRAY['3PL', '4PL', 'operador logístico'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_armazens', 'Armazéns e Centros de Distribuição', 'Armazenagem', ARRAY['5211-7/01'], ARRAY[]::TEXT[], ARRAY['armazém', 'CD', 'centro distribuição'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_courier', 'Courier e Entregas Rápidas', 'Entregas expressas', ARRAY['5320-2/02'], ARRAY[]::TEXT[], ARRAY['courier', 'entrega rápida', 'motoboy'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_logtechs', 'Logtechs', 'Startups de logística digital', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['logtech', 'logística digital', 'TMS'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_multimodal', 'Transporte Rodoviário, Aéreo, Marítimo', 'Transporte multimodal', ARRAY['4930-2/02', '5111-1/00', '5091-2/01'], ARRAY[]::TEXT[], ARRAY['transporte aéreo', 'transporte marítimo', 'multimodal'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_rastreamento', 'Empresas de Rastreamento e Telemetria', 'Rastreamento de frotas', ARRAY['8020-0/00'], ARRAY[]::TEXT[], ARRAY['rastreamento', 'telemetria', 'monitoramento frota'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_frota', 'Gestão de Frota e Manutenção', 'Gestão de frotas', ARRAY['4520-0/01'], ARRAY[]::TEXT[], ARRAY['gestão frota', 'manutenção veículos'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_despachantes', 'Despachantes Aduaneiros', 'Despacho aduaneiro', ARRAY['5229-0/02'], ARRAY[]::TEXT[], ARRAY['despachante aduaneiro', 'desembaraço', 'importação'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_comex', 'Comércio Exterior e Freight Forwarding', 'Agentes de carga', ARRAY['5229-0/01'], ARRAY[]::TEXT[], ARRAY['freight forwarder', 'comércio exterior', 'agente carga'], ARRAY['Protheus', 'TOTVS Gestão']);

-- MANUFATURA (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('manufatura', 'man_metalurgica', 'Indústria Metalúrgica', 'Siderurgia, metalurgia', ARRAY['2441-5/01', '2451-2/00'], ARRAY[]::TEXT[], ARRAY['metalúrgica', 'siderurgia', 'fundição'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_plastica', 'Indústria Plástica', 'Transformação de plásticos', ARRAY['2221-8/00', '2229-3/01'], ARRAY[]::TEXT[], ARRAY['indústria plástica', 'transformação plástico', 'injeção plástico'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_textil', 'Indústria Têxtil e Confecção', 'Têxtil, vestuário', ARRAY['1311-1/00', '1412-6/01'], ARRAY[]::TEXT[], ARRAY['indústria têxtil', 'confecção', 'vestuário'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_quimica', 'Indústria Química', 'Química, petroquímica', ARRAY['2011-8/00', '2013-4/00'], ARRAY[]::TEXT[], ARRAY['indústria química', 'petroquímica', 'resina'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_automotiva', 'Indústria Automotiva', 'Montadoras, autopeças', ARRAY['2910-7/01', '2945-0/00'], ARRAY[]::TEXT[], ARRAY['indústria automotiva', 'montadora', 'autopeças'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_eletroeletronicos', 'Eletroeletrônicos', 'Eletrônicos, eletrodomésticos', ARRAY['2610-8/00', '2751-8/00'], ARRAY[]::TEXT[], ARRAY['indústria eletrônica', 'eletrodomésticos', 'linha branca'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_moveis', 'Móveis e Decoração', 'Indústria moveleira', ARRAY['3101-2/00'], ARRAY[]::TEXT[], ARRAY['indústria móveis', 'moveleira', 'marcenaria'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_alimenticia', 'Indústria Alimentícia', 'Alimentos, bebidas', ARRAY['1011-2/01', '1121-6/00'], ARRAY[]::TEXT[], ARRAY['indústria alimentícia', 'alimentos', 'bebidas'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_papel', 'Papel e Celulose', 'Indústria de papel', ARRAY['1710-9/00'], ARRAY[]::TEXT[], ARRAY['papel celulose', 'indústria papel'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_farmaceutica', 'Indústria Farmacêutica e Cosmética', 'Medicamentos, cosméticos', ARRAY['2121-1/01', '2063-1/00'], ARRAY[]::TEXT[], ARRAY['indústria farmacêutica', 'cosméticos', 'medicamentos'], ARRAY['Protheus', 'TOTVS Manufatura']);

-- PRESTADORES DE SERVIÇOS (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('servicos', 'serv_contabilidade', 'Contabilidade e Auditoria', 'Escritórios contábeis', ARRAY['6920-6/01'], ARRAY[]::TEXT[], ARRAY['contabilidade', 'auditoria', 'contador'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_marketing', 'Marketing e Publicidade', 'Agências de marketing', ARRAY['7311-4/00'], ARRAY[]::TEXT[], ARRAY['agência marketing', 'publicidade', 'propaganda'], ARRAY['Fluig', 'TOTVS Gestão']),
('servicos', 'serv_ti', 'TI e Desenvolvimento de Software', 'Desenvolvimento, TI', ARRAY['6201-5/00', '6202-3/00'], ARRAY[]::TEXT[], ARRAY['desenvolvimento software', 'TI', 'programação'], ARRAY['Fluig', 'TOTVS Gestão']),
('servicos', 'serv_facilities', 'Facilities e Limpeza Corporativa', 'Limpeza, conservação', ARRAY['8121-4/00'], ARRAY[]::TEXT[], ARRAY['facilities', 'limpeza corporativa', 'conservação'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_seguranca', 'Segurança Patrimonial', 'Vigilância, segurança', ARRAY['8011-1/01'], ARRAY[]::TEXT[], ARRAY['segurança patrimonial', 'vigilância', 'portaria'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_consultorias', 'Consultorias Empresariais', 'Consultoria de gestão', ARRAY['7020-4/00'], ARRAY[]::TEXT[], ARRAY['consultoria empresarial', 'gestão', 'estratégia'], ARRAY['Fluig', 'TOTVS Gestão']),
('servicos', 'serv_rh', 'Recursos Humanos e Recrutamento', 'RH, recrutamento', ARRAY['7810-8/00'], ARRAY[]::TEXT[], ARRAY['recursos humanos', 'recrutamento', 'headhunter'], ARRAY['RM TOTVS', 'TOTVS Gestão']),
('servicos', 'serv_manutencao', 'Manutenção e Serviços Técnicos', 'Manutenção técnica', ARRAY['3314-7/01'], ARRAY[]::TEXT[], ARRAY['manutenção técnica', 'assistência técnica'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_veterinarias', 'Clínicas Veterinárias', 'Veterinária, petshops', ARRAY['7500-1/00'], ARRAY[]::TEXT[], ARRAY['clínica veterinária', 'veterinário', 'pet'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_coworkings', 'Coworkings e Hubs de Inovação', 'Espaços compartilhados', ARRAY['6810-2/01'], ARRAY[]::TEXT[], ARRAY['coworking', 'hub inovação', 'espaço compartilhado'], ARRAY['Fluig', 'TOTVS Gestão']);

-- SAÚDE (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('saude', 'saude_hospitais', 'Hospitais e Clínicas', 'Hospitais, clínicas médicas', ARRAY['8610-1/01', '8630-5/01'], ARRAY[]::TEXT[], ARRAY['hospital', 'clínica médica', 'pronto socorro'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_laboratorios', 'Laboratórios de Análises', 'Laboratórios clínicos', ARRAY['8640-2/01'], ARRAY[]::TEXT[], ARRAY['laboratório análises', 'exames', 'diagnóstico'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_homecare', 'Home Care', 'Atendimento domiciliar', ARRAY['8690-9/01'], ARRAY[]::TEXT[], ARRAY['home care', 'atendimento domiciliar'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_farmacias', 'Farmácias e Drogarias', 'Varejo farmacêutico', ARRAY['4771-7/01'], ARRAY[]::TEXT[], ARRAY['farmácia', 'drogaria', 'varejo farmacêutico'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_planos', 'Planos de Saúde e Operadoras', 'Operadoras de saúde', ARRAY['6550-2/00'], ARRAY[]::TEXT[], ARRAY['plano saúde', 'operadora saúde', 'convênio'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_odontologicas', 'Clínicas Odontológicas', 'Odontologia', ARRAY['8630-5/02'], ARRAY[]::TEXT[], ARRAY['clínica odontológica', 'dentista', 'ortodontia'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_estetica', 'Clínicas de Estética e Dermatologia', 'Estética, dermatologia', ARRAY['8630-5/03'], ARRAY[]::TEXT[], ARRAY['clínica estética', 'dermatologia', 'estética'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_distribuidores', 'Distribuidores de Produtos Médicos', 'Distribuição médica', ARRAY['4664-8/00'], ARRAY[]::TEXT[], ARRAY['distribuidor médico', 'produtos médicos'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_healthtechs', 'Healthtechs', 'Startups de saúde digital', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['healthtech', 'saúde digital', 'telemedicina'], ARRAY['Fluig', 'TOTVS Gestão']),
('saude', 'saude_diagnostico', 'Centros de Diagnóstico por Imagem', 'Radiologia, tomografia', ARRAY['8640-2/02'], ARRAY[]::TEXT[], ARRAY['diagnóstico imagem', 'radiologia', 'tomografia'], ARRAY['Protheus', 'TOTVS Gestão']);

-- VAREJO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('varejo', 'varejo_supermercados', 'Supermercados e Minimercados', 'Varejo alimentar', ARRAY['4711-3/01', '4712-1/00'], ARRAY[]::TEXT[], ARRAY['supermercado', 'minimercado', 'varejo alimentar'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_departamento', 'Lojas de Departamento', 'Varejo multimarcas', ARRAY['4713-0/01'], ARRAY[]::TEXT[], ARRAY['loja departamento', 'magazine'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_moda', 'Moda e Vestuário', 'Varejo de roupas', ARRAY['4781-4/00'], ARRAY[]::TEXT[], ARRAY['loja roupas', 'moda', 'vestuário'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_farmacias_varejo', 'Farmácias e Perfumarias', 'Varejo farmacêutico', ARRAY['4771-7/01'], ARRAY[]::TEXT[], ARRAY['farmácia', 'perfumaria', 'drogaria'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_ecommerce', 'E-commerce e Marketplaces', 'Comércio eletrônico', ARRAY['4789-0/05'], ARRAY[]::TEXT[], ARRAY['e-commerce', 'marketplace', 'loja virtual'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_moveis_varejo', 'Lojas de Móveis e Eletros', 'Varejo de móveis', ARRAY['4754-7/01'], ARRAY[]::TEXT[], ARRAY['loja móveis', 'eletrodomésticos'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_tecnologia_varejo', 'Varejo de Tecnologia', 'Lojas de eletrônicos', ARRAY['4751-2/01'], ARRAY[]::TEXT[], ARRAY['loja tecnologia', 'eletrônicos', 'informática'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_alimentacao', 'Alimentação Fora do Lar (Bares e Restaurantes)', 'Food service', ARRAY['5611-2/01', '5620-1/01'], ARRAY[]::TEXT[], ARRAY['restaurante', 'bar', 'food service'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_franquias', 'Franquias e Redes de Lojas', 'Redes franqueadas', ARRAY['4789-0/99'], ARRAY[]::TEXT[], ARRAY['franquia', 'rede lojas'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_petshops', 'Petshops e Acessórios', 'Varejo pet', ARRAY['4789-0/08'], ARRAY[]::TEXT[], ARRAY['petshop', 'pet', 'animais'], ARRAY['Protheus', 'TOTVS Gestão']);

-- ========================================
-- TABELA: Auditoria ICP
-- ========================================
CREATE TABLE IF NOT EXISTS public.icp_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_company_id UUID,
    action TEXT NOT NULL,
    reason TEXT,
    evidence_url TEXT,
    evidence_snippet TEXT,
    validation_rules_applied JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_batch_company ON public.icp_audit_log(batch_company_id, created_at DESC);

ALTER TABLE public.icp_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_read_all" ON public.icp_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_can_insert_audit_log" ON public.icp_audit_log FOR INSERT WITH CHECK (true);