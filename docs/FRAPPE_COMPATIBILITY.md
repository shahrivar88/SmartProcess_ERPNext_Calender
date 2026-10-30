# Frappe compatibility

## Verified

- Frappe 16.35 Desk DOM and CSS for Date, Datetime and Time
- ERPNext 16.35.0 on an isolated validation site
- `required_apps = ["frappe"]`

## Not claimed

- Frappe 14 or 15
- Frappe 17
- Frappe Cloud specific hosting
- Website / portal forms outside Desk

Upstream started as an ERPNext 15 app. This fork is only verified on Frappe 16.

## Naming series

`naming_series_variables` is read by `frappe.model.naming.has_custom_parser` in Frappe 16.35.0 and 16.53.0. Each token is a function `(doc, e) -> str`. Preview and prefix use the same parser. This app does not override `parse_naming_series`.

## Version-sensitive calls

`jalali_controls.js` documents these Frappe 16.34 / 16.35 assumptions:

- `frappe.ui.form.make_control` resolves `Control` + fieldtype at call time
- `ControlDate.set_formatted_input` returns early when `this.datepicker` is missing
- `ControlDatetime.format_for_input` returns user date and user time
- `disp_area` is `.control-value` and is absent for `only_input`

If a future Frappe release changes those points, update the wrapper and the compatibility tests before claiming support.
