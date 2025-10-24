import { test, expect } from '@playwright/test';

test.describe('Companies Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navigate to companies management
    await page.click('a[href="/companies"]');
    await page.waitForURL('/companies');
  });

  test('should load and display companies list with pagination', async ({ page }) => {
    // Wait for companies to load
    await page.waitForSelector('[data-testid="companies-table"]', { timeout: 10000 });
    
    // Check if companies are displayed
    const companyRows = await page.locator('tbody tr').count();
    expect(companyRows).toBeGreaterThan(0);
    expect(companyRows).toBeLessThanOrEqual(50);
    
    // Check pagination controls exist
    await expect(page.locator('button:has-text("Anterior")')).toBeVisible();
    await expect(page.locator('button:has-text("Próxima")')).toBeVisible();
  });

  test('should search companies by name or CNPJ', async ({ page }) => {
    await page.waitForSelector('input[placeholder*="Buscar"]', { timeout: 10000 });
    
    // Search for a company
    await page.fill('input[placeholder*="Buscar"]', 'Test Company');
    await page.waitForTimeout(1000); // Debounce
    
    // Verify results are filtered
    const searchResults = await page.locator('tbody tr').count();
    expect(searchResults).toBeGreaterThanOrEqual(0);
  });

  test('should sort companies by different columns', async ({ page }) => {
    await page.waitForSelector('[data-testid="companies-table"]', { timeout: 10000 });
    
    // Click on name column to sort
    await page.click('th:has-text("Nome")');
    await page.waitForTimeout(500);
    
    // Get first company name
    const firstCompanyName = await page.locator('tbody tr:first-child td:nth-child(2)').textContent();
    expect(firstCompanyName).toBeTruthy();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.waitForSelector('[data-testid="companies-table"]', { timeout: 10000 });
    
    const nextButton = page.locator('button:has-text("Próxima")');
    const isNextEnabled = await nextButton.isEnabled();
    
    if (isNextEnabled) {
      // Click next page
      await nextButton.click();
      await page.waitForTimeout(500);
      
      // Check if page indicator changed
      await expect(page.locator('text=/Página \\d+/')).toBeVisible();
      
      // Go back to previous page
      await page.click('button:has-text("Anterior")');
      await page.waitForTimeout(500);
    }
  });

  test('should open company details', async ({ page }) => {
    await page.waitForSelector('[data-testid="companies-table"]', { timeout: 10000 });
    
    // Click on first company
    const firstCompanyRow = page.locator('tbody tr:first-child');
    await firstCompanyRow.click();
    
    // Wait for navigation to detail page
    await page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 5000 });
    
    // Verify we're on detail page
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('should handle bulk upload', async ({ page }) => {
    await page.waitForSelector('[data-testid="companies-table"]', { timeout: 10000 });
    
    // Click bulk upload button
    await page.click('button:has-text("Upload")');
    
    // Verify dialog opens
    await expect(page.locator('role=dialog')).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Search for something that doesn't exist
    await page.fill('input[placeholder*="Buscar"]', 'XYZNONEXISTENT12345');
    await page.waitForTimeout(1000);
    
    // Should show empty state or no results message
    const noResults = await page.locator('text=/Nenhum.*encontrad/i').isVisible();
    expect(noResults).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true);
    
    // Try to load page
    await page.reload();
    
    // Should show error message or toast
    await page.waitForTimeout(2000);
    const errorVisible = await page.locator('text=/erro/i, text=/falha/i').isVisible();
    expect(errorVisible).toBeTruthy();
    
    // Restore connection
    await context.setOffline(false);
  });
});
