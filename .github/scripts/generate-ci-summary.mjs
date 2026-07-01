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

function parseK6Summary(report) {
  const rows = [];
  const runMs = report?.state?.testRunDurationMs;

  function asItems(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  }

  function walkGroup(group) {
    for (const check of asItems(group?.checks)) {
      const fails = Number(check.fails ?? 0);
      rows.push({
        testCase: `check: ${String(check.path || check.name || 'unknown').replace(/\|/g, '\\|')}`,
        status: fails > 0 ? 'failed' : 'passed',
        duration: fmtMs(runMs),
        retries: 0,
      });
    }

    for (const child of asItems(group?.groups)) {
      walkGroup(child);
    }
  }

  walkGroup(report?.root_group ?? {});

  return rows;
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
    parser: parseK6Summary,
  },
];

const output = [];
output.push('## Test Summary by Suite');
output.push('');

for (const section of sections) {
  const report = readJson(section.file);
  const rows = report ? section.parser(report) : [];
  output.push(`### ${section.title}`);
  output.push(...table(rows));
}

fs.appendFileSync(outFile, `${output.join('\n')}\n`);
console.log('GitHub summary written.');
