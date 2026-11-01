#!/usr/bin/env node
'use strict';

// Prints a table of the "Applicable" findings from a saved `jf audit`
// simple-json scan file.
//
// Usage:
//   node docs/tools/applicable_table.js [path-to-results.json]
//
// Defaults to the original-fork scan when no path is given.
// No external dependencies (Node built-ins only).

const fs = require('fs');
const path = require('path');

const DEFAULT_SCAN = path.join(
  'docs',
  'scans',
  'original-be7a62e',
  'results.json'
);

const file = process.argv[2] || DEFAULT_SCAN;

let raw;
try {
  raw = fs.readFileSync(file, 'utf8');
} catch (err) {
  console.error('Cannot read scan file: ' + file);
  console.error(err.message);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error('Scan file is not valid JSON: ' + file);
  console.error(err.message);
  process.exit(1);
}

const vulns = Array.isArray(data.vulnerabilities) ? data.vulnerabilities : [];

function cvssScore(cve) {
  if (cve && cve.cvssV3 !== undefined && cve.cvssV3 !== '') {
    return cve.cvssV3 + ' (v3)';
  }
  if (cve && cve.cvssV2 !== undefined && cve.cvssV2 !== '') {
    return cve.cvssV2 + ' (v2)';
  }
  return '-';
}

const rows = [];
for (const v of vulns) {
  if (v.applicable !== 'Applicable') continue;
  const pkg = v.impactedPackageName || '-';
  const ver = v.impactedPackageVersion || '-';
  const sev = v.severity || '-';
  const jfrog =
    (v.jfrogResearchInformation && v.jfrogResearchInformation.severity) || '-';
  const appl = v.applicable || '-';
  const cves = Array.isArray(v.cves) && v.cves.length ? v.cves : [null];
  for (const cve of cves) {
    rows.push({
      package: pkg,
      version: ver,
      cve: (cve && cve.id) || '(no CVE)',
      cvss: cvssScore(cve),
      severity: sev,
      jfrogResearch: jfrog,
      applicability: appl,
    });
  }
}

const columns = [
  { key: 'package', title: 'PACKAGE' },
  { key: 'version', title: 'VERSION' },
  { key: 'cve', title: 'CVE' },
  { key: 'cvss', title: 'CVSS' },
  { key: 'severity', title: 'SEVERITY' },
  { key: 'jfrogResearch', title: 'JFROG RESEARCH' },
  { key: 'applicability', title: 'APPLICABILITY' },
];

const widths = {};
for (const col of columns) {
  widths[col.key] = col.title.length;
  for (const r of rows) {
    widths[col.key] = Math.max(widths[col.key], String(r[col.key]).length);
  }
}

function fmtRow(cells) {
  return columns
    .map((col) => String(cells[col.key]).padEnd(widths[col.key]))
    .join('  ');
}

console.log('Scan file: ' + file);
console.log('Applicable findings: ' + rows.length);
console.log('');
console.log(fmtRow(Object.fromEntries(columns.map((c) => [c.key, c.title]))));
console.log(
  columns.map((col) => '-'.repeat(widths[col.key])).join('  ')
);
for (const r of rows) {
  console.log(fmtRow(r));
}
