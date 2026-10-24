# Changelog

This file records published app versions. Historical entries for `1.6.2` and earlier stay as written.

## 1.6.3

Prepared on branch `hardening/jalali-production-release`. A GitHub Release exists only after a later authorized publication step.

This version hardens Jalali display and input on Frappe 16.35. Stored `Date` and `Datetime` values stay Gregorian. No business-data migration is required.

### Fixed

- Bind `persian-datepicker` to `jalali_core` so leap days match the mapping engine.
- Isolate the picker constructor so global `persianDate` consumers stay unchanged.
- Keep week boundaries on civil days across DST instead of shifting by `864e5` milliseconds.
- Reject invalid Jalali dates and clocks without rolling them to another day.
- Delete leftover `tabSingles` rows for this app's two System Settings fields on uninstall so a stale Check of `1` cannot re-enable the calendar after reinstall.

### Tests

- Add exhaustive mapping, leap-year, isolation and DST week coverage.
- Run the 12-cycle picker open/close leak checks inside one page evaluate so Edge under full-suite load is not timed out by CDP round-trips.
- Assert package versions with a literal dotted triple instead of a `String.replace` regex.

### Documentation and CI

- Add bilingual README, architecture docs, third-party notices, agent handoff and Security CI.
- Compatibility claim stays Frappe 16.35 and ERPNext 16.35.0.

### Limits

- `DateRange` stays standard Gregorian.
- Jalali years outside 1200 to 1599 stay Gregorian.
- LICENSE copyright remains Copyright (c) 2025 nidyasoft.

## 1.6.2

- Simplify the compact 8-digit Jalali parser.
- Remove `ignore_permissions` from uninstall.
- Point package URLs at this GitHub fork.

## 1.6.1

- Fix compact Jalali input.
- Fix stored-value helper layout.

## 1.6.0

- Theme the popup with site CSS tokens.
- Harden RTL/LTR and Datetime handling.
- Add a leap-year and timezone-safe core with a test suite.

## 1.5.2

- Re-trim weeks after 6-row months by revealing rows before navigation.

## 1.5.1

- Shrink 5-week months.
- Keep the picker under the page head.

## 1.5.0

- Trim empty weeks.
- Center the picker on the field.
- Close on outside click.

## 1.3.0

- Show the raw stored Gregorian value under date fields.
- Theme the picker with site styles.

## 1.2.0

- Use Jalali as a display and input layer over standard Date and Datetime controls.

Older history lives in git. Upstream starting point: [nidyasoft/jalali_shamsi_datepicker](https://github.com/nidyasoft/jalali_shamsi_datepicker).
