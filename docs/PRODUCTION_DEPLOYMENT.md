# Production deployment

Do not deploy from this hardening branch just because documentation and CI exist.

## Approval

A production install or upgrade needs an explicit decision from the site owner. This file is not that approval.

## Before migrate

1. Take a backup of the site database and files.
2. List installed apps and their versions.
3. Review **every pending patch** from **every installed app**, not only this app.
4. Confirm this app's pending patch only removes `custom_date_storage_format` if present.
5. Confirm no other app is about to rewrite Date or Datetime data.
6. Run the change on a disposable copy first.

`bench migrate` is a site-wide operation. A patch from another app can change production data even when this app is safe.

## Deploy shape

Prefer an image or a reviewed bind mount of `apps/jalali_shamsi_datepicker`. Do not edit Python or JS only inside a running production container.

After files are in place:

```bash
bench --site SITE migrate
bench --site SITE clear-cache
```

Then refresh Desk and check one known Date value.

## Sites you must not use as a test bed

Do not validate this app on an operational company site. Create a disposable site. See [../environments/disposable/README.md](../environments/disposable/README.md).
