import { test, expect } from '@playwright/test';

/**
 * Parameters & Maintenance Pages Debug Tests
 *
 * These tests help debug why parameters and maintenance pages may not be working.
 *
 * Expected behavior:
 * - /tanks/[id]/parameters - requires auth + valid tank ID
 * - /tanks/[id]/maintenance - requires auth + valid tank ID
 * - Bottom tab bar should link to these pages when a tank is selected
 */

test.describe('Parameters Page Debug', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try accessing parameters page with a fake tank ID
    await page.goto('/tanks/test-tank-id/parameters');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should check if dashboard loads with bottom navigation', async ({ page }) => {
    // First check if the app loads at all
    await page.goto('/');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/debug-homepage.png' });

    // Check if the page has the expected content
    const title = await page.title();
    console.log('Homepage title:', title);

    // Look for bottom navigation on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check for bottom tab bar
    const bottomNav = page.locator('nav').filter({ has: page.locator('text=Parameters') });
    const hasBottomNav = await bottomNav.count() > 0;
    console.log('Has bottom nav with Parameters:', hasBottomNav);

    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/debug-homepage-mobile.png' });
  });

  test('should check parameters page structure when accessed directly', async ({ page }) => {
    // Navigate to parameters with a test ID
    const response = await page.goto('/tanks/00000000-0000-0000-0000-000000000000/parameters');

    console.log('Response status:', response?.status());
    console.log('Current URL:', page.url());

    // Wait for any redirects
    await page.waitForLoadState('networkidle');

    console.log('Final URL after load:', page.url());

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-parameters-direct.png' });

    // Check for error messages
    const errorMessage = page.locator('text=/error|not found|404/i');
    const hasError = await errorMessage.count() > 0;
    console.log('Has error message:', hasError);

    if (hasError) {
      const errorText = await errorMessage.first().textContent();
      console.log('Error text:', errorText);
    }
  });

  test('should check if ParameterDashboard component exists', async ({ page }) => {
    // This tests if the component is even being rendered
    // First, we need to be authenticated and have a tank
    await page.goto('/login');

    console.log('Login page URL:', page.url());

    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/debug-login-page.png' });
  });
});

test.describe('Maintenance Page Debug', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try accessing maintenance page with a fake tank ID
    await page.goto('/tanks/test-tank-id/maintenance');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should check maintenance page structure when accessed directly', async ({ page }) => {
    // Navigate to maintenance with a test ID
    const response = await page.goto('/tanks/00000000-0000-0000-0000-000000000000/maintenance');

    console.log('Response status:', response?.status());
    console.log('Current URL:', page.url());

    // Wait for any redirects
    await page.waitForLoadState('networkidle');

    console.log('Final URL after load:', page.url());

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-maintenance-direct.png' });

    // Check for error messages
    const errorMessage = page.locator('text=/error|not found|404/i');
    const hasError = await errorMessage.count() > 0;
    console.log('Has error message:', hasError);
  });
});

test.describe('Bottom Tab Bar Navigation', () => {
  test('should check bottom tab bar links on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Go to dashboard (will redirect to login if not auth)
    await page.goto('/dashboard');

    // Wait for page to settle
    await page.waitForLoadState('networkidle');

    console.log('Dashboard URL:', page.url());

    // If on login, the test can't proceed without auth
    if (page.url().includes('/login')) {
      console.log('Redirected to login - auth required');
      await page.screenshot({ path: 'test-results/debug-bottomnav-login.png' });
      return;
    }

    // Look for bottom navigation
    const bottomNav = page.locator('nav.fixed.bottom-0');
    const hasBottomNav = await bottomNav.count() > 0;
    console.log('Has fixed bottom nav:', hasBottomNav);

    // Find Parameters and Maintenance links
    const paramsLink = page.locator('a').filter({ hasText: 'Parameters' });
    const maintenanceLink = page.locator('a').filter({ hasText: 'Maintenance' });

    const paramsCount = await paramsLink.count();
    const maintenanceCount = await maintenanceLink.count();

    console.log('Parameters links found:', paramsCount);
    console.log('Maintenance links found:', maintenanceCount);

    if (paramsCount > 0) {
      const paramsHref = await paramsLink.first().getAttribute('href');
      console.log('Parameters href:', paramsHref);
    }

    if (maintenanceCount > 0) {
      const maintenanceHref = await maintenanceLink.first().getAttribute('href');
      console.log('Maintenance href:', maintenanceHref);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-bottomnav.png' });
  });
});

test.describe('API Routes Debug', () => {
  test('should check if parameters API returns proper response', async ({ page }) => {
    // Try to hit the API directly
    const response = await page.request.get('/api/tanks/test-id/parameters');

    console.log('Parameters API status:', response.status());
    console.log('Parameters API response:', await response.text());
  });

  test('should check if maintenance API returns proper response', async ({ page }) => {
    // Try to hit the API directly
    const response = await page.request.get('/api/tanks/test-id/maintenance');

    console.log('Maintenance API status:', response.status());
    console.log('Maintenance API response:', await response.text());
  });
});
