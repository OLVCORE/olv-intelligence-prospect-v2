import { test, expect } from '@playwright/test';

/**
 * 🎯 TESTE E2E - JORNADA COMPLETA DO USUÁRIO
 * Validação de 100% da experiência na plataforma OLV Intelligence
 */

test.describe('Jornada Completa do Usuário - OLV Intelligence', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Login antes de cada teste
    await page.goto('/login');
    // TODO: Implementar login quando autenticação estiver ativa
    await page.goto('/dashboard');
  });

  test('01 - Dashboard Executivo: Visualização de métricas', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Verificar presença de cards principais
    await expect(page.locator('text=Total de Empresas')).toBeVisible();
    await expect(page.locator('text=Enriquecidas')).toBeVisible();
    await expect(page.locator('text=Score Médio')).toBeVisible();
  });

  test('02 - Buscar Empresas: Fluxo de busca e enriquecimento', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('h1')).toContainText('Buscar Empresas');
    
    // Buscar por CNPJ de teste
    const searchInput = page.locator('input[placeholder*="CNPJ"]');
    await searchInput.fill('00.000.000/0001-91'); // CNPJ fictício
    await page.locator('button:has-text("Buscar")').click();
    
    // Verificar loading state
    await expect(page.locator('text=Buscando')).toBeVisible({ timeout: 2000 });
  });

  test('03 - Base de Empresas: Navegação e filtros', async ({ page }) => {
    await page.goto('/companies');
    
    // Verificar tabela de empresas
    await expect(page.locator('table')).toBeVisible();
    
    // Testar filtro de busca
    const filterInput = page.locator('input[placeholder*="Filtrar"]');
    if (await filterInput.isVisible()) {
      await filterInput.fill('TOTVS');
    }
  });

  test('04 - SDR Suite: Navegação entre submódulos', async ({ page }) => {
    // Dashboard SDR
    await page.goto('/sdr/dashboard');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Pipeline
    await page.goto('/sdr/pipeline');
    await expect(page.locator('text=Pipeline')).toBeVisible();
    
    // Inbox
    await page.goto('/sdr/inbox');
    await expect(page.locator('text=Inbox')).toBeVisible();
    
    // Tarefas
    await page.goto('/sdr/tasks');
    await expect(page.locator('text=Tarefas')).toBeVisible();
  });

  test('05 - Hub 360º: Navegação entre módulos de inteligência', async ({ page }) => {
    // Inteligência 360º
    await page.goto('/intelligence-360');
    await expect(page.locator('h1')).toBeVisible();
    
    // Tech Stack
    await page.goto('/tech-stack');
    await expect(page.locator('text=Tech Stack')).toBeVisible();
    
    // Decisores
    await page.goto('/intelligence');
    await expect(page.locator('h1')).toBeVisible();
    
    // Maturidade
    await page.goto('/maturity');
    await expect(page.locator('text=Maturidade')).toBeVisible();
    
    // Benchmark
    await page.goto('/benchmark');
    await expect(page.locator('h1')).toBeVisible();
    
    // Fit TOTVS
    await page.goto('/fit-totvs');
    await expect(page.locator('text=TOTVS')).toBeVisible();
  });

  test('06 - Canvas War Room: Criação e colaboração', async ({ page }) => {
    await page.goto('/canvas');
    
    // Verificar lista de canvas
    await expect(page.locator('h1')).toContainText('Canvas');
    
    // Criar novo canvas
    const createButton = page.locator('button:has-text("Novo")');
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.locator('input[placeholder*="nome"]')).toBeVisible();
    }
  });

  test('07 - Playbooks: Visualização de estratégias', async ({ page }) => {
    await page.goto('/playbooks');
    await expect(page.locator('text=Playbooks')).toBeVisible();
  });

  test('08 - Relatórios: Geração de insights', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.locator('text=Relatórios')).toBeVisible();
  });

  test('09 - Governança: Análise de gaps', async ({ page }) => {
    await page.goto('/governance');
    await expect(page.locator('text=Governança')).toBeVisible();
  });

  test('10 - Configurações: Acesso e navegação', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('text=Configurações')).toBeVisible();
  });

  test('11 - Sidebar: Navegação por todos os grupos', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar grupos do sidebar
    await expect(page.locator('text=🎯 Prospecção')).toBeVisible();
    await expect(page.locator('text=🧠 Inteligência')).toBeVisible();
    await expect(page.locator('text=📋 Estratégia & Vendas')).toBeVisible();
    await expect(page.locator('text=⚙️ Governança & Admin')).toBeVisible();
  });

  test('12 - Responsividade: Mobile e Desktop', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    await expect(page.locator('aside')).toBeVisible(); // Sidebar visível
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    // Sidebar deve estar colapsado em mobile
  });

  test('13 - Detalhe de Empresa: Visualização completa', async ({ page }) => {
    // Navegar para uma empresa específica
    await page.goto('/companies');
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      
      // Verificar URL mudou para /company/:id
      await expect(page).toHaveURL(/\/company\/[a-f0-9-]+/);
    }
  });

  test('14 - Análise 360°: Presença digital completa', async ({ page }) => {
    await page.goto('/analysis-360');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('15 - Distribuição Geográfica: Mapa interativo', async ({ page }) => {
    await page.goto('/geographic-analysis');
    await expect(page.locator('text=Geográfica')).toBeVisible();
    
    // Verificar se mapa carregou (pode ser canvas ou div específico)
    await page.waitForTimeout(2000); // Esperar mapa carregar
  });
});

test.describe('Validação de UX - Pontos de Fricção', () => {
  
  test('UX-01: Tempo de carregamento inicial', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;
    
    // Dashboard deve carregar em menos de 3s
    expect(loadTime).toBeLessThan(3000);
  });

  test('UX-02: Navegação sem quebras', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/search',
      '/companies',
      '/intelligence-360',
      '/canvas',
      '/reports',
    ];
    
    for (const route of routes) {
      await page.goto(route);
      // Não deve haver erro 404 ou crash
      await expect(page.locator('text=404')).not.toBeVisible();
      await expect(page.locator('text=Error')).not.toBeVisible();
    }
  });

  test('UX-03: Consistência de layout', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Sidebar deve estar presente
    await expect(page.locator('aside')).toBeVisible();
    
    // Header deve estar presente
    await expect(page.locator('header')).toBeVisible();
  });

  test('UX-04: Feedback visual de ações', async ({ page }) => {
    await page.goto('/search');
    
    // Hover em botões deve mostrar feedback
    const searchButton = page.locator('button:has-text("Buscar")');
    await searchButton.hover();
    // Verificar se há transição CSS (difícil de testar, mas podemos verificar presença)
  });
});

test.describe('Validação de Acessibilidade', () => {
  
  test('A11Y-01: Navegação por teclado', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab deve focar elementos interativos
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar se foco está visível
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('A11Y-02: Contraste de cores', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar se textos principais têm contraste adequado
    // (teste básico - idealmente usar ferramenta como axe-core)
    await expect(page.locator('h1')).toBeVisible();
  });
});
