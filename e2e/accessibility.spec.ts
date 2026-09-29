import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility and E2E Checks', () => {
  test('should not have any automatically detectable accessibility issues on home page', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Check basic E2E elements
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // Run Axe-core for accessibility
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on queue page', async ({ page }) => {
    await page.goto('http://localhost:3000/queue');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
