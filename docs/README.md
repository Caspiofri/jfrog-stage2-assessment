# JFrog Stage 2 — Assessment & Verification

This directory contains the supporting artifacts for the JFrog Stage 2 take-home assignment, performed on the User Management Service.

The materials document the vulnerability assessment, contextual analysis, remediation, and verification process.

The full description of the work, answering each requirement of the assignment, is in [docs/stage2-report.md](stage2-report.md).

## Deliverables

- **Vulnerability assessment:** Identification and analysis of two High Applicable vulnerabilities using JFrog Xray.
- **Remediation:** Lodash dependency upgrade and application-level protections against prototype pollution.
- **Verification:** Before/after scans, reproducible proof-of-concept tests, and recorded results.
- **Artifact publishing:** The image and Build Info were published with the JFrog CLI. The starter [GitHub Actions workflow](../.github/workflows/publish-build.yml) was adapted but not used for this publish.

## Evidence Guide

In `commands.txt`, the local working directory is replaced with `<repo-root>` or `<scratchpad>`. Nothing else is changed. Some screenshots show the earlier folder `docs/stage2/`; those files are now under `docs/evidence/` and `docs/scans/`.

### `scans/` — JFrog Xray Results

Contains three scan snapshots used to establish the original vulnerability baseline and verify remediation.

| Location | Description |
|---|---|
| `original-be7a62e/` | Original application baseline before dependency fixes — 80 findings |
| `branch-31d8090/` | Working-branch baseline before Lodash remediation — 93 findings |
| `branch-lodash-fix/` | Scan after upgrading Lodash to 4.17.21 — 86 findings |
| [scan_results_summary.md](scans/scan_results_summary.md) | Comparison of findings, applicability classifications, and remediation results |

Each scan directory contains:

| File | Purpose |
|---|---|
| `results.json` | Machine-readable vulnerability findings, including contextual analysis |
| `table.txt` | Human-readable scanner output for quick inspection |
| `stderr.log` | Scanner execution summary, including reported finding counts |
| `commands.txt` | Scan commands, Git revision, execution date, and CLI version |

The comparable working-branch scans show a reduction from **93 to 86 findings**, including the removal of seven Lodash findings.

### `poc/` — Reproduction Scripts

Contains scripts used to investigate exploitability and validate the remediation.

| File | Purpose |
|---|---|
| `pollute_probe.js` | Tests prototype pollution through the user-update endpoint |
| `moment_redos.js` | Measures Moment.js processing time for crafted date inputs |
| `persistence_probe.js` | Checks whether prototype pollution persists across requests |
| [README.md](poc/README.md) | Execution instructions and expected behavior |

### `evidence/` — Verification Outputs

Contains recorded observations from the vulnerability investigation.

| File | Purpose |
|---|---|
| [poc_results.md](evidence/poc_results.md) | Before/after PoC test matrix and regression test results |
| [merge_route.md](evidence/merge_route.md) | Source excerpts documenting the vulnerable update logic and remediation |
| `exploitability/lodash-test-proto.txt` | Prototype pollution test using the `__proto__` payload |
| `exploitability/lodash-test-ctor.txt` | Prototype pollution test using the `constructor.prototype` payload |
| `exploitability/lodash-persistence.txt` | Persistence test output |
| `exploitability/moment-test.txt` | Moment.js ReDoS timing output |

### `tools/` — Scan Analysis Utilities

Small scripts for independently reproducing the vulnerability comparisons from the saved scan JSON files.

| File | Purpose |
|---|---|
| `applicable_table.js` | Extracts findings marked Applicable |
| `lodash_cve_diff.js` | Compares Lodash CVEs before and after the dependency upgrade |

## Verification

Run the application tests from the repository root:

```bash
npm test
```

To reproduce the vulnerability tests, follow the [PoC instructions](poc/README.md).

To inspect the vulnerability counts and remediation results, start with the [Scan Results Summary](scans/scan_results_summary.md).

The starter publishing workflow is available at [`.github/workflows/publish-build.yml`](../.github/workflows/publish-build.yml).
