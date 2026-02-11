import { test, expect } from '@playwright/test';

/**
 * Landing Page E2E Tests
 * Sprint 25: Verification of redesigned landing page
 *
 * Test Coverage:
 * - Layout & Sections
 * - Navigation & CTAs
 * - Responsive Design
 * - Visual Elements
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Layout & Sections', () => {
    test('should display hero section with headline and CTAs', async ({ page }) => {
      // Hero headline
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText("Your Aquarium's")).toBeVisible();
      await expect(page.getByText('Personal AI')).toBeVisible();

      // Hero CTAs
      await expect(page.getByRole('link', { name: 'Start Free Trial' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'See How It Works' })).toBeVisible();

      // Trust signals
      await expect(page.getByText('7-day free trial')).toBeVisible();
      await expect(page.getByText('No credit card required')).toBeVisible();
      await expect(page.getByText('Cancel anytime')).toBeVisible();
    });

    test('should display 6 feature cards in features section', async ({ page }) => {
      // Navigate to features section
      const featuresSection = page.locator('#features');
      await expect(featuresSection).toBeVisible();

      // Check feature headings
      await expect(page.getByRole('heading', { name: 'AI Chat Assistant' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Water Parameter Tracking' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Livestock Management' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Smart Reminders' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Species Database' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Tank Health Scores' })).toBeVisible();

      // Count feature cards - they should all have the group class structure
      const featureCards = page.locator('section#features .group');
      await expect(featureCards).toHaveCount(6);
    });

    test('should display 4 pricing tiers with correct prices', async ({ page }) => {
      // Free tier
      await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
      await expect(page.getByText('$0')).toBeVisible();

      // Starter tier
      await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible();
      await expect(page.getByText('$4.99')).toBeVisible();

      // Plus tier
      await expect(page.getByRole('heading', { name: 'Plus' })).toBeVisible();
      await expect(page.getByText('$9.99')).toBeVisible();

      // Pro tier
      await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
      await expect(page.getByText('$19.99')).toBeVisible();
    });

    test('should show POPULAR badge on Plus tier', async ({ page }) => {
      const popularBadge = page.getByText('POPULAR');
      await expect(popularBadge).toBeVisible();

      // Badge should be near the Plus tier
      const plusSection = page.locator('text=Plus').first().locator('..');
      await expect(plusSection).toBeVisible();
    });

    test('should display footer with all links', async ({ page }) => {
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      // Footer links
      await expect(footer.getByRole('link', { name: 'About' })).toBeVisible();
      await expect(footer.getByRole('link', { name: 'Contact' })).toBeVisible();
      await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible();
      await expect(footer.getByRole('link', { name: 'Terms' })).toBeVisible();
      await expect(footer.getByRole('link', { name: 'Support' })).toBeVisible();

      // Copyright
      const currentYear = new Date().getFullYear().toString();
      await expect(footer.getByText(currentYear)).toBeVisible();
    });
  });

  test.describe('Navigation & CTAs', () => {
    test('should navigate to /signup from hero "Start Free Trial" button', async ({ page }) => {
      await page.getByRole('link', { name: 'Start Free Trial' }).click();
      await expect(page).toHaveURL('/signup');
    });

    test('should navigate to /login from header "Log in" button', async ({ page }) => {
      await page.getByRole('link', { name: 'Log in' }).click();
      await expect(page).toHaveURL('/login');
    });

    test('should navigate to /signup from header "Get Started" button', async ({ page }) => {
      const header = page.locator('header');
      await header.getByRole('link', { name: 'Get Started' }).click();
      await expect(page).toHaveURL('/signup');
    });

    test('should scroll to #features on "See How It Works" click', async ({ page }) => {
      await page.getByRole('link', { name: 'See How It Works' }).click();

      // Wait for scroll animation
      await page.waitForTimeout(500);

      // Features section should be in viewport
      const featuresSection = page.locator('#features');
      await expect(featuresSection).toBeInViewport();
    });

    test('should navigate to /signup from Free tier button', async ({ page }) => {
      // Free tier has a Get Started button that goes to /signup (no plan param)
      // The Free tier is the only pricing card with "Get Started" (others have "Start Trial")
      // The main section also has a "Get Started" button, so we find the one in pricing area
      const allGetStartedLinks = page.getByRole('link', { name: 'Get Started' });
      // There are 3: header, Free tier card, and hero section potentially
      // Free tier is the second one (index 1) - after header
      const freeTierButton = allGetStartedLinks.nth(1);
      await freeTierButton.click();
      await expect(page).toHaveURL('/signup');
    });

    test('should navigate to /signup?plan=starter from Starter tier button', async ({ page }) => {
      const starterButton = page.getByRole('link', { name: 'Start Trial' }).first();
      await starterButton.click();
      await expect(page).toHaveURL('/signup?plan=starter');
    });

    test('should navigate to /signup?plan=plus from Plus tier button', async ({ page }) => {
      // Plus tier has a distinct styling - it's the gradient one with white button
      const plusTierCard = page.locator('.bg-gradient-to-br.from-brand-navy');
      await plusTierCard.getByRole('link', { name: 'Start Trial' }).click();
      await expect(page).toHaveURL('/signup?plan=plus');
    });

    test('should navigate to /signup?plan=pro from Pro tier button', async ({ page }) => {
      // Pro tier button - last Start Trial on the page
      const proButton = page.getByRole('link', { name: 'Start Trial' }).last();
      await proButton.click();
      await expect(page).toHaveURL('/signup?plan=pro');
    });
  });

  test.describe('Visual Elements', () => {
    test('should display sticky header on scroll', async ({ page }) => {
      const header = page.locator('header');

      // Check header has sticky class
      await expect(header).toHaveClass(/sticky/);

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));

      // Header should still be visible
      await expect(header).toBeVisible();
      await expect(header).toBeInViewport();
    });

    test('should display AquaBotAI branding in header', async ({ page }) => {
      const header = page.locator('header');
      await expect(header.getByText('AquaBotAI')).toBeVisible();
    });

    test('should display AquaBotAI branding in footer', async ({ page }) => {
      const footer = page.locator('footer');
      // Footer has multiple AquaBotAI references - use first() or exact match
      await expect(footer.getByText('AquaBotAI', { exact: true })).toBeVisible();
    });
  });
});

test.describe('Landing Page - Responsive Design', () => {
  test.describe('Mobile Layout (375px)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('should stack hero CTAs vertically on mobile', async ({ page }) => {
      await page.goto('/');

      const ctaContainer = page.locator('.flex.flex-col.gap-4.sm\\:flex-row');
      await expect(ctaContainer).toBeVisible();

      // On mobile, flex-col should apply (not flex-row)
      const startTrialButton = page.getByRole('link', { name: 'Start Free Trial' });
      const seeHowButton = page.getByRole('link', { name: 'See How It Works' });

      await expect(startTrialButton).toBeVisible();
      await expect(seeHowButton).toBeVisible();

      // Get bounding boxes to verify vertical stacking
      const startBox = await startTrialButton.boundingBox();
      const seeHowBox = await seeHowButton.boundingBox();

      if (startBox && seeHowBox) {
        // Second button should be below first (vertical stack)
        expect(seeHowBox.y).toBeGreaterThan(startBox.y);
      }
    });

    test('should maintain readable pricing cards on mobile', async ({ page }) => {
      await page.goto('/');

      // All pricing tiers should be visible
      await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Plus' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();

      // Pricing amounts should be visible
      await expect(page.getByText('$0')).toBeVisible();
      await expect(page.getByText('$4.99')).toBeVisible();
      await expect(page.getByText('$9.99')).toBeVisible();
      await expect(page.getByText('$19.99')).toBeVisible();
    });

    test('should show header navigation on mobile', async ({ page }) => {
      await page.goto('/');

      const header = page.locator('header');
      // Header buttons should be visible - scope to header to avoid multiple matches
      await expect(header.getByRole('link', { name: 'Log in' })).toBeVisible();
      await expect(header.getByRole('link', { name: 'Get Started' })).toBeVisible();
    });
  });

  test.describe('Tablet Layout (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display feature grid in 2 columns', async ({ page }) => {
      await page.goto('/');

      // Feature cards grid should adjust for tablet
      const featuresSection = page.locator('#features');
      await expect(featuresSection).toBeVisible();

      // All 6 features should be visible
      const featureCards = featuresSection.locator('.group');
      await expect(featureCards).toHaveCount(6);
    });

    test('should show pricing tiers in 2-column grid', async ({ page }) => {
      await page.goto('/');

      // All tiers should be visible
      await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
    });
  });
});

test.describe('Landing Page - Footer Navigation', () => {
  test('should navigate to /about from footer', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL('/about');
  });

  test('should navigate to /contact from footer', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL('/contact');
  });

  test('should navigate to /privacy from footer', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL('/privacy');
  });

  test('should navigate to /terms from footer', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Terms' }).click();
    await expect(page).toHaveURL('/terms');
  });

  test('should navigate to /support from footer', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Support' }).click();
    await expect(page).toHaveURL('/support');
  });
});
