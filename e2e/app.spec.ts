import { test, expect } from '@playwright.test';

test.describe('Udhari Khata Local Demo Mode E2E Flow', () => {
  test('complete owner and staff workflow in local mode', async ({ page }) => {
    // 1. Open App
    await page.goto('/');

    // 2. Login as Demo Owner
    await page.fill('#email', 'admin@udhari.local');
    await page.fill('#password', 'Admin@123');
    await page.click('button[type="submit"]');

    // 3. Verify Dashboard Loads
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expect(page.getByText('उधारी खाता')).toBeVisible();

    // 4. Search for customer "दर्शन पाटील"
    const searchInput = page.getByPlaceholder(/शोधा \(Search\)/i);
    await searchInput.fill('दर्शन पाटील');
    await expect(page.getByText('दर्शन पाटील')).toBeVisible();

    // 5. Open Customer Ledger Detail
    await page.getByText('दर्शन पाटील').click();
    await expect(page.getByText('ग्राहकाचे खाते / Ledger')).toBeVisible();

    // 6. Add Credit Transaction
    await page.getByText('उधारी जोडा').click();
    await page.fill('#amount', '150');
    await page.fill('#description', '१L म्हशीचे दूध');
    await page.click('button[type="submit"]');

    // 7. Verify Toast & Ledger Update
    await expect(page.getByText(/उधारी यशस्वीरित्या नोंदवली/i)).toBeVisible();

    // 8. Add Payment Transaction
    await page.getByText('पेमेंट घ्या').click();
    await page.fill('#amount', '100');
    await page.fill('#description', 'UPI भरणा');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/पेमेंट जमा केले/i)).toBeVisible();

    // 9. Navigate to Settings & Verify Owner Options
    await page.getByText('सेटिंग्ज').click();
    await expect(page.getByTestId('settings-page')).toBeVisible();
    await expect(page.getByText('डेमो डेटा रीसेट करा')).toBeVisible();

    // 10. Switch Demo User to Staff
    await page.getByText('भाऊ स्टाफ (Staff)').click();
    await expect(page.getByText('भाऊ स्टाफ (Staff)')).toBeVisible();

    // 11. Refresh Page & Verify Data Persists in Local Mode
    await page.reload();
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // 12. Logout
    await page.getByText('साइन आउट').click();
    await expect(page.getByText('साइन इन करा')).toBeVisible();
  });
});
