# Release process

This document is the release checklist. Completing documentation and CI is not a GitHub Release.

## Do not do in a documentation phase

- Merge to `main` unless asked
- Create a git tag
- Create a GitHub Release
- Bump `1.6.2`
- Deploy

## Before a future release candidate

1. `LICENSE` still says Copyright (c) 2025 nidyasoft.
2. Version is identical in `__init__.py`, `pyproject.toml` and `package.json`.
3. `npm test` passes.
4. `npm run test:docs` and `npm run test:pack` pass.
5. GitHub Actions Test and Security workflows are green on the release commit.
6. A disposable site can install from the built sdist or from git.
7. Upgrade and uninstall are checked on that disposable site.
8. Vendor hashes in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) still match the files.

## Packaging

The repo has dual packaging:

- `setup.py` + `MANIFEST.in` for setuptools / bench
- `pyproject.toml` with `flit_core` for the PEP 517 backend

`scripts/verify_release_package.py` builds the setuptools sdist and checks required files. It does not remove flit. GitHub-hosted Python 3.12 does not ship setuptools, so CI installs it before this script.

## Scanners

| Check | What it covers | What it does not cover |
|---|---|---|
| Gitleaks | Secrets in git history | Vendor CVE review |
| OSV-Scanner | Lockfiles and manifests | Vendored min.js / min.css |
| Trivy fs | Lockfiles, secrets, misconfig | A complete vendor CVE audit |
| Semgrep `.semgrep.yml` | First-party forbidden APIs | Vendor maintenance |
| Semgrep community | First-party Python and JS | Required fail on minified vendor |
| CodeQL | Python and JavaScript extraction | Reliable analysis of minified vendor |

## Dependency updates

Dependabot may open PRs for npm test dependencies and GitHub Actions. Do not auto-merge `persian-date` or `persian-datepicker` changes. Those files are vendored.
