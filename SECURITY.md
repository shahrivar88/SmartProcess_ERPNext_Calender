# Security

Report a vulnerability in [GitHub Issues](https://github.com/shahrivar88/SmartProcess_ERPNext_Calender/issues) if it is not sensitive. For a report that includes a working exploit against a live site, email the repository owner through GitHub and do not attach customer data.

This project does not yet have a published GHSA process.

## What this app can access

- One System Settings boolean: `custom_enable_shamsi_jalali_calendar`
- Desk assets for Date, Datetime and Time controls
- `bootinfo.jalali_calendar_enabled` for every Desk user

The app does not read business documents on the server. It does not store API keys, site keys or passwords.

## What this app must not do

- Edit Frappe or ERPNext core
- Bypass permissions with `ignore_permissions`
- Override whitelisted methods
- Write business rows with SQL
- Store Jalali strings in Date or Datetime fields
- Patch `persianDate.prototype` globally

## Known limits

- Jalali validation is client-side. A caller with document write permission can still save any Gregorian value that Frappe accepts.
- Uninstall uses `frappe.delete_doc(..., force=True)` on two app-owned Custom Fields. It does not set `ignore_permissions`. Those hooks run as Administrator.
- `persian-date` 1.1.0 and `persian-datepicker` 1.2.0 are unmaintained. Treat vendor upgrades as a compatibility project.

## Scanners

GitHub Actions runs Gitleaks, OSV-Scanner, Trivy, Semgrep and CodeQL. OSV-Scanner and Trivy cover lockfiles. They do not prove the minified vendor files are free of CVEs. See [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md).

Full-history Gitleaks (reproducible; `fetch-depth: 0` in CI):

```bash
docker run --rm -v "$PWD:/src" zricethezav/gitleaks:v8.24.3 detect --source /src --verbose --redact
```
