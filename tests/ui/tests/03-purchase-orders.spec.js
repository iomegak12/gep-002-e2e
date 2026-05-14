const { test, expect } = require('@playwright/test');
const { login, logout } = require('../helpers/auth');
const { pause } = require('../helpers/wait');
const { readLines } = require('../helpers/data');

const poNumbers = readLines('pos.txt');

test.describe('purchase orders', () => {
  if (poNumbers.length === 0) {
    test('pos.txt is empty - skipping', async () => {
      test.skip(true, 'Add PO numbers to tests/ui/data/pos.txt to enable this suite');
    });
    return;
  }

  for (const poNumber of poNumbers) {
    test(`login -> view PO ${poNumber} -> logout`, async ({ page }) => {
      await login(page);

      await page.goto('/purchase-orders');
      await pause(page);
      await expect(page).toHaveURL(/\/purchase-orders/);

      const search = page.locator('input[placeholder="Search by PO number or supplier"]');
      await expect(search).toBeVisible();
      await search.fill(poNumber);
      await pause(page);

      const row = page.locator('tr', { hasText: poNumber }).first();
      await expect(row).toBeVisible({ timeout: 10_000 });
      await pause(page);
      await row.click();

      await page.waitForURL(/\/purchase-orders\/[^/]+$/, { timeout: 10_000 });
      await pause(page);

      await expect(page.locator('body')).toContainText(poNumber, { timeout: 10_000 });
      await pause(page);

      await logout(page);
    });
  }
});
