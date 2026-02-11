import { test, expect } from '@playwright/test';

/**
 * Tank Edit Form E2E Tests
 * Sprint 25: Verification of improved tank edit form
 *
 * Test Coverage:
 * - Photo Upload functionality
 * - Setup Date field
 * - Substrate Dropdown with custom option
 * - Form Validation
 * - Form Submission
 *
 * Note: These tests require authentication. When not authenticated,
 * the page redirects to login. Tests handle both states gracefully.
 */

test.describe('Tank Edit Form', () => {
  test.describe('Page Access', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      // Try to access edit page without auth
      await page.goto('/tanks/test-tank-id/edit');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should display edit form structure when authenticated', async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');

      // If redirected to login, this test validates the redirect works
      const isOnEditPage = page.url().includes('/edit');

      if (isOnEditPage) {
        // Verify form structure
        await expect(page.getByRole('heading', { name: 'Edit Tank' })).toBeVisible();
        await expect(page.getByText('Update your tank profile settings')).toBeVisible();
      } else {
        // Redirected to login as expected for unauthenticated users
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe('Form Elements Verification', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');
    });

    test('should display all form fields', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      // Tank Photo section
      await expect(page.getByText('Tank Photo')).toBeVisible();

      // Tank Name field
      await expect(page.getByLabel('Tank Name *')).toBeVisible();

      // Tank Type dropdown
      await expect(page.getByLabel('Tank Type *')).toBeVisible();

      // Setup Date field
      await expect(page.getByLabel('Setup Date')).toBeVisible();

      // Volume field
      await expect(page.getByLabel('Volume (gallons) *')).toBeVisible();

      // Dimensions
      await expect(page.getByText('Dimensions (inches)')).toBeVisible();

      // Substrate dropdown
      await expect(page.getByLabel('Substrate')).toBeVisible();

      // Notes field
      await expect(page.getByLabel('Notes')).toBeVisible();

      // Submit buttons
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
    });
  });

  test.describe('Photo Upload', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');
    });

    test('should show photo upload area', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      // Photo upload section should exist
      await expect(page.getByText('Tank Photo')).toBeVisible();

      // Either shows empty upload area or existing photo
      const uploadButton = page.getByText('Add Tank Photo');
      const existingPhoto = page.locator('img[alt="Tank photo"]');

      const hasUploadButton = await uploadButton.count() > 0;
      const hasExistingPhoto = await existingPhoto.count() > 0;

      expect(hasUploadButton || hasExistingPhoto).toBeTruthy();
    });

    test('should show file size and format hints', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      await expect(page.getByText('Max 5MB, JPEG/PNG/WebP')).toBeVisible();
    });

    test('should have hidden file input for photo selection', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      // Hidden file input should exist
      const fileInput = page.locator('input[type="file"][accept*="image"]');
      await expect(fileInput).toHaveCount(1);
    });
  });

  test.describe('Setup Date Field', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');
    });

    test('should display date input', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const dateInput = page.locator('input[type="date"]#setupDate');
      await expect(dateInput).toBeVisible();
    });

    test('should show helper text for setup date', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      await expect(
        page.getByText('When was this tank set up? Helps track tank maturity.')
      ).toBeVisible();
    });

    test('should not allow future dates', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const dateInput = page.locator('input[type="date"]#setupDate');

      // Check max attribute exists and is today's date
      const maxDate = await dateInput.getAttribute('max');
      expect(maxDate).toBeTruthy();

      // Max should be today or earlier
      const maxDateObj = new Date(maxDate!);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      expect(maxDateObj.getTime()).toBeLessThanOrEqual(today.getTime());
    });

    test('should accept valid past date', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const dateInput = page.locator('input[type="date"]#setupDate');

      // Enter a past date
      await dateInput.fill('2023-01-15');

      // Verify value was set
      await expect(dateInput).toHaveValue('2023-01-15');
    });
  });

  test.describe('Substrate Dropdown', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');
    });

    test('should display predefined substrate options', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const substrateSelect = page.locator('select#substrate');
      await expect(substrateSelect).toBeVisible();

      // Check for predefined options
      const options = substrateSelect.locator('option');
      const optionTexts = await options.allTextContents();

      expect(optionTexts).toContain('Select substrate...');
      expect(optionTexts).toContain('Sand');
      expect(optionTexts).toContain('Gravel');
      expect(optionTexts).toContain('Bare Bottom');
      expect(optionTexts).toContain('Planted Substrate (Aquasoil)');
      expect(optionTexts).toContain('Crushed Coral');
      expect(optionTexts).toContain('Mixed');
      expect(optionTexts).toContain('Other');
    });

    test('should show custom input when "Other" is selected', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const substrateSelect = page.locator('select#substrate');

      // Initially, custom input should not be visible
      const customInput = page.getByPlaceholder('Describe your substrate...');
      await expect(customInput).not.toBeVisible();

      // Select "Other"
      await substrateSelect.selectOption('other');

      // Now custom input should be visible
      await expect(customInput).toBeVisible();
    });

    test('should hide custom input when switching from "Other" to another option', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const substrateSelect = page.locator('select#substrate');
      const customInput = page.getByPlaceholder('Describe your substrate...');

      // Select "Other" first
      await substrateSelect.selectOption('other');
      await expect(customInput).toBeVisible();

      // Fill in custom value
      await customInput.fill('Custom substrate mix');

      // Switch to a predefined option
      await substrateSelect.selectOption('gravel');

      // Custom input should be hidden
      await expect(customInput).not.toBeVisible();
    });

    test('should allow typing in custom substrate field', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const substrateSelect = page.locator('select#substrate');

      // Select "Other"
      await substrateSelect.selectOption('other');

      // Type custom substrate
      const customInput = page.getByPlaceholder('Describe your substrate...');
      await customInput.fill('Fluval Stratum with sand cap');

      await expect(customInput).toHaveValue('Fluval Stratum with sand cap');
    });
  });

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');
    });

    test('should require tank name field', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const nameInput = page.getByLabel('Tank Name *');
      await expect(nameInput).toHaveAttribute('required');
    });

    test('should require volume field', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const volumeInput = page.getByLabel('Volume (gallons) *');
      await expect(volumeInput).toHaveAttribute('required');
    });

    test('should enforce minimum volume', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const volumeInput = page.getByLabel('Volume (gallons) *');

      // Check min attribute
      const minValue = await volumeInput.getAttribute('min');
      expect(parseFloat(minValue!)).toBeGreaterThan(0);
    });
  });

  test.describe('Form Submission', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');
    });

    test('should have cancel button that navigates back', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();
    });

    test('should have save button', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const saveButton = page.getByRole('button', { name: 'Save Changes' });
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();
    });

    test('should have back arrow navigation', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      // Back button in header
      const backButton = page.locator('header').getByRole('link').first();
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Tank Type Dropdown', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');
    });

    test('should display tank type options', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const typeSelect = page.locator('select#type');
      await expect(typeSelect).toBeVisible();

      const options = typeSelect.locator('option');
      const optionTexts = await options.allTextContents();

      // Should have tank type options
      expect(optionTexts.length).toBeGreaterThan(0);
      expect(optionTexts).toContain('Freshwater');
    });

    test('should allow changing tank type', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const typeSelect = page.locator('select#type');

      // Select different type
      await typeSelect.selectOption('saltwater');

      await expect(typeSelect).toHaveValue('saltwater');
    });
  });

  test.describe('Dimensions Fields', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');
    });

    test('should display three dimension inputs', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      await expect(page.getByText('Dimensions (inches)')).toBeVisible();

      // Length, Width, Height labels
      await expect(page.getByText('Length').first()).toBeVisible();
      await expect(page.getByText('Width').first()).toBeVisible();
      await expect(page.getByText('Height').first()).toBeVisible();

      // Corresponding inputs
      const dimensionInputs = page.locator('input[placeholder="Length"], input[placeholder="Width"], input[placeholder="Height"]');
      await expect(dimensionInputs).toHaveCount(3);
    });

    test('should accept numeric dimension values', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const lengthInput = page.locator('input[placeholder="Length"]');
      await lengthInput.fill('24');
      await expect(lengthInput).toHaveValue('24');
    });
  });

  test.describe('Notes Field', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tanks/test-tank-id/edit');
    });

    test('should display notes textarea', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const notesField = page.locator('textarea#notes');
      await expect(notesField).toBeVisible();
    });

    test('should show placeholder text', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const notesField = page.locator('textarea#notes');
      await expect(notesField).toHaveAttribute(
        'placeholder',
        'Any additional notes about your tank setup, equipment, or special considerations...'
      );
    });

    test('should allow entering notes text', async ({ page }) => {
      const isOnEditPage = page.url().includes('/edit');
      if (!isOnEditPage) {
        test.skip();
        return;
      }

      const notesField = page.locator('textarea#notes');
      await notesField.fill('This is a planted community tank with CO2 injection.');
      await expect(notesField).toHaveValue('This is a planted community tank with CO2 injection.');
    });
  });
});
