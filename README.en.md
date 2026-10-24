# Jalali Shamsi Datepicker

[متن فارسی](README.md)

A Frappe app for Jalali display and input on `Date` and `Datetime` fields. The stored model value stays the standard Frappe Gregorian value.

This repository is a SmartProcess-maintained fork. Upstream project: [nidyasoft/jalali_shamsi_datepicker](https://github.com/nidyasoft/jalali_shamsi_datepicker). The `LICENSE` file still carries Copyright (c) 2025 nidyasoft.

- Current version: `1.6.2`
- Frappe app name: `jalali_shamsi_datepicker`
- GitHub repository name: `SmartProcess_ERPNext_Calender`

## Problem

Iranian users need Jalali dates in Desk. ERPNext and Frappe store and compute Gregorian dates. This app changes display and input only.

## Features

- Jalali display and input for `Date` and `Datetime` in forms, child tables, Quick Entry, dialogs, list filters and report filters
- Jalali read-only, list and report formatters
- Persian, Arabic or Latin digits, including compact 8-digit Jalali input
- Invalid Jalali dates are rejected and the previous value is kept
- Gregorian typing and Frappe expressions such as `Today` and `+1d` still work
- `Datetime` keeps Frappe time, seconds and timezone conversion
- Raw stored Gregorian text under the field, with no extra form height
- `Time` uses this app picker only; the value stays `HH:mm:ss`
- One switch in **System Settings**

## Unsupported

- `DateRange` stays standard Gregorian
- Jalali strings are never stored in `Date` or `Datetime`
- Major versions other than Frappe 16 are untested
- No published screenshots exist

## Compatibility

| Item | Status |
|---|---|
| Frappe | Tested on version 16. DOM and CSS checked on **16.35**. |
| ERPNext | Checked on **16.35.0** on an isolated validation site. The app depends only on `frappe`. |
| Other major versions | Not claimed |

See [docs/FRAPPE_COMPATIBILITY.md](docs/FRAPPE_COMPATIBILITY.md).

## Requirements

- Frappe 16 on a bench or in Docker
- A Desk browser
- Administrator access for install, `migrate` and the calendar switch
- No extra Python runtime dependency; the bench provides Frappe

## Calendar range

- Supported Jalali range: `1200/01/01` to `1599/12/29`
- Matching Gregorian range: `1821-03-21` to `2221-03-20`
- Dates outside this range are not rewritten into a wrong Jalali value

## Gregorian storage

`Date` stays `YYYY-MM-DD`. `Datetime` stays `YYYY-MM-DD HH:mm:ss` in the system timezone. No patch rewrites business records.

See [docs/DATA_INTEGRITY.md](docs/DATA_INTEGRITY.md).

## Installation

The GitHub repository name is not the Frappe app name. Clone into `jalali_shamsi_datepicker`.

```bash
cd apps
git clone https://github.com/shahrivar88/SmartProcess_ERPNext_Calender.git jalali_shamsi_datepicker
cd ..
bench setup requirements
bench --site SITE install-app jalali_shamsi_datepicker
bench --site SITE migrate
bench --site SITE clear-cache
```

Replace `SITE` with your site name. In Docker, run these commands inside the `backend` container.

Full guide: [docs/INSTALLATION.md](docs/INSTALLATION.md)

## Configuration

1. Open **System Settings**.
2. Enable `Enable Shamsi (Jalali) Calendar`.
3. Refresh the browser once.

Field name: `custom_enable_shamsi_jalali_calendar`. Default is off. Do not change `date_format` for this app.

When the switch is off, controls keep standard Frappe behavior.

## Usage

- After enable, `Date` and `Datetime` show Jalali and open the Jalali picker on focus.
- You can type a date or clear the field.
- These three inputs are 3 Mehr 1405 and store `2026-09-25`:

| Input | Meaning | Stored value |
|---|---|---|
| `14050703` | `1405/07/03` | `2026-09-25` |
| `1405/07/03` | `1405/07/03` | `2026-09-25` |
| `۱۴۰۵۰۷۰۳` | `1405/07/03` | `2026-09-25` |

An 8-digit value whose first four digits are a Jalali year from `1200` to `1599` is always read as Jalali `YYYYMMDD`. A day that does not exist is rejected. 6-digit or 7-digit input is not guessed.

If the site `date_format` is `dd-mm-yyyy` or `mm-dd-yyyy`, type Gregorian dates with separators. An 8-digit value that starts with `1200` to `1599` is treated as Jalali.

## Date / Datetime / Time behavior

- `Date`: Jalali display and input; Gregorian storage
- `Datetime`: same Jalali date plus Frappe time and seconds
- `Time`: this app time picker; standard value
- `DateRange`: unchanged

Invalid Jalali dates and invalid `Date` / `Datetime` clocks are not passed to Frappe.

## Timezones

Timezone conversion uses the Frappe path once. Browser tests run in `Asia/Tehran`, `UTC` and `America/New_York`.

## Upgrade

```bash
cd apps/jalali_shamsi_datepicker
git pull
cd ../..
bench --site SITE migrate
bench --site SITE clear-cache
```

Before `bench migrate` on an operational site, review every pending patch from every installed app.

See [docs/UPGRADE.md](docs/UPGRADE.md).

## Uninstall

```bash
bench --site SITE uninstall-app jalali_shamsi_datepicker
```

Uninstall removes only this app's two Custom Fields. Business dates stay.

See [docs/UNINSTALL.md](docs/UNINSTALL.md).

## Rollback limits

Turn the switch off and refresh Desk to restore standard controls. Uninstall has the same display effect. Date values do not need data rollback because Jalali strings were never stored. File rollback is a normal git checkout.

See [docs/ROLLBACK.md](docs/ROLLBACK.md).

## Troubleshooting

- The switch is on but the picker is Gregorian: refresh the page and clear cache.
- Input is rejected: the Jalali day does not exist or is out of range.
- The helper under the field differs from the picker: the helper is the stored Gregorian model value.

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Common questions

**Are dates stored as Jalali?** No.

**Does the app edit Frappe or ERPNext core?** No.

**Does it work on Frappe 15?** Untested. Not claimed.

**Can Dependabot upgrade the calendar vendors?** No. A `persian-date` or `persian-datepicker` change needs a compatibility review and full regression.

## Security and privacy

The app stores no secrets. `bootinfo` exposes one calendar boolean. User-facing error text is escaped. See [SECURITY.md](SECURITY.md).

## License and attribution

MIT. The upstream license notice is kept: Copyright (c) 2025 nidyasoft.

`hooks.py` still lists `Ideenemium` as publisher. The legal relationship between `nidyasoft` and `Ideenemium` is not independently verified beyond upstream metadata.

Third-party libraries: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)

## Support and contribution

Open bugs and proposals in [Issues](https://github.com/shahrivar88/SmartProcess_ERPNext_Calender/issues).

- [SUPPORT.md](SUPPORT.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CHANGELOG.md](CHANGELOG.md)
- [AGENTS.md](AGENTS.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/TEST_MATRIX.md](docs/TEST_MATRIX.md)
- [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md)
- [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)

## Tests

```bash
npm ci
npm run test:unit
npx playwright install chromium
npm run test:browser
npm test
```

On Windows with a system browser:

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
npm test
```

`npm test` runs the Node tests, then Playwright in all three timezone projects.
