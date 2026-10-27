# jalali_shamsi_datepicker 1.6.4

Verified on Frappe 16.35 and ERPNext 16.35.0. Upstream LICENSE remains Copyright (c) 2025 nidyasoft.

## English

`1.6.4` places the Jalali picker above the Frappe 16 Grid row editor. Stored `Date` and `Datetime` values stay Gregorian. No business-data migration is required.

### Changes

- The picker reads the computed `z-index` of `.form-in-grid` or `.modal` and sits 10 layers above it.
- A fixed `102` is not used. That value sat under `.form-in-grid` at `1039` and hid the sheet.
- Ordinary Date fields stay at `z-index` 5 so `.page-head` still covers a scrolled field.
- A child table inside a dialog uses the modal layer, not the grid fallback.

### Unchanged limits

- Gregorian storage is unchanged. `Date` stays `YYYY-MM-DD`. `Datetime` stays `YYYY-MM-DD HH:mm:ss` in the system timezone.
- `DateRange` stays outside Jalali conversion.
- Jalali years 1200 to 1599 map to Gregorian `1821-03-21` through `2221-03-20`. Values outside that range stay Gregorian.
- Other Frappe major versions are not claimed.

### Upgrade

From `1.6.3`, pull this tag or commit into `apps/jalali_shamsi_datepicker`, then follow [UPGRADE.md](UPGRADE.md) on a reviewed site. Migrate does not rewrite business dates.

## فارسی

نسخه `1.6.4` ورق تقویم شمسی را بالای فرم ردیف Grid در Frappe 16 قرار می‌دهد. مقدار ذخیره‌شدهٔ `Date` و `Datetime` میلادی می‌ماند. این انتشار مهاجرت دادهٔ کسب‌وکار ندارد.

### تغییرات

- لایه از `z-index` محاسبه‌شدهٔ `.form-in-grid` یا `.modal` خوانده می‌شود و ۱۰ واحد بالاتر می‌ایستد
- مقدار ثابت `102` حذف شد؛ آن مقدار زیر فرم ردیف با `1039` می‌ماند و ورق دیده نمی‌شد
- فیلد Date معمولی روی `z-index` 5 می‌ماند تا `.page-head` آن را بپوشاند
- جدول داخل Dialog از لایهٔ Modal استفاده می‌کند

### محدودیت‌های بدون تغییر

- ذخیره میلادی است. `Date` به صورت `YYYY-MM-DD` می‌ماند. `Datetime` در منطقهٔ زمانی سیستم است.
- `DateRange` تبدیل شمسی ندارد.
- سال‌های شمسی ۱۲۰۰ تا ۱۵۹۹ به میلادی `1821-03-21` تا `2221-03-20` نگاشت می‌شوند.
- نسخهٔ اصلی دیگر Frappe ادعا نمی‌شود.

### ارتقا

از `1.6.3` این Tag یا Commit را به `apps/jalali_shamsi_datepicker` بکشید و [UPGRADE.md](UPGRADE.md) را روی سایت بررسی‌شده دنبال کنید. Migrate تاریخ کسب‌وکار را بازنویسی نمی‌کند.
