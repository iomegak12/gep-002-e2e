const { test, expect } = require('@playwright/test');
const { login, logout } = require('../helpers/auth');
const { pause } = require('../helpers/wait');

test.describe('auth', () => {
  test('login then logout', async ({ page }) => {
    await login(page);

    // We should be on an authenticated page (not /login) and the logout
    // control should be visible.
    expect(page.url()).not.toMatch(/\/login$/);
    await expect(page.locator('button[aria-label="Sign out"]')).toBeVisible();
    await pause(page);

    await logout(page);
    expect(page.url()).toMatch(/\/login/);
  });
});
