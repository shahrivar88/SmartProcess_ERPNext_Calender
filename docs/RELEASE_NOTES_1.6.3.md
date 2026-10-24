# jalali_shamsi_datepicker 1.6.3

These notes are for a later GitHub Release. This file does not publish the release.

Verified on Frappe 16.35 and ERPNext 16.35.0. Upstream LICENSE remains Copyright (c) 2025 nidyasoft.

## English

`1.6.3` hardens Jalali display and input. Stored `Date` and `Datetime` values stay Gregorian. No business-data migration is required.

### Changes

- One mapping engine: `jalali_core.js` is the only Jalali to Gregorian converter.
- Leap days follow `jalali_core`, not the vendor leap table.
- The picker uses an isolated constructor. Global `persianDate` stays unpatched.
- Week start and end stay on civil days across DST.
- Invalid Jalali dates and clocks are rejected. The previous value is kept.
- Uninstall deletes leftover `tabSingles` rows for this app's two System Settings fields. A stale Check of `1` cannot re-enable the calendar after reinstall.
- Tests, bilingual docs and Security CI cover mapping, DST, isolation, packaging and secrets.

### Unchanged limits

- Gregorian storage is unchanged. `Date` stays `YYYY-MM-DD`. `Datetime` stays `YYYY-MM-DD HH:mm:ss` in the system timezone.
- `DateRange` stays outside Jalali conversion.
- Jalali years 1200 to 1599 map to Gregorian `1821-03-21` through `2221-03-20`. Values outside that range stay Gregorian.
- Other Frappe major versions are not claimed.

### Upgrade

From `1.6.2`, pull this tag or commit into `apps/jalali_shamsi_datepicker`, then follow [UPGRADE.md](UPGRADE.md) on a reviewed site. Migrate does not rewrite business dates.

## فارسی

نسخه `1.6.3` لایهٔ نمایش و ورود شمسی را سخت‌گیرانه‌تر می‌کند. مقدار ذخیره‌شدهٔ `Date` و `Datetime` میلادی می‌ماند. این انتشار مهاجرت دادهٔ کسب‌وکار ندارد.

### تغییرات

- تنها موتور تبدیل: `jalali_core.js`
- روزهای کبیسه مطابق همین موتور است، نه جدول vendor
- سازندهٔ picker ایزوله است و `persianDate` سراسری دست نخورده می‌ماند
- مرز هفته در DST روی روز مدنی می‌ماند
- تاریخ و ساعت شمسی نامعتبر رد می‌شود و مقدار قبلی حفظ می‌شود
- uninstall ردیف‌های باقی‌ماندهٔ `tabSingles` همین دو فیلد تنظیمات سیستم را پاک می‌کند تا مقدار کهنهٔ `1` بعد از نصب دوباره تقویم را روشن نکند
- تست‌ها، مستندات دوزبانه و CI امنیتی پوشش نگاشت، DST، ایزوله بودن، بسته‌بندی و نشت را اضافه می‌کنند

### محدودیت‌های ثابت

- ذخیره میلادی عوض نشده است
- `DateRange` شمسی نمی‌شود
- سال شمسی خارج از ۱۲۰۰ تا ۱۵۹۹ میلادی می‌ماند
- فقط Frappe 16.35 و ERPNext 16.35.0 ادعا می‌شود
