import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const summaryDir = path.join(root, 'artifacts', 'summary');
const outFile = process.env.GITHUB_STEP_SUMMARY;

if (!outFile) {
  console.error('GITHUB_STEP_SUMMARY is not set.');
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function fmtMs(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return 'n/a';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function table(rows) {
  if (!rows.length) {
    return ['_No result file found for this suite._', ''];
  }

  const lines = [
    '| Test case | Status | Duration | Retries |',
    '|---|---|---:|---:|',
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.testCase} | ${row.status} | ${row.duration} | ${row.retries} |`
    );
  }

  lines.push('');
  return lines;
}

function fmtNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

function fmtRate(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';
  return `${(value * 100).toFixed(2)}%`;
}

function formatMetricValue(metric, key, value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';

  if (metric?.contains === 'time' || key.startsWith('p(') || key === 'avg' || key === 'min' || key === 'max' || key === 'med') {
    return fmtMs(value);
  }

  if (key === 'rate') {
    return fmtRate(value);
  }

  return fmtNumber(value);
}

function getRunDurationMs(report) {
  if (typeof report?.state?.testRunDurationMs === 'number') {
    return report.state.testRunDurationMs;
  }

  const iterationMetric = report?.metrics?.iterations?.values;
  if (
    typeof iterationMetric?.count === 'number' &&
    typeof iterationMetric?.rate === 'number' &&
    iterationMetric.rate > 0
  ) {
    return (iterationMetric.count / iterationMetric.rate) * 1000;
  }

  const requestMetric = report?.metrics?.http_reqs?.values;
  if (
    typeof requestMetric?.count === 'number' &&
    typeof requestMetric?.rate === 'number' &&
    requestMetric.rate > 0
  ) {
    return (requestMetric.count / requestMetric.rate) * 1000;
  }

  return null;
}

function parsePlaywrightReport(report) {
  const rows = [];

  function walkSuite(suite, titleTrail = []) {
    const nextTrail = suite.title ? [...titleTrail, suite.title] : titleTrail;

    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? [];
        const retries = results.reduce((max, r) => Math.max(max, r.retry ?? 0), 0);
        const duration = results.reduce((sum, r) => sum + (r.duration ?? 0), 0);
        const statuses = results.map((r) => r.status);

        let status = 'unknown';
        if (test.outcome === 'flaky') status = 'flaky';
        else if (statuses.includes('failed') && statuses.includes('passed')) status = 'flaky';
        else if (statuses.includes('failed')) status = 'failed';
        else if (statuses.includes('timedOut')) status = 'timedOut';
        else if (statuses.includes('interrupted')) status = 'interrupted';
        else if (statuses.includes('skipped')) status = 'skipped';
        else if (statuses.includes('passed')) status = 'passed';

        const caseNameParts = [];
        if (test.projectName) caseNameParts.push(`[${test.projectName}]`);
        caseNameParts.push(...nextTrail.filter(Boolean));
        caseNameParts.push(spec.title || '(unnamed spec)');

        rows.push({
          testCase: caseNameParts.join(' > ').replace(/\|/g, '\\|'),
          status,
          duration: fmtMs(duration),
          retries,
        });
      }
    }

    for (const child of suite.suites ?? []) {
      walkSuite(child, nextTrail);
    }
  }

  for (const suite of report.suites ?? []) {
    walkSuite(suite, []);
  }

  return rows;
}

function parseVitestJson(report) {
  const rows = [];

  for (const suite of report.testResults ?? []) {
    const assertions = suite.assertionResults ?? [];
    for (const a of assertions) {
      rows.push({
        testCase: String(a.fullName || a.title || suite.name || 'unit test').replace(/\|/g, '\\|'),
        status: a.status || 'unknown',
        duration: fmtMs(typeof a.duration === 'number' ? a.duration : null),
        retries: 0,
      });
    }
  }

  return rows;
}

function renderK6Summary(report) {
  const lines = [];
  const runMs = getRunDurationMs(report);

  function asItems(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  }

  function collectChecks(group) {
    const checks = [];

    for (const check of asItems(group?.checks)) {
      checks.push(check);
    }

    for (const child of asItems(group?.groups)) {
      checks.push(...collectChecks(child));
    }

    return checks;
  }

  function collectThresholdRows(metrics) {
    const thresholdRows = [];

    for (const [metricName, metric] of Object.entries(metrics ?? {})) {
      for (const [thresholdName, threshold] of Object.entries(metric?.thresholds ?? {})) {
        const match = String(thresholdName).match(/^(.+?)(<=|>=|<|>)(.+)$/);
        const observedKey = match?.[1] ?? '';
        thresholdRows.push({
          metricName: String(metricName),
          thresholdName: String(thresholdName),
          operator: match?.[2] ?? '',
          limit: match?.[3]?.trim() ?? '',
          status: threshold?.ok === false ? 'failed' : 'passed',
          observed: formatMetricValue(
            metric,
            observedKey,
            metric?.values?.[observedKey]
          ),
        });
      }
    }

    return thresholdRows;
  }

  const checks = collectChecks(report?.root_group ?? {});
  const hasFailedCheck = checks.some((check) => Number(check?.fails ?? 0) > 0);
  const thresholdRows = collectThresholdRows(report?.metrics ?? {});
  const hasFailedThreshold = thresholdRows.some((row) => row.status === 'failed');

  const totalChecks = checks.length;
  const passedChecks = checks.filter((check) => Number(check?.fails ?? 0) === 0).length;
  const httpReqs = report?.metrics?.http_reqs?.values;
  const vusMax = report?.metrics?.vus_max?.values?.max ?? report?.metrics?.vus?.values?.max;
  const keyMetrics = [
    { name: 'http_req_duration', stat: 'p(95)', label: 'HTTP latency p95' },
    { name: 'catalog_latency', stat: 'p(95)', label: 'Catalog latency p95' },
    { name: 'api_latency', stat: 'p(95)', label: 'API latency p95' },
    { name: 'http_req_failed', stat: 'rate', label: 'HTTP failure rate' },
    { name: 'error_rate', stat: 'rate', label: 'Check failure rate' },
  ]
    .map((entry) => {
      const metric = report?.metrics?.[entry.name];
      const value = metric?.values?.[entry.stat];
      return {
        label: entry.label,
        observed: formatMetricValue(metric, entry.stat, value),
      };
    })
    .filter((entry) => entry.observed !== 'n/a');

  lines.push(`Status: ${hasFailedCheck || hasFailedThreshold ? 'failed' : 'passed'}`);
  lines.push(`Duration: ${fmtMs(runMs)}`);
  lines.push('Scenario: smoke load test');
  if (typeof vusMax === 'number') {
    lines.push(`Peak VUs: ${fmtNumber(vusMax)}`);
  }
  if (typeof httpReqs?.count === 'number' || typeof httpReqs?.rate === 'number') {
    lines.push(
      `HTTP requests: ${fmtNumber(httpReqs?.count)} total at ${fmtNumber(httpReqs?.rate)}/s`
    );
  }
  if (totalChecks > 0) {
    lines.push(`Checks: ${passedChecks}/${totalChecks} passed`);
  }
  lines.push('');

  if (keyMetrics.length) {
    lines.push('| KPI | Observed |');
    lines.push('|---|---:|');
    for (const metric of keyMetrics) {
      lines.push(`| ${metric.label} | ${metric.observed} |`);
    }
    lines.push('');
  }

  if (!thresholdRows.length) {
    lines.push('_No threshold results found for this suite._');
    lines.push('');
    return lines;
  }

  const hasObservedValues = thresholdRows.some((row) => row.observed !== 'n/a');

  if (hasObservedValues) {
    lines.push('| Metric | Limit | Observed | Status |');
    lines.push('|---|---|---:|---|');
    for (const row of thresholdRows) {
      lines.push(
        `| ${row.metricName.replace(/\|/g, '\\|')} | ${`${row.operator}${row.limit}`.replace(/\|/g, '\\|')} | ${row.observed} | ${row.status} |`
      );
    }
  } else {
    lines.push('| Metric | Limit | Status |');
    lines.push('|---|---|---|');
    for (const row of thresholdRows) {
      lines.push(
        `| ${row.metricName.replace(/\|/g, '\\|')} | ${`${row.operator}${row.limit}`.replace(/\|/g, '\\|')} | ${row.status} |`
      );
    }
  }
  lines.push('');

  return lines;
}

const sections = [
  {
    title: 'E2E',
    file: path.join(summaryDir, 'e2e.json'),
    parser: parsePlaywrightReport,
  },
  {
    title: 'Integration',
    file: path.join(summaryDir, 'integration.json'),
    parser: parsePlaywrightReport,
  },
  {
    title: 'API',
    file: path.join(summaryDir, 'api.json'),
    parser: parsePlaywrightReport,
  },
  {
    title: 'Unit',
    file: path.join(summaryDir, 'unit.json'),
    parser: parseVitestJson,
  },
  {
    title: 'A11y',
    file: path.join(summaryDir, 'a11y.json'),
    parser: parsePlaywrightReport,
  },
  {
    title: 'Performance',
    file: path.join(summaryDir, 'performance.json'),
    render: renderK6Summary,
  },
];

const output = [];
output.push('## Test Summary by Suite');
output.push('');

for (const section of sections) {
  const report = readJson(section.file);
  output.push(`### ${section.title}`);
  if (section.render) {
    output.push(...(report ? section.render(report) : ['_No result file found for this suite._', '']));
  } else {
    const rows = report ? section.parser(report) : [];
    output.push(...table(rows));
  }
}

fs.appendFileSync(outFile, `${output.join('\n')}\n`);
console.log('GitHub summary written.');
