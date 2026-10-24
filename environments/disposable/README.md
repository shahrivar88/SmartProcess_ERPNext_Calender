# Disposable validation environment

Use a new Frappe site that holds no customer data. This template is not an operational stack.

Do not copy production credentials, site keys, or database dumps into this folder.

## Rules

- Create a new compose project name and a new site name.
- Do not attach this app to an operational site for experiments.
- Do not commit `.env` files with real passwords.
- Do not record machine-specific absolute paths as required deploy paths.

## Verified versions

Isolated validation for this fork used Frappe 16.35.0 and ERPNext 16.35.0. The local image name from that run is not a public requirement.

## Minimal process

1. Copy `compose.example.yaml` to a private directory outside this git checkout.
2. Create a private `.env` with generated passwords.
3. Start a new backend that is not sharing operational volumes.
4. Create a new site.
5. Clone this repository into `apps/jalali_shamsi_datepicker`.
6. Run `install-app jalali_shamsi_datepicker`, then `migrate` and `clear-cache`.
7. Enable `custom_enable_shamsi_jalali_calendar` only on that site.

Exact Docker image and compose service names depend on your bench. `compose.example.yaml` is a starting shape, not a certified production file.
