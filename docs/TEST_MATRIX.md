# Test matrix

## Local commands

| Command | What it covers |
|---|---|
| `npm run test:unit` | Node tests in `jalali_shamsi_datepicker/tests/*.test.js` |
| `npm run test:browser` | Playwright projects Tehran, UTC, New York |
| `npm test` | Unit tests, then Playwright |
| `npm run test:docs` | Relative links and required names |
| `npm run test:pack` | setuptools sdist contents |
| `npm run test:python` | `jalali.py` mapping and naming-token unit tests |

## Node files

| File | Focus |
|---|---|
| `jalali_core.test.js` | Mapping, range, parse, invalid input |
| `jalali_engine.test.js` | Isolated adapter vs core, including the 146097-day span |
| `jalali_leap.test.js` | Leap Esfand |
| `jalali_controls.test.js` | Control wrap, formatters, reject path |
| `jalali_isolation.test.js` | No global vendor contamination |
| `jalali_week_dst.test.js` | Civil-day weeks in DST |
| `uninstall.test.js` | Custom Field deletion scope |
| `metadata.test.js` | Version, hooks, fixtures, docs, license |
| `jalali_naming.test.js` | Python converter equals `jalali_core.js`; naming hook tokens |

## Playwright files

| File | Focus |
|---|---|
| `engine.spec.js` | Picker engine and isolation in the browser |
| `popup.spec.js` | Popup geometry and selection |
| `stored_value_layout.spec.js` | Helper layout and disabled mode |

Each file runs in `Asia/Tehran`, `UTC` and `America/New_York`.

## CI

`.github/workflows/test.yml` runs the same Node and Playwright suites on `ubuntu-latest` with Playwright Chromium. `.github/workflows/security.yml` runs scanners.

A workflow file in git is not a passed check. Read the GitHub Actions run.
