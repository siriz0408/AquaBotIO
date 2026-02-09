import { test, expect } from '@playwright/test';

/**
 * Free Tools E2E Tests
 * Based on AquaBotAI Sprint 16 - Free Tools (Static Calculators)
 *
 * Test Cases:
 * - Tools page accessibility for all tiers
 * - Water Change Calculator functionality
 * - Stocking Calculator functionality
 * - Parameter Reference Guide with freshwater/saltwater toggle
 */

test.describe('Free Tools Page', () => {
  test.describe('Page Navigation', () => {
    test('should navigate to /tools page', async ({ page }) => {
      await page.goto('/tools');

      // Should either show tools page or redirect to login
      await expect(page).toHaveURL(/\/(login|tools)/);

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Page title should be visible
        await expect(page.getByText('Aquarium Tools')).toBeVisible();
        await expect(page.getByText('Free calculators and guides for all aquarists')).toBeVisible();
      }
    });

    test('should display all three tool sections', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Check for all three tool cards
        await expect(page.getByText('Water Change Calculator')).toBeVisible();
        await expect(page.getByText('Stocking Calculator')).toBeVisible();
        await expect(page.getByText('Parameter Reference Guide')).toBeVisible();
      }
    });

    test('should have back button to dashboard', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        const backButton = page.getByRole('link', { name: /back to dashboard/i });
        await expect(backButton).toBeVisible();
      }
    });
  });

  test.describe('Water Change Calculator', () => {
    test('should calculate water change correctly', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Find and fill tank volume input
        const volumeInput = page.getByLabel(/Tank Volume \(gallons\)/i).first();
        await volumeInput.clear();
        await volumeInput.fill('50');

        // Find and fill percentage input
        const percentageInput = page.getByLabel(/Change Percentage/i);
        await percentageInput.clear();
        await percentageInput.fill('20');

        // Verify result is displayed (50 * 0.20 = 10 gallons)
        await expect(page.getByText('10.0 gal')).toBeVisible();

        // Verify liters conversion is shown (10 * 3.78541 = 37.9 liters)
        await expect(page.getByText(/37\.9 liters/i)).toBeVisible();
      }
    });

    test('should respond to tank size presets', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Click on a tank preset button
        const preset55 = page.getByRole('button', { name: '55 gal' });
        await preset55.click();

        // The input should now show 55
        const volumeInput = page.getByLabel(/Tank Volume \(gallons\)/i).first();
        await expect(volumeInput).toHaveValue('55');
      }
    });

    test('should respond to percentage presets', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Click on a percentage preset
        const preset30 = page.getByRole('button', { name: '30%' });
        await preset30.click();

        // The input should now show 30
        const percentageInput = page.getByLabel(/Change Percentage/i);
        await expect(percentageInput).toHaveValue('30');
      }
    });
  });

  test.describe('Stocking Calculator', () => {
    test('should show understocked status for low stocking', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Find stocking calculator inputs
        // Volume input has id stocking-tank-volume to differentiate
        const volumeInput = page.locator('#stocking-tank-volume');
        await volumeInput.clear();
        await volumeInput.fill('50');

        const fishInput = page.getByLabel(/Total Fish Length/i);
        await fishInput.clear();
        await fishInput.fill('10');

        // 10 inches in 50 gallons = 20% = Understocked
        await expect(page.getByText('Understocked')).toBeVisible();
        await expect(page.getByText('20%')).toBeVisible();
      }
    });

    test('should show well-stocked status for medium stocking', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        const volumeInput = page.locator('#stocking-tank-volume');
        await volumeInput.clear();
        await volumeInput.fill('50');

        const fishInput = page.getByLabel(/Total Fish Length/i);
        await fishInput.clear();
        await fishInput.fill('35');

        // 35 inches in 50 gallons = 70% = Well Stocked
        await expect(page.getByText('Well Stocked')).toBeVisible();
        await expect(page.getByText('70%')).toBeVisible();
      }
    });

    test('should show approaching limit status for high stocking', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        const volumeInput = page.locator('#stocking-tank-volume');
        await volumeInput.clear();
        await volumeInput.fill('50');

        const fishInput = page.getByLabel(/Total Fish Length/i);
        await fishInput.clear();
        await fishInput.fill('45');

        // 45 inches in 50 gallons = 90% = Approaching Limit
        await expect(page.getByText('Approaching Limit')).toBeVisible();
        await expect(page.getByText('90%')).toBeVisible();
      }
    });

    test('should show overstocked status when over capacity', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        const volumeInput = page.locator('#stocking-tank-volume');
        await volumeInput.clear();
        await volumeInput.fill('50');

        const fishInput = page.getByLabel(/Total Fish Length/i);
        await fishInput.clear();
        await fishInput.fill('60');

        // 60 inches in 50 gallons = 120% = Overstocked
        await expect(page.getByText('Overstocked')).toBeVisible();
        await expect(page.getByText('120%')).toBeVisible();
      }
    });
  });

  test.describe('Parameter Reference Guide', () => {
    test('should display freshwater parameters by default', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Freshwater button should be selected
        const freshwaterButton = page.getByRole('tab', { name: 'Freshwater' });
        await expect(freshwaterButton).toBeVisible();

        // Freshwater pH range should be visible
        await expect(page.getByText('6.5-7.5')).toBeVisible();

        // Salinity row should NOT be visible (freshwater only)
        await expect(page.getByText('Salinity')).not.toBeVisible();
      }
    });

    test('should switch to saltwater parameters', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Click saltwater button
        const saltwaterButton = page.getByRole('tab', { name: 'Saltwater' });
        await saltwaterButton.click();

        // Saltwater pH range should be visible
        await expect(page.getByText('8.1-8.4')).toBeVisible();

        // Salinity row should now be visible
        await expect(page.getByText('Salinity')).toBeVisible();
        await expect(page.getByText('1.023-1.025')).toBeVisible();
      }
    });

    test('should display all parameter rows', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Check that core parameters are visible
        await expect(page.getByText('Ammonia')).toBeVisible();
        await expect(page.getByText('Nitrite')).toBeVisible();
        await expect(page.getByText('Nitrate')).toBeVisible();
        await expect(page.getByText('pH')).toBeVisible();
        await expect(page.getByText('Temperature')).toBeVisible();
      }
    });

    test('should show legend with color indicators', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Check for legend items
        await expect(page.getByText('Safe').first()).toBeVisible();
        await expect(page.getByText('Warning').first()).toBeVisible();
        await expect(page.getByText('Danger').first()).toBeVisible();
      }
    });
  });

  test.describe('Free Tools Promo on Dashboard', () => {
    test('should show Free Tools promo card on dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      const isOnDashboard = await page.url().includes('/dashboard');
      if (isOnDashboard) {
        // Look for the Free Tools promo card
        const promoCard = page.getByText('Free Aquarium Tools');
        const hasPromo = await promoCard.count() > 0;

        // Either shows promo card or we're not authenticated
        expect(hasPromo || page.url().includes('/login')).toBeTruthy();
      }
    });

    test('should navigate to tools page from promo card', async ({ page }) => {
      await page.goto('/dashboard');

      const isOnDashboard = await page.url().includes('/dashboard');
      if (isOnDashboard) {
        // Look for and click the Free Tools link
        const promoLink = page.getByRole('link').filter({
          has: page.getByText('Free Aquarium Tools')
        });

        const hasPromo = await promoLink.count() > 0;
        if (hasPromo) {
          await promoLink.click();
          await expect(page).toHaveURL(/\/tools/);
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Check for calculation results region
        const resultsRegion = page.getByRole('region', { name: /calculation results/i });
        await expect(resultsRegion.first()).toBeVisible();

        // Check for water type selection tabs
        const tabList = page.getByRole('tablist', { name: /water type selection/i });
        await expect(tabList).toBeVisible();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/tools');

      const isOnToolsPage = await page.url().includes('/tools');
      if (isOnToolsPage) {
        // Tab through the page elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should be able to navigate and interact
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });
  });
});
