#!/usr/bin/env node
'use strict';

// Compares the lodash CVE IDs between two saved `jf audit` simple-json scans.
// Prints: in both, only in before, only in after.
//
// Usage:
//   node docs/tools/lodash_cve_diff.js <before.json> <after.json>
//
// Example:
//   node docs/tools/lodash_cve_diff.js \
//     docs/scans/branch-31d8090/results.json \
//     docs/scans/branch-lodash-fix/results.json
//
// No external dependencies (Node built-ins only).

const fs = require('fs');

const beforePath = process.argv[2];
const afterPath = process.argv[3];

if (!beforePath || !afterPath) {
  console.error('Usage: node lodash_cve_diff.js <before.json> <after.json>');
  process.exit(1);
}

function lodashCves(file) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error('Cannot read/parse scan file: ' + file);
    console.error(err.message);
    process.exit(1);
  }
  const vulns = Array.isArray(data.vulnerabilities) ? data.vulnerabilities : [];
  const set = new Set();
  for (const v of vulns) {
    if (v.impactedPackageName !== 'lodash') continue;
    for (const cve of v.cves || []) {
      if (cve && cve.id) set.add(cve.id);
    }
  }
  return set;
}

const before = lodashCves(beforePath);
const after = lodashCves(afterPath);

const inBoth = [...before].filter((id) => after.has(id)).sort();
const onlyBefore = [...before].filter((id) => !after.has(id)).sort();
const onlyAfter = [...after].filter((id) => !before.has(id)).sort();

function section(title, ids) {
  console.log(title + ' (' + ids.length + '):');
  if (ids.length === 0) {
    console.log('  (none)');
  } else {
    for (const id of ids) console.log('  ' + id);
  }
  console.log('');
}

console.log('before: ' + beforePath + '  (lodash CVEs: ' + before.size + ')');
console.log('after:  ' + afterPath + '  (lodash CVEs: ' + after.size + ')');
console.log('');
section('IN BOTH', inBoth);
section('ONLY IN BEFORE', onlyBefore);
section('ONLY IN AFTER', onlyAfter);
