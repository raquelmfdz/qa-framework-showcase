import { APIRequestContext } from '@playwright/test';

/**
 * Direct API helpers for test data setup/teardown. Use these in `test.beforeEach`
 * when a spec needs a specific starting state (e.g. "cart has 2 items") without
 * paying the cost of driving the UI to get there — that UI flow should be
 * covered once, by its own dedicated test, not repeated as setup boilerplate
 * everywhere else.
 *
 * These assume the request context already carries a valid session cookie,
 * i.e. they're called from a test running under a project with
 * `storageState` configured (see playwright.config.ts).
 */
export async function clearCart(request: APIRequestContext, baseURL: string): Promise<void> {
  const response = await request.get(`${baseURL}/api/cart`);
  if (!response.ok()) return;

  const { items } = (await response.json()) as { items: { productId: number }[] };
  await Promise.all(
    items.map((item) =>
      request.delete(`${baseURL}/api/cart`, { data: { productId: item.productId } })
    )
  );
}

export async function addProductToCart(
  request: APIRequestContext,
  baseURL: string,
  productId: number,
  quantity = 1
): Promise<void> {
  const response = await request.post(`${baseURL}/api/cart`, {
    data: { productId, quantity },
  });
  if (!response.ok()) {
    throw new Error(
      `Failed to seed cart via API (product ${productId}): ${response.status()} ${await response.text()}`
    );
  }
}
