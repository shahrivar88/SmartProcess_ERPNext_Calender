# jalali_shamsi_datepicker 1.6.5

Verified against Frappe 16.35.0 naming (`frappe.model.naming`) and exercised on an isolated site running Frappe 16.53.0, where the same `naming_series_variables` hook is used. Upstream LICENSE remains Copyright (c) 2025 nidyasoft.

## English

`1.6.5` adds four Jalali tokens to Frappe Naming Series. Stored `Date` and `Datetime` values stay Gregorian. Existing document names and `tabSeries` rows are not rewritten. No business-data migration is required.

### Tokens

| Token | Meaning | Example on `2026-11-01` |
|---|---|---|
| `JYYYY` | Four-digit Jalali year | `1405` |
| `JYY` | Last two Jalali year digits | `05` |
| `JMM` | Two-digit Jalali month | `08` |
| `JDD` | Two-digit Jalali day | `10` |

Example: `SINV-.JYYYY.-.#####` → `SINV-1405-00001`.

The civil date comes from `frappe.utils.now_datetime()`, the same clock Frappe uses for `YYYY` / `MM` / `DD`. These tokens do not read `posting_date`. Digits are ASCII. Dates outside Jalali years 1200–1599 raise an error.

A new Jalali year creates a new prefix, so `tabSeries` counters do not continue across Nowruz. Preview uses `NamingSeries.get_preview` and does not consume counters.

Configure them in **تنظیمات نام‌گذاری سند** (Document Naming Settings). See [NAMING_SERIES.md](NAMING_SERIES.md).

### Unchanged limits

- Gregorian storage is unchanged.
- Standard `YYYY`, `YY`, `MM`, `DD` and `#####` stay Frappe/ERPNext tokens.
- `DateRange` stays outside Jalali conversion.
- Other Frappe major versions are not claimed.

## فارسی

نسخه `1.6.5` چهار متغیر شمسی به Naming Series اضافه می‌کند. مقدار ذخیره‌شدهٔ `Date` و `Datetime` میلادی می‌ماند. نام اسناد موجود و ردیف‌های `tabSeries` بازنویسی نمی‌شوند. مهاجرت دادهٔ کسب‌وکار لازم نیست.

### متغیرها

| متغیر | معنی | نمونه برای `2026-11-01` |
|---|---|---|
| `JYYYY` | سال شمسی چهاررقمی | `1405` |
| `JYY` | دو رقم آخر سال شمسی | `05` |
| `JMM` | ماه شمسی دورقمی | `08` |
| `JDD` | روز شمسی دورقمی | `10` |

نمونه: `SINV-.JYYYY.-.#####` → `SINV-1405-00001`.

تاریخ از `now_datetime()` می‌آید، نه از `posting_date`. خروجی رقم لاتین است. تاریخ خارج از سال‌های ۱۲۰۰ تا ۱۵۹۹ خطا می‌دهد.

سال شمسی جدید پیشوند جدا می‌سازد. پیش‌نمایش شمارنده را مصرف نمی‌کند.

تنظیم در **تنظیمات نام‌گذاری سند** (Document Naming Settings). جزئیات: [NAMING_SERIES.md](NAMING_SERIES.md).
