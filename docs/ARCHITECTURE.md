# Architecture

This app is a Desk display and input layer. Frappe remains the source of stored Date and Datetime values.

## Layers

1. `jalali_core.js` converts Jalali to Gregorian and parses user input. It has no DOM.
2. `jalali_persian_date_adapter.js` builds an isolated `persianDate` subclass for one picker factory.
3. `jalali_controls.js` wraps Frappe `ControlDate`, `ControlDatetime` and `ControlTime` when the boot flag is on.
4. Vendored `persian-date` and `persian-datepicker` render the popup. They are not the mapping engine.

## Enable path

`boot.py` reads `System Settings.custom_enable_shamsi_jalali_calendar` and sets `bootinfo.jalali_calendar_enabled`. The fixture creates that Check field. When the flag is off, the wrapper returns and standard controls stay in place.

## Isolation

`persian-date` 1.1.0 closes calendar methods over its original constructor. A global prototype patch would change other consumers of `window.persianDate`. The adapter attaches the isolated constructor only to this app's picker.

## Frappe wrap

The wrapper converts Jalali text to a Frappe user-format Gregorian string, then calls the original `parse()`. Timezone conversion, `+1d` and empty values stay on the Frappe path.

Version-sensitive DOM notes live in the header of `jalali_controls.js`.

## Server surface

Python code is boot, uninstall, one idempotent patch that deletes the deprecated storage-format field, a port of `jalali_core.js` in `jalali.py`, and `naming_series_variables` callbacks in `naming.py`. There are no DocTypes, no whitelisted methods and no `doc_events`.

The Python port exists only so Frappe can resolve Jalali naming tokens on the server. It must stay equal to `jalali_core.js`. Do not add a third calendar algorithm.

See [DATA_INTEGRITY.md](DATA_INTEGRITY.md) and [FRAPPE_COMPATIBILITY.md](FRAPPE_COMPATIBILITY.md).
