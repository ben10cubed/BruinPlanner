import { test, expect } from '@playwright/test';

test.describe('Subject + Class Search Flow', () => {

  test.beforeEach(async ({ page, request }) => {
    // Generate unique user to avoid duplicate username errors
    const username = `user_${Date.now()}`;
    const password = 'abc12345678';

    // Create user
    const reg = await request.post('/api/registration', {
      data: { username, password }
    });
    console.log("Registration:", reg.status());

    // Load login page
    await page.goto('/');

    // Login
    await page.fill('input[placeholder="Enter username"]', username);
    await page.fill('input[placeholder="Enter password"]', password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for MainPage to appear
    await expect(page.locator('.page-container')).toBeVisible({ timeout: 15000 });

    // Store username for later tests
    page.username = username;
  });

  test('search for subject FIAT LX then class 19A', async ({ page }) => {

    //
    // SUBJECT SEARCH
    //
    const subjectInput = page.locator('.top-row input').first();
    await subjectInput.fill('FIAT LX');

    // Wait for FIAT LX result
    const subjectMatch = page.getByText(/FIAT LX/i).first();
    await expect(subjectMatch).toBeVisible();
    await subjectMatch.click();

    //
    // CLASS SEARCH
    //
    const classInput = page.locator('.top-row input').nth(1);
    await classInput.fill('19A');

    const classMatch = page.getByText(/19A/i).first();
    await expect(classMatch).toBeVisible();
    await classMatch.click();

    //
    // SUCCESS CHECK
    //
    await expect(page.getByText(/19A/)).toBeVisible();
  });
});
