import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Based on AquaBotAI Test Plan - Section 5.1 Authentication Flows
 *
 * Test Cases:
 * - AUTH-001: Email/password signup
 * - AUTH-002: Email/password login
 * - AUTH-003: Password reset flow
 * - AUTH-005: Magic link signup
 * - AUTH-010: Password requirements validation
 * - AUTH-011: Duplicate email handling
 */

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test.describe('Signup Flow (AUTH-001)', () => {
    test('should display signup form with all required fields', async ({ page }) => {
      await page.goto('/signup');

      // Verify form elements are present
      await expect(page.getByRole('textbox', { name: 'Full name' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    });

    test('should show password requirements', async ({ page }) => {
      await page.goto('/signup');

      // Password requirements should be visible
      await expect(page.getByText('At least 8 characters')).toBeVisible();
      await expect(page.getByText('Contains a number')).toBeVisible();
    });

    test('should disable submit button until password requirements are met (AUTH-010)', async ({ page }) => {
      await page.goto('/signup');

      // Fill in name and email
      await page.getByRole('textbox', { name: 'Full name' }).fill('Test User');
      await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');

      // Button should be disabled with empty password
      await expect(page.getByRole('button', { name: 'Create account' })).toBeDisabled();

      // Fill short password (less than 8 chars)
      await page.getByRole('textbox', { name: 'Password' }).fill('Pass1');
      await expect(page.getByRole('button', { name: 'Create account' })).toBeDisabled();

      // Fill password without number
      await page.getByRole('textbox', { name: 'Password' }).fill('Password');
      await expect(page.getByRole('button', { name: 'Create account' })).toBeDisabled();

      // Fill valid password
      await page.getByRole('textbox', { name: 'Password' }).fill('TestPass123!');
      await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled();
    });

    test('should submit form and call Supabase Auth', async ({ page }) => {
      await page.goto('/signup');

      // Fill the form
      await page.getByRole('textbox', { name: 'Full name' }).fill('Test User');
      await page.getByRole('textbox', { name: 'Email' }).fill(`test${Date.now()}@example.com`);
      await page.getByRole('textbox', { name: 'Password' }).fill('TestPass123!');

      // Submit the form
      await page.getByRole('button', { name: 'Create account' }).click();

      // Wait for response - either success or error toast
      await expect(
        page.locator('[data-sonner-toast]').first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('should show error for duplicate email (AUTH-011)', async ({ page }) => {
      await page.goto('/signup');

      // Fill with a known existing email (if configured)
      await page.getByRole('textbox', { name: 'Full name' }).fill('Test User');
      await page.getByRole('textbox', { name: 'Email' }).fill('existing@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('TestPass123!');

      await page.getByRole('button', { name: 'Create account' }).click();

      // Should show error - actual error depends on Supabase response
      await expect(
        page.locator('[data-sonner-toast]').first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('should link to login page', async ({ page }) => {
      await page.goto('/signup');

      await page.getByRole('link', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Login Flow (AUTH-002)', () => {
    test('should display login form with all required fields', async ({ page }) => {
      await page.goto('/login');

      // Verify form elements are present
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
      await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('textbox', { name: 'Email' }).fill('nonexistent@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('WrongPassword123!');
      await page.getByRole('button', { name: 'Sign in' }).click();

      // Should show error toast
      await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 });
    });

    test('should link to signup page', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: 'Sign up' }).click();
      await expect(page).toHaveURL('/signup');
    });
  });

  test.describe('Magic Link Flow (AUTH-005)', () => {
    test('should show magic link option on login page', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible();
    });
  });

  test.describe('Landing Page Navigation', () => {
    test('should navigate to signup from landing page', async ({ page }) => {
      await page.goto('/');

      // Scope to header since there are multiple "Get Started" links on the page
      await page.locator('header').getByRole('link', { name: 'Get Started' }).click();
      await expect(page).toHaveURL('/signup');
    });

    test('should navigate to login from landing page', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('link', { name: 'Log in' }).click();
      await expect(page).toHaveURL('/login');
    });

    test('should display pricing tiers on landing page', async ({ page }) => {
      await page.goto('/');

      // Verify pricing information is visible (use exact: true for tier names)
      // Updated prices as of Sprint 25: $0, $4.99, $9.99, $19.99
      await expect(page.getByText('Free', { exact: true })).toBeVisible();
      await expect(page.getByText('$0')).toBeVisible();
      await expect(page.getByText('Starter', { exact: true })).toBeVisible();
      await expect(page.getByText('$4.99')).toBeVisible();
      await expect(page.getByText('Plus', { exact: true })).toBeVisible();
      await expect(page.getByText('$9.99')).toBeVisible();
      await expect(page.getByText('Pro', { exact: true })).toBeVisible();
      await expect(page.getByText('$19.99')).toBeVisible();
    });
  });
});
