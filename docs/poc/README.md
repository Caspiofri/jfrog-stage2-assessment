# Prototype-pollution PoC — `pollute_probe.js`

Faithful, self-contained reproduction of the lodash prototype-pollution PoC
against the app's `PUT /api/users/:id` route.

## What it does

1. `require()`s the target app (`src/index.js`, which exports the Express `app`
   and only calls `listen()` when run directly).
2. Boots it on an **ephemeral `127.0.0.1` port** (no fixed port, no external host).
3. Sends one genuine local HTTP `PUT /api/users/1` with a crafted JSON body.
4. After the response, checks a freshly created `{}` for the injected marker and
   prints whether `Object.prototype` was polluted.

All traffic stays on `127.0.0.1`. The probe itself requires only the Node
built-in `http` module; the target app resolves its own dependencies
(express, lodash, moment, …) from its own `node_modules`.

## Usage

```
node pollute_probe.js <absolute-path-to-app/src/index.js> <form>
```

- `<form>` is `proto` or `ctor` (defaults to `proto`).

## The two payload forms

- `proto` — the existing PoC form:

  ```json
  {"username":{"__proto__":{"polluted_proto":true}}}
  ```

- `ctor` — the `constructor.prototype` form:

  ```json
  {"username":{"constructor":{"prototype":{"polluted_ctor":true}}}}
  ```

Each form uses a distinct marker key (`polluted_proto` / `polluted_ctor`) and
the probe checks the matching key, so the two runs do not interfere.

## Reading the output

- `HTTP status` — the route/middleware response code.
- `({})[marker]` — value seen through a fresh object; `true` means the global
  `Object.prototype` was polluted.
- `RESULT` — `POLLUTED` or `not polluted`.

## Example

```
node docs/poc/pollute_probe.js "$(pwd)/src/index.js" proto
node docs/poc/pollute_probe.js "$(pwd)/src/index.js" ctor
```

A fresh Node process is used per run, so a pollution from one form never leaks
into the next.
