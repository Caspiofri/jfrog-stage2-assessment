# JFrog Stage 2 — Assessment & Verification

This directory contains the supporting materials for the JFrog Stage 2 take-home assignment, performed on the User Management Service.

The work covers dependency vulnerability assessment, contextual analysis, remediation, verification, and Docker artifact publishing.

## Deliverables

- **Vulnerability assessment:** Identification and analysis of two High Applicable vulnerabilities using JFrog Xray.
- **Remediation:** Dependency upgrade and application-level protections against prototype pollution.
- **Verification:** Before/after vulnerability scans, reproducible proof-of-concept scripts, and recorded test results.
- **Artifact publishing:** Docker image and JFrog Build Info, with a starter GitHub Actions workflow at `.github/workflows/publish-build.yml`.

## Supporting Files

| Directory | Purpose |
|---|---|
| `scans/` | Original, pre-fix, and post-fix scan outputs and comparison |
| `poc/` | Reproduction scripts and usage instructions |
| `evidence/` | Recorded exploitability and remediation verification |
| `tools/` | Utilities for analyzing the raw scan results |

## Verification

Run the application test suite from the repository root:

```bash
npm test
```

For vulnerability reproduction, see [PoC instructions](poc/README.md).

For scan results, see [Scan Summary](scans/scan_results_summary.md).

The publishing workflow is located at [publish-build.yml](../.github/workflows/publish-build.yml).
