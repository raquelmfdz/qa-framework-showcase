/**
 * K6 Baseline Ramp — gradual load test for read-heavy endpoints.
 *
 * Purpose: establish p95 latency baseline and identify degradation under
 * realistic concurrent load. Does not place orders or mutate state.
 *
 * Stages:
 *  1. Ramp up to 10 VUs over 30s
 *  2. Hold 10 VUs for 1 minute
 *  3. Ramp down to 0 over 20s
 *
 * Usage:
 *   k6 run non-functional-tests/load/scenarios/baseline-ramp.js
 *   k6 run --env BASE_URL=https://staging.example.com non-functional-tests/load/scenarios/baseline-ramp.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const catalogLatency = new Trend('catalog_latency', true);
const apiLatency = new Trend('api_latency', true);
const errorRate = new Rate('error_rate');
const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp up
    { duration: '1m', target: 10 },   // hold
    { duration: '20s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'],    // 95th percentile under 600ms
    http_req_failed: ['rate<0.01'],      // less than 1% HTTP errors
    error_rate: ['rate<0.02'],           // less than 2% check failures
    catalog_latency: ['p(95)<800'],
    api_latency: ['p(95)<300'],
  },
};

export default function () {
  group('Catalog browsing', () => {
    const homeRes = http.get(`${BASE_URL}/`);
    catalogLatency.add(homeRes.timings.duration);
    totalRequests.add(1);

    const homeOk = check(homeRes, {
      'home 200': (r) => r.status === 200,
    });
    errorRate.add(!homeOk);

    sleep(1);

    const page2Res = http.get(`${BASE_URL}/?page=2`);
    catalogLatency.add(page2Res.timings.duration);
    totalRequests.add(1);

    const page2Ok = check(page2Res, {
      'page 2 200': (r) => r.status === 200,
    });
    errorRate.add(!page2Ok);

    sleep(1);
  });

  group('Product API', () => {
    const productsRes = http.get(`${BASE_URL}/api/products`);
    apiLatency.add(productsRes.timings.duration);
    totalRequests.add(1);

    const productsOk = check(productsRes, {
      'products 200': (r) => r.status === 200,
      'products array': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body.toString()));
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!productsOk);

    sleep(0.5);
  });

  group('Auth guardrails', () => {
    // Verify protected endpoints enforce auth without throwing 5xx
    const adminRes = http.get(`${BASE_URL}/api/admin/orders`);
    totalRequests.add(1);

    const adminOk = check(adminRes, {
      'admin orders returns 401': (r) => r.status === 401,
    });
    errorRate.add(!adminOk);

    sleep(0.5);
  });
}
