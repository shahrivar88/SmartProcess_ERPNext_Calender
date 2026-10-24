# Changelog

This file records published app versions and later hardening on the same version number. Version `1.6.2` is not bumped in this document.

## Unreleased

Hardening on branch `hardening/jalali-production-release` after `1.6.2`.

### Fixed

- Bind `persian-datepicker` to `jalali_core` so leap days match the mapping engine.
- Isolate the picker constructor so global `persianDate` consumers stay unchanged.
- Keep week boundaries on civil days across DST instead of shifting by `864e5` milliseconds.
- Delete leftover `tabSingles` rows for this app's two System Settings fields on uninstall so a stale Check of `1` cannot re-enable the calendar after reinstall.

### Tests

- Run the 12-cycle picker open/close leak checks inside one page evaluate so Edge under full-suite load is not timed out by CDP round-trips.

### Documentation

- Add bilingual README, architecture docs, third-party notices, agent handoff and CI.

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
