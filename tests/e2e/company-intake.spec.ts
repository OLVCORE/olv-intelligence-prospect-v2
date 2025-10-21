// ✅ Teste End-to-End - Fluxo completo de ingestão de empresa
import { test, expect } from '@playwright/test';

test.describe('Company Intake Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de busca
    await page.goto('/dashboard/search');
  });

  test('should search company by CNPJ and display results', async ({ page }) => {
    // Preencher campo de busca com CNPJ
    const searchInput = page.locator('input[name="cnpj"]');
    await searchInput.fill('53.113.791/0001-22');

    // Clicar no botão de busca
    const searchButton = page.locator('button:has-text("Buscar")');
    await searchButton.click();

    // Aguardar resultado da busca
    await page.waitForSelector('[data-testid="company-result"]', { timeout: 15000 });

    // Verificar se os dados da empresa aparecem
    const companyName = page.locator('[data-testid="company-name"]');
    await expect(companyName).toBeVisible();
    await expect(companyName).toContainText(/TOTVS|SA/i);

    // Verificar se decisores aparecem
    const decisorsSection = page.locator('[data-testid="decisors-section"]');
    await expect(decisorsSection).toBeVisible();

    // Verificar se maturidade digital aparece
    const maturityScore = page.locator('[data-testid="maturity-score"]');
    await expect(maturityScore).toBeVisible();
  });

  test('should navigate to company detail page', async ({ page }) => {
    // Buscar empresa
    await page.fill('input[name="query"]', 'TOTVS');
    await page.click('button:has-text("Buscar")');

    // Aguardar resultado
    await page.waitForSelector('[data-testid="company-result"]');

    // Clicar no card da empresa
    await page.click('[data-testid="company-card"]');

    // Verificar navegação para página de detalhes
    await expect(page).toHaveURL(/\/dashboard\/companies\/[a-f0-9-]+/);

    // Verificar tabs de conteúdo
    await expect(page.locator('text=Visão Geral')).toBeVisible();
    await expect(page.locator('text=Decisores')).toBeVisible();
    await expect(page.locator('text=Sinais de Compra')).toBeVisible();
    await expect(page.locator('text=TOTVS Fit')).toBeVisible();
  });

  test('should generate TOTVS Fit analysis', async ({ page }) => {
    // Navegar para página de detalhes de uma empresa
    await page.goto('/dashboard/companies/test-company-id');

    // Clicar na tab TOTVS Fit
    await page.click('text=TOTVS Fit');

    // Clicar no botão gerar análise
    const generateButton = page.locator('button:has-text("Gerar Análise")');
    await generateButton.click();

    // Aguardar loading
    await expect(page.locator('text=Analisando')).toBeVisible();

    // Aguardar resultado (timeout maior para IA)
    await page.waitForSelector('[data-testid="fit-score"]', { timeout: 30000 });

    // Verificar se score aparece
    const fitScore = page.locator('[data-testid="fit-score"]');
    await expect(fitScore).toBeVisible();
    await expect(fitScore).toContainText(/\d+/); // Deve conter um número
  });

  test('should open canvas and add entry', async ({ page }) => {
    // Navegar para página de canvas
    await page.goto('/dashboard/canvas');

    // Criar novo canvas
    await page.click('button:has-text("Novo Canvas")');
    
    // Preencher título
    await page.fill('input[placeholder*="título"]', 'Teste Canvas E2E');
    await page.click('button:has-text("Criar")');

    // Aguardar abertura do canvas
    await page.waitForURL(/\/dashboard\/canvas\/[a-f0-9-]+/);

    // Adicionar entrada
    const commandInput = page.locator('textarea[placeholder*="comando"]');
    await commandInput.fill('Resumir estratégia de vendas para TOTVS');
    
    await page.keyboard.press('Enter');

    // Aguardar resposta da IA
    await page.waitForSelector('[data-testid="canvas-entry"]', { timeout: 20000 });

    // Verificar se entrada aparece
    const entry = page.locator('[data-testid="canvas-entry"]').first();
    await expect(entry).toBeVisible();
  });

  test('should display error for invalid CNPJ', async ({ page }) => {
    // Preencher CNPJ inválido
    await page.fill('input[name="cnpj"]', '00.000.000/0000-00');
    await page.click('button:has-text("Buscar")');

    // Verificar mensagem de erro
    await expect(page.locator('text=/CNPJ inválido|Empresa não encontrada/i')).toBeVisible();
  });
});
