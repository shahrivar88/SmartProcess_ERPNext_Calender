# Uninstall

```bash
bench --site SITE uninstall-app jalali_shamsi_datepicker
```

`before_uninstall` deletes only:

- `System Settings.custom_enable_shamsi_jalali_calendar`
- `System Settings.custom_date_storage_format` if present
- leftover `tabSingles` rows for those two field names

Frappe also removes Property Setters for those Custom Fields and writes Deleted Document rows. A leftover Singles value of `1` would otherwise re-enable the calendar on reinstall.

## What stays

- All Date, Datetime and Time values on business documents
- Frappe and ERPNext core
- Other apps

## After uninstall

Clear cache and refresh Desk. Date controls return to standard Frappe widgets.

See [ROLLBACK.md](ROLLBACK.md).
