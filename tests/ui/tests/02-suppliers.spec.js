const { test, expect } = require('@playwright/test');
const { login, logout } = require('../helpers/auth');
const { pause } = require('../helpers/wait');
const { readLines } = require('../helpers/data');

const supplierCodes = readLines('suppliers.txt');

test.describe('suppliers', () => {
  if (supplierCodes.length === 0) {
    test('suppliers.txt is empty - skipping', async () => {
      test.skip(true, 'Add supplier codes to tests/ui/data/suppliers.txt to enable this suite');
    });
    return;
  }

  for (const code of supplierCodes) {
    test(`login -> view supplier ${code} -> logout`, async ({ page }) => {
      await login(page);

      // Navigate to the suppliers list
      await page.goto('/suppliers');
      await pause(page);
      await expect(page).toHaveURL(/\/suppliers/);

      // Search by code
      const search = page.locator('input[placeholder="Search by name, code or category"]');
      await expect(search).toBeVisible();
      await search.fill(code);
      await pause(page);

      // Wait for the row that contains the code to appear, then click it.
      // The list page shows the supplier_code as text in the row.
      const row = page.locator('tr', { hasText: code }).first();
      await expect(row).toBeVisible({ timeout: 10_000 });
      await pause(page);
      await row.click();

      // We should be on /suppliers/<id>
      await page.waitForURL(/\/suppliers\/[^/]+$/, { timeout: 10_000 });
      await pause(page);

      // Detail page should reference the supplier code somewhere on the page
      await expect(page.locator('body')).toContainText(code, { timeout: 10_000 });
      await pause(page);

      await logout(page);
    });
  }
});
