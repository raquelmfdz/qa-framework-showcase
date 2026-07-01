/**
 * K6 Smoke Test — baseline health check for critical API endpoints.
 *
 * Purpose: verify the app responds correctly under minimal load (1 VU).
 * Run before any soak or stress test to confirm environment is healthy.
 *
 * Usage:
 *   k6 run non-functional-tests/load/scenarios/smoke.js
 *   k6 run --env BASE_URL=http://localhost:3000 non-functional-tests/load/scenarios/smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const catalogLatency = new Trend('catalog_latency', true);
const apiLatency = new Trend('api_latency', true);
const errorRate = new Rate('error_rate');

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<600'],
    http_req_failed: ['rate<0.01'],    // less than 1% errors
    error_rate: ['rate<0.02'],
    catalog_latency: ['p(95)<900'],
    api_latency: ['p(95)<350'],
  },
};

export default function () {
  const warmup = __ITER === 0;

  // ── Catalog (SSR page) ────────────────────────────────────────────────────
  const homeRes = http.get(`${BASE_URL}/`);
  const homeOk = check(homeRes, {
    'home status 200': (r) => r.status === 200,
    'home contains product grid': (r) => r.body.toString().includes('product-card'),
  });
  catalogLatency.add(homeRes.timings.duration);
  if (!warmup) errorRate.add(!homeOk);

  sleep(1);

  // ── Products API ──────────────────────────────────────────────────────────
  const productsRes = http.get(`${BASE_URL}/api/products`);
  const productsOk = check(productsRes, {
    'products status 200': (r) => r.status === 200,
    'products returns array': (r) => {
      try {
        const body = JSON.parse(r.body.toString());
        return Array.isArray(body) && body.length > 0;
      } catch {
        return false;
      }
    },
  });
  apiLatency.add(productsRes.timings.duration);
  if (!warmup) errorRate.add(!productsOk);

  sleep(1);

  // ── Cart API (unauthenticated — returns empty) ────────────────────────────
  const cartRes = http.get(`${BASE_URL}/api/cart`);
  const cartOk = check(cartRes, {
    'cart status 200': (r) => r.status === 200,
  });
  apiLatency.add(cartRes.timings.duration);
  if (!warmup) errorRate.add(!cartOk);

  sleep(1);

  // ── Orders API (unauthenticated — returns empty array) ────────────────────
  const ordersRes = http.get(`${BASE_URL}/api/orders`);
  const ordersOk = check(ordersRes, {
    'orders status 200': (r) => r.status === 200,
    'unauthenticated orders returns empty array': (r) => {
      try {
        const body = JSON.parse(r.body.toString());
        return Array.isArray(body) && body.length === 0;
      } catch {
        return false;
      }
    },
  });
  apiLatency.add(ordersRes.timings.duration);
  if (!warmup) errorRate.add(!ordersOk);

  sleep(1);
}
