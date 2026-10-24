# Upgrade

```bash
cd apps/jalali_shamsi_datepicker
git fetch
git checkout <tag-or-commit>
cd ../..
```

On a disposable or development site you may then run:

```bash
bench --site SITE migrate
bench --site SITE clear-cache
```

On a production site, stop and follow [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md). Review every pending patch from every installed app before `bench migrate`.

## What migrate may change

- The System Settings fixture for `custom_enable_shamsi_jalali_calendar`
- Removal of deprecated `custom_date_storage_format` if it still exists

Migrate does not rewrite Date or Datetime values on business documents.

## After upgrade

Refresh Desk. Confirm a known document still shows the same stored Gregorian value.
