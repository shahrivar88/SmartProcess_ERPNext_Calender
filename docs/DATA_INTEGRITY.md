# Data integrity

These rules are invariants. A change that breaks one of them is a defect.

1. Standard Frappe `Date` and `Datetime` model values stay Gregorian.
2. An invalid Jalali date cannot be saved as another date.
3. Invalid Gregorian date or datetime input is not silently changed into a different valid value by this app.
4. A picker selection stores the date that the picker shows.
5. Timezone conversion is not applied twice.
6. Time of day and seconds are preserved.
7. When the feature is off, standard Frappe behavior is unchanged.
8. Application patches do not rewrite business records.
9. Uninstall changes only app-owned configuration and metadata.
10. Existing dates outside the supported Jalali range are not silently rewritten.

## Supported range

Jalali years 1200 to 1599 map to Gregorian `1821-03-21` through `2221-03-20`. Dates outside this range stay Gregorian in the UI.

## What the database may contain after install

- The System Settings Check `custom_enable_shamsi_jalali_calendar`
- Removal of the deprecated `custom_date_storage_format` field if it existed

Date columns on ToDo, Event, Fiscal Year and other documents are not migrated.

Jalali naming tokens do not rename existing documents and do not rewrite `tabSeries` rows. They only affect a DocType after a user adds `JYYYY`, `JYY`, `JMM` or `JDD` to that series.
