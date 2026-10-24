# Rollback

## Display-only rollback

1. Open **System Settings**.
2. Turn off `Enable Shamsi (Jalali) Calendar`.
3. Refresh the browser.

Desk returns to standard Frappe Date and Datetime controls. Stored values do not change.

## App rollback

```bash
bench --site SITE uninstall-app jalali_shamsi_datepicker
```

This removes the two app Custom Fields. It does not restore an old vendor file or an old JS bundle. To restore files, check out the previous app commit and clear cache.

## Limits

- There is no data migration to reverse. Jalali strings were not stored.
- Rolling back files without `clear-cache` can leave old Desk assets in the browser.
- A production migrate that included other apps' patches cannot be undone by this app's uninstall.
