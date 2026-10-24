# Installation

## Environments

| Environment | Use |
|---|---|
| Development | Local bench or Docker. Safe to install and iterate. |
| Disposable validation | A new site created only for this app. See [../environments/disposable/README.md](../environments/disposable/README.md). |
| Production | Operational site. Needs explicit review. See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md). |

Do not treat an operational site as a disposable test site.

## App directory name

Clone the GitHub repository into `apps/jalali_shamsi_datepicker`. `bench get-app https://github.com/shahrivar88/SmartProcess_ERPNext_Calender` creates the wrong folder name.

```bash
cd apps
git clone https://github.com/shahrivar88/SmartProcess_ERPNext_Calender.git jalali_shamsi_datepicker
cd ..
bench setup requirements
bench --site SITE install-app jalali_shamsi_datepicker
bench --site SITE migrate
bench --site SITE clear-cache
```

In Docker, run the `bench` commands inside the `backend` container and pass `--site`.

## After install

1. Open **System Settings**.
2. Enable `Enable Shamsi (Jalali) Calendar`.
3. Refresh the browser.

The fixture creates `custom_enable_shamsi_jalali_calendar` during `migrate`. Default is off.

## Docker notes

Ship app files through the image or a bind mount. Do not edit files only inside a running production container.
