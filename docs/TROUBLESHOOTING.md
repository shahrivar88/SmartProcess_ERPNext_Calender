# Troubleshooting

## The picker is still Gregorian

1. Confirm `Enable Shamsi (Jalali) Calendar` is on.
2. Refresh the browser.
3. Run `bench --site SITE clear-cache`.
4. Confirm Desk loaded `jalali_controls.js` from this app, not an old cached file.

## Install-app cannot find the app

The repository was cloned as `SmartProcess_ERPNext_Calender`. Move or re-clone it to `apps/jalali_shamsi_datepicker`. See [INSTALLATION.md](INSTALLATION.md).

## A Jalali date is rejected

The day does not exist, or the year is outside 1200-1599. `1404/12/30` is invalid because 1404 is not a leap year. The previous value stays.

## Compact digits store the wrong day

Only an exact 8-digit value that starts with a Jalali year is treated as Jalali. `20260925` is passed to Frappe as Gregorian compact input. `14050703` is Jalali.

## Helper text does not match the picker

The helper is the stored Gregorian model value. If it differs from the picker, the save path is wrong. Do not hide the helper to paper over a mapping bug.

## Time looks shifted

Datetime uses Frappe timezone conversion once. Check the site timezone and the user timezone before changing this app.

## DateRange is Gregorian

This is intended.

## Uninstall left the Check field

`before_uninstall` must run. Do not delete the app directory before `uninstall-app`.
