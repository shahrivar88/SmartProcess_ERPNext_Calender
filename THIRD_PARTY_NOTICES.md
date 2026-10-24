# Third-party notices

This file records provenance checked on 24 October 2026. Vendor files were not upgraded in this phase.

## Upstream application

| Field | Value |
|---|---|
| Project | jalali_shamsi_datepicker |
| Repository | https://github.com/nidyasoft/jalali_shamsi_datepicker |
| License | MIT |
| LICENSE copyright | Copyright (c) 2025 nidyasoft |
| Publisher in hooks | Ideenemium / ideenemium@gmail.com |
| This fork | https://github.com/shahrivar88/SmartProcess_ERPNext_Calender |

The legal relationship between `nidyasoft` and `Ideenemium` is not independently verified. Both names come from upstream metadata. This fork does not replace the LICENSE copyright holder.

## persian-date 1.1.0

| Field | Value |
|---|---|
| Upstream | https://github.com/babakhani/PersianDate |
| Docs | http://babakhani.github.io/PersianWebToolkit/docs/persian-date/ |
| Version | 1.1.0 |
| License | MIT |
| Copyright | Reza Babakhani |
| File | `jalali_shamsi_datepicker/public/js/persian-date.min.js` |
| SHA256 | `18FF658C13ACE205C105C36B7311B48D0A75A5DF53AF5085FA4DF259E7C0DFD8` |
| Provenance | Matches `https://unpkg.com/persian-date@1.1.0/dist/persian-date.min.js` |
| Usage | Vendor Date object used by the picker |
| Why kept | The isolated adapter binds this constructor to `jalali_core` |
| Maintenance | Last npm release is old. Do not auto-upgrade |

## persian-datepicker 1.2.0

| Field | Value |
|---|---|
| Upstream | https://github.com/babakhani/pwt.datepicker |
| Docs | http://babakhani.github.io/PersianWebToolkit/docs/datepicker |
| Version | 1.2.0 |
| License | MIT |
| Copyright | Reza Babakhani |
| JS file | `jalali_shamsi_datepicker/public/js/persian-datepicker.min.js` |
| JS SHA256 | `2B52DDD4109E2BB99BEE76462F9DA5603B91910FCFF28F8A9452D3D636B184B2` |
| CSS file | `jalali_shamsi_datepicker/public/css/persian-datepicker.min.css` |
| CSS SHA256 | `C78EB6DF1D804ABEC0C2785CE7171F3F41BEC878A89BB7CCCC8E4EACE6E7F954` |
| Provenance | Does **not** match stock npm 1.2.0 from unpkg. Stock JS SHA256 is `F4F5EC7234DE37A3F1480F13E4C08A5581DC73F94D99DF3B0BC3AAD759201BA6`. Stock CSS SHA256 is `8F1698C33C34C3B4191A2EF65AE717CB9740443D41BBB4EC904E072BAC3B68FE`. |
| Local JS changes | `managedInput` early return, monotonic container IDs, namespaced document clicks, `destroy()` cleanup. Calendar math was not rewritten. See `POPUP_FIX_REPORT.md`. |
| Local CSS changes | Difference vs stock npm is recorded. Do not treat the CSS as bit-identical upstream. |
| Usage | Desk picker UI |
| Why kept | Frappe controls depend on this bundled API surface |
| Maintenance | Unmaintained. Do not auto-upgrade |

## jalali_core conversion

| Field | Value |
|---|---|
| Algorithm | jalaali-js `BREAKS` table |
| Upstream | https://github.com/jalaali/jalaali-js |
| License | MIT |
| File | `jalali_shamsi_datepicker/public/js/jalali_core.js` |
| Usage | The only Jalali to Gregorian mapping engine |
| Why kept | Vendor astronomical and algorithmic calendars disagree with this table on known leap days |

## Development dependencies

From `package.json` / `package-lock.json`. Runtime Desk uses Frappe jQuery, not this test package.

| Package | Version | License | Role |
|---|---|---|---|
| `@playwright/test` | 1.58.2 | Apache-2.0 | Browser tests |
| `jquery` | 3.7.1 | MIT | Node tests that load the vendor picker |

Python packaging uses `setuptools` and declares `flit_core` in `pyproject.toml`. There is no extra runtime Python dependency.

## Scanner coverage of vendors

OSV-Scanner and npm audit see lockfiles. They do not inventory these vendored files. Trivy filesystem scans do not replace a manual vendor review. Semgrep on minified vendor JavaScript is report-only.
