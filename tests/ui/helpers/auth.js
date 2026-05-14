const { env } = require('./env');
const { pause } = require('./wait');

async function login(page, email = env.userEmail, password = env.userPassword) {
  await page.goto('/login');
  await pause(page);

  await page.locator('input[type="email"]').fill(email);
  await pause(page);

  await page.locator('input[type="password"]').fill(password);
  await pause(page);

  await page.getByRole('button', { name: /sign in/i }).click();

  // After successful login the app navigates away from /login
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15_000 });
  await pause(page);
}

async function logout(page) {
  await page.locator('button[aria-label="Sign out"]').click();
  await page.waitForURL(/\/login/, { timeout: 10_000 });
  await pause(page);
}

module.exports = { login, logout };
