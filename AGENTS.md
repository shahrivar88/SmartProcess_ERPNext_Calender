# Agent handoff

This repository is the SmartProcess fork of the Frappe app `jalali_shamsi_datepicker`.

Read this file before you edit runtime code, hooks, fixtures, vendors or release metadata. Then load `.agents/skills/jalali-calendar-invariants/SKILL.md`.

## Repository structure

| Path | Role |
|---|---|
| `jalali_shamsi_datepicker/` | Frappe app package |
| `jalali_shamsi_datepicker/hooks.py` | App metadata, fixtures, boot, uninstall, Desk assets |
| `jalali_shamsi_datepicker/boot.py` | Calendar boolean on `bootinfo` |
| `jalali_shamsi_datepicker/uninstall.py` | Deletes only this app's two Custom Fields |
| `jalali_shamsi_datepicker/public/js/jalali_core.js` | Single mapping engine |
| `jalali_shamsi_datepicker/public/js/jalali_persian_date_adapter.js` | Isolated picker constructor |
| `jalali_shamsi_datepicker/public/js/jalali_controls.js` | Frappe Date/Datetime/Time wrap |
| `jalali_shamsi_datepicker/public/js/persian-*.min.js` | Vendored picker; do not upgrade casually |
| `jalali_shamsi_datepicker/tests/` | Node and Playwright tests |
| `docs/` | Durable architecture and operations docs |

GitHub repository name: `SmartProcess_ERPNext_Calender`. App directory name must be `jalali_shamsi_datepicker`.

## Commands

```bash
npm ci
npm run test:unit
npm run test:browser
npm test
npm run test:docs
npm run test:pack
```

Playwright uses `Asia/Tehran`, `UTC` and `America/New_York`. Set `PLAYWRIGHT_CHANNEL=msedge` only when you want a system Edge browser.

Bench commands run on the site host or inside the Docker `backend` container. Always pass `--site`.

## Architectural invariants

- Stored `Date` / `Datetime` values are Gregorian.
- Jalali is display and input only.
- Supported Jalali years are 1200 to 1599. Gregorian bounds are 1821-03-21 to 2221-03-20.
- `jalali_core.js` is the only mapping engine.
- The picker uses an isolated constructor. Do not patch `persianDate.prototype` globally.
- Do not edit Frappe or ERPNext core.
- Do not add Python monkey patches, `override_whitelisted_methods`, `ignore_permissions` or business-data SQL.
- Uninstall may delete only `custom_enable_shamsi_jalali_calendar` and the deprecated `custom_date_storage_format`.

## Frappe compatibility

Verified against Frappe 16.35 and ERPNext 16.35.0. Do not claim other major versions.

Version-sensitive Desk assumptions live in the header of `jalali_controls.js`.

## Security boundaries

- No secrets in the app.
- Fixture scope stays one System Settings Check.
- User-facing HTML must stay escaped.
- Vendor updates are a compatibility project, not a routine dependency bump.

## Test expectations

Do not claim a suite passed unless you ran it. A targeted rerun does not replace `npm test`.

After runtime JS or Python changes, run Node tests, Playwright, the exhaustive mapping coverage already in `jalali_engine.test.js`, and DST tests.

## Forbidden operations

- Edit `main` unless the user asked for a merge
- Create a GitHub Release or release tag
- Bump `1.6.3` unless the user asked
- Deploy or migrate an operational site
- Use an operational site as a disposable test site
- Force-push
- Change `LICENSE` copyright

## Release gates

Documentation, CI and packaging readiness are not a production release. Do not write READY FOR RELEASE unless an explicit later phase verifies CI, clean install, upgrade and uninstall on a disposable site.

## Production deployment

Production work needs explicit user approval. Before `bench migrate`, review every pending patch from every installed app. See [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md).
