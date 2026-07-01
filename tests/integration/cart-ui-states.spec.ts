import { test, expect } from '../src/fixtures/pages.fixture';
import { mockSession } from '../src/helpers/mock-session';

test.describe('Cart — interaction states', () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page, 'user');
    let cartState = [
      {
        id: 1,
        product_id: 101,
        quantity: 2,
        name: 'Mock Backpack',
        price: 10,
        image_url: '',
      },
    ];

    await page.route('**/api/cart', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(cartState),
        });
        return;
      }

      if (request.method() === 'PUT') {
        const body = request.postDataJSON() as { productId: number; quantity: number };
        cartState = cartState.map((item) =>
          item.product_id === body.productId ? { ...item, quantity: body.quantity } : item
        );
      }

      if (request.method() === 'DELETE') {
        const body = request.postDataJSON() as { productId?: number };
        cartState = body.productId
          ? cartState.filter((item) => item.product_id !== body.productId)
          : [];
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('updating quantity does not show the full-page loading state again', async ({
    cartPage,
    page,
    navbar,
  }) => {
    await cartPage.open();

    const quantityInput = page.getByTestId('cart-quantity-101');
    await expect(quantityInput).toHaveValue('2');
    await expect(page.getByText(/loading cart/i)).not.toBeVisible();

    await quantityInput.fill('3');
    await expect(quantityInput).toHaveValue('3');
    await expect(page.getByText(/loading cart/i)).not.toBeVisible();
    await expect(cartPage.totalAmount).toContainText('€30.00');
    await expect(navbar.cartItemCount).toHaveText('Cart (3)');
  });

  test('typing a letter into quantity does not delete the item or change the value', async ({
    cartPage,
    page,
  }) => {
    await cartPage.open();

    const quantityInput = page.getByTestId('cart-quantity-101');
    await expect(quantityInput).toHaveValue('2');

    await quantityInput.click();
    await quantityInput.press('a');

    await expect(quantityInput).toHaveValue('2');
    await expect(cartPage.lineItemByName('Mock Backpack')).toBeVisible();
    await expect(cartPage.totalAmount).toContainText('€20.00');
  });
});
