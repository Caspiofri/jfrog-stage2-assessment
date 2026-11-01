# Stage 2 — scan results summary

All scans: `jf audit --server-id=trial --sca --vuln` (jf 2.129.0) against **trialc914kt**,
`--format=simple-json` for the data below and `--extended-table` for the `table.txt` beside each.
Advanced Security (Contextual Analysis) is entitled on the trial, so every run also produced
applicability. No license/eval banner appeared in any run.

## Definition of "finding"
One finding = **one entry in the scan's `vulnerabilities` list** (`.vulnerabilities[]` in the
simple-json output; one row of the `--extended-table`). This equals the scanner's own
`Found N SCA vulnerabilities` count (original **80**, pre-fix **93**, post-fix **86** — see each
`stderr.log`). A vulnerability affecting two packages appears as two entries; a vulnerability with
no CVE id (e.g. mongodb `XRAY-90643`) is still one entry. The same definition is used for all scans.

## The scans
| Label | What | Git | Folder |
|---|---|---|---|
| (a) | SCA-only baseline (totals + severity only, applicability column ignored) | be7a62e | `original-be7a62e/` |
| (b) | Contextual Analysis, original fork | be7a62e | `original-be7a62e/` |
| (c) | Branch before the lodash fix | 31d8090 | `branch-31d8090/` |
| (d) | Branch after the lodash fix | 7c732a2 | `branch-lodash-fix/` |

Note: no separate "SCA-only" scan file exists. (a) and (b) are the **same** original-fork scan
reported two ways — (a) is its SCA layer (severity only), (b) adds the applicability breakdown.

## 1–2. Totals and severity (top-level `severity` field)
| Scan | n | Critical | High | Medium | Low | Unknown |
|---|---|---|---|---|---|---|
| (a) SCA-only, original (be7a62e) | 80 | 13 | 35 | 29 | 3 | 0 |
| (b) CA, original (be7a62e) | 80 | 13 | 35 | 29 | 3 | 0 |
| (c) branch pre-fix (31d8090) | 93 | 13 | 41 | 36 | 3 | 0 |
| (d) branch post-fix (7c732a2) | 86 | 12 | 39 | 32 | 3 | 0 |

## 3. Applicability (b, c, d)
| Status | (b) original | (c) pre-fix | (d) post-fix |
|---|---|---|---|
| Applicable | 3 | 3 | **1** |
| Not Applicable | 40 | 51 | 48 |
| Missing Context | 7 | 7 | 7 |
| Not Covered | 30 | 32 | 30 |
| Undetermined | 0 | 0 | 0 |
| none | 0 | 0 | 0 |

### Severity × applicability cross-tables
Columns: Applicable | Not Applicable | Missing Context | Not Covered (Undetermined/none are 0 everywhere).

**(b) CA, original fork (be7a62e), n=80**
| Severity | Applicable | Not Applicable | Missing Context | Not Covered |
|---|---|---|---|---|
| Critical | 0 | 9 | 2 | 2 |
| High | 1 | 27 | 5 | 2 |
| Medium | 2 | 3 | 0 | 24 |
| Low | 0 | 1 | 0 | 2 |

**(c) branch pre-fix (31d8090), n=93**
| Severity | Applicable | Not Applicable | Missing Context | Not Covered |
|---|---|---|---|---|
| Critical | 0 | 9 | 2 | 2 |
| High | 1 | 33 | 5 | 2 |
| Medium | 2 | 8 | 0 | 26 |
| Low | 0 | 1 | 0 | 2 |

**(d) branch post-fix (7c732a2), n=86**
| Severity | Applicable | Not Applicable | Missing Context | Not Covered |
|---|---|---|---|---|
| Critical | 0 | 8 | 2 | 2 |
| High | 1 | 31 | 5 | 2 |
| Medium | 0 | 8 | 0 | 24 |
| Low | 0 | 1 | 0 | 2 |

## 4. Findings that come only from bcrypt 5's build tooling
"bcrypt build-tool-only" = every impact path for the finding passes through `bcrypt`
(i.e. `@mapbox/node-pre-gyp` and everything under it — `tar`, `node-fetch`, `minimatch`, …).
These are not part of the original app and should be excluded from the app's count.

| Scan | n (total) | bcrypt build-tool-only | app-only count (n − bcrypt) |
|---|---|---|---|
| (c) pre-fix (31d8090) | 93 | 13 | 80 |
| (d) post-fix (7c732a2) | 86 | 13 | 73 |

So the original app's own findings are **80** (matches the fork), and the fix removed **7**
of them (80 → 73), all lodash. bcrypt tooling contributes a constant 13.

## 5. The three lodash CVEs still present on 4.17.21 (scan d)
These are the same three CVEs that were on 4.17.4; they are not yet fixed upstream in 4.17.21,
so they re-key to the new version — they are not newly introduced.

| CVE | package@version | severity | applicability |
|---|---|---|---|
| CVE-2025-13465 | lodash@4.17.21 | Medium | Not Covered |
| CVE-2026-2950 | lodash@4.17.21 | Medium | Not Covered |
| CVE-2026-4800 | lodash@4.17.21 | Critical | Not Applicable |

The two **Applicable** lodash CVEs (CVE-2018-16487, CVE-2020-28500) are gone in (d);
Applicable dropped 3 → 1 (only moment CVE-2022-31129 remains, by design).

## 6. Environment
- `jf --version`: **jf version 2.129.0**
- `node --version`: **v22.23.2**
- Commits on `stage2/deps-and-workflow` (origin/main..HEAD):
  - `7c732a2` [Fix] deps: upgrade lodash to 4.17.21 (CVE-2018-16487)
  - `31d8090` [Fix] app: start server only when run directly, so tests exit
  - `558f4a0` [Fix] deps: pin bcrypt 5.1.1 for node:14
  - `7519dd3` [Update] workflow: set jt-docker/jt-npm repos, version tag, amd64 only
  - `72964a8` [New] deps: add bcrypt and validator, commit package-lock.json

## Proof of concept — real HTTP, before vs after
The prototype-pollution PoC was a **real HTTP request** (`curl` to a local instance),
not an in-process script:

```
PUT /api/users/1  Content-Type: application/json
{"username":{"__proto__":{"pollutedA":true}}}
```

**Before the fix (lodash 4.17.4)** — server-side log (temporary debug line in the request
logger, reverted afterwards; `curl` to 127.0.0.1:3000):
```
GET /api/users/1   ({}).pollutedA = undefined   own 'pollutedA' = false
PUT /api/users/1   ({}).pollutedA = undefined   own 'pollutedA' = false
GET /api/users/2   ({}).pollutedA = true        own 'pollutedA' = true   <-- Object.prototype polluted
```

**After the fix (lodash 4.17.21)** — same `curl` request to a local instance
(127.0.0.1:3998; the debug marker came from a scratch wrapper that mounts the real
`src/index.js` app, so no repo file was changed):
```
GET /health        ({}).pollutedA = undefined   own 'pollutedA' = false
PUT /api/users/1   ({}).pollutedA = undefined   own 'pollutedA' = false
GET /api/users/2   ({}).pollutedA = undefined   own 'pollutedA' = false   <-- no pollution
```

Impact (unchanged wording): attacker-controlled modification of shared process state
(`Object.prototype`), affecting all requests until restart, via the unauthenticated
`PUT /api/users/:id` route. No auth bypass, data theft, or RCE was demonstrated.
