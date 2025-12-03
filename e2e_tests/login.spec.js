import { test, expect } from '@playwright/test';

test.describe('Authentication Flow (Login + Sign Up)', () => {

  //
  // Helper: Ensure a valid test user exists
  //
  test.beforeEach(async ({ request }) => {
    await request.post('/api/registration', {
      data: { username: 'testuser', password: 'password123' }
    });
  });

  test('loads Login form by default', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.locator('input[placeholder="Enter username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter password"]')).toBeVisible();
  });

  test('switch to Sign Up then back to Login', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();

    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('successful login shows MainPage', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="Enter username"]', 'ben10');
    await page.fill('input[placeholder="Enter password"]', 'bruhmoment');

    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('.page-container')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

  });

  test('invalid login shows error banner', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="Enter username"]', 'notrealuser');
    await page.fill('input[placeholder="Enter password"]', 'wrong');

    await page.getByRole('button', { name: 'Login' }).click();

    // Error banner appears
    const banner = page.locator('.status-banner-outside');
    await expect(banner).toHaveClass(/show/);
    await expect(banner).toContainText(/User does not exist|Incorrect Password/i);
  });

});
