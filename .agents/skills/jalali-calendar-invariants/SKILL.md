---
name: jalali-calendar-invariants
description: Enforces SmartProcess Jalali datepicker invariants for this repository. Use when editing jalali_shamsi_datepicker, jalali_core, the persian-date adapter, Date/Datetime controls, fixtures, uninstall, patches, vendors, tests, CI, or a Frappe 16 Desk calendar change.
---

# Jalali calendar invariants

Load this skill before changing runtime JS, Python, fixtures or vendors in this repo.

## Storage

- `Date` stays `YYYY-MM-DD`.
- `Datetime` stays `YYYY-MM-DD HH:mm:ss` in the system timezone.
- Never write a Jalali string into a Frappe Date or Datetime field.

## Range

- Accepted Jalali years are 1200 to 1599.
- Matching Gregorian bounds are 1821-03-21 to 2221-03-20.
- Values outside that range stay Gregorian. Do not coerce them.

## Single engine

- `jalali_core.js` is the only mapping implementation.
- Do not add a second converter and do not fall back to vendor leap tables after a failed integer conversion.

## Isolated picker

- Use `createIsolatedConstructor` / `attachToPicker`.
- Do not assign onto `persianDate.prototype`.
- A failed vendor inspect must not leave a half-patched factory.

## Frappe core

- Do not edit `frappe` or `erpnext` source.
- Do not add `ignore_permissions`, `override_whitelisted_methods`, `doc_events` or business SQL.
- Uninstall may delete only this app's two System Settings Custom Fields.

## Compatibility

- Claim Frappe 16.35 only unless you re-verify.
- Re-read the version-sensitive list in `jalali_controls.js` before changing the wrapper.

## Tests

After a mapping, picker, timezone or control change:

1. `npm run test:unit`
2. `npm run test:browser` in Tehran, UTC and New York
3. Keep the exhaustive mapping coverage in `jalali_engine.test.js`

Do not mark a suite passed from a targeted subset.

## Sites

- Verify Desk only on a disposable site.
- Do not use an operational site as a sandbox.
- Production `bench migrate` needs a review of every pending patch from every installed app.

## Release

- Do not bump `1.6.2`, tag, or create a GitHub Release unless asked.
- Do not auto-upgrade `persian-date` or `persian-datepicker`.
- Do not write READY FOR RELEASE unless a later phase verified CI, clean install, upgrade and uninstall.
