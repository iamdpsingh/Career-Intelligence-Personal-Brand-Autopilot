import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test('should load the dashboard and display the core navigation', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');

    // Check that the title is correct
    await expect(page).toHaveTitle(/Career Intelligence & Personal Brand Autopilot/i);

    // Verify that the queue page link exists
    const queueLink = page.getByRole('link', { name: /^Queue$/i });
    await expect(queueLink).toBeVisible();
  });
});
