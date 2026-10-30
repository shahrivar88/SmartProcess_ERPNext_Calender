# Jalali naming series

Verified against Frappe 16.35.0 `frappe.model.naming`. The same hook exists in Frappe 16.53.0. This feature is not a Desk datepicker change.

Do not enable these tokens on an operational site in Phase I Step 1.

## English

The app registers four tokens through the official hook `naming_series_variables`. Frappe still parses the series, stores counters in `tabSeries`, and previews names. This app does not override `parse_naming_series` and does not change existing document names.

| Token | Meaning | Example on `2026-11-01` |
|---|---|---|
| `JYYYY` | Four-digit Jalali year | `1405` |
| `JYY` | Last two Jalali year digits | `05` |
| `JMM` | Two-digit Jalali month | `08` |
| `JDD` | Two-digit Jalali day | `10` |

Example series: `SINV-.JYYYY.-.#####` → `SINV-1405-00001`.

Standard tokens stay Frappe tokens: `YYYY`, `YY`, `MM`, `DD`, `#####`.

The current civil date comes from `frappe.utils.now_datetime()`, the same clock Frappe uses for `YYYY` / `MM` / `DD`. Digits are ASCII. Dates outside Jalali years 1200–1599 raise an error. They do not fall back to a Gregorian year.

### Where to configure

Use the standard **Document Naming Settings** form. English labels are Frappe 16.35.0 field labels. Persian titles below are the `fa` translations from the installed SmartProcessERP Desk.

1. Open **تنظیمات نام‌گذاری سند** (Document Naming Settings).
2. Choose the DocType in **انتخاب تراکنش** (Select Transaction).
3. Add a series such as `SINV-.JYYYY.-.#####` in **فهرست سری برای این تراکنش** (Series List for this Transaction).
4. Type the same series in **امتحان‌کردن سری نام‌گذاری** (Try a Naming Series).
5. Read **پیش‌نمایش نام‌های ایجادشده** (Preview of generated names). It calls `NamingSeries.get_preview`, which resolves hook tokens.

The built-in help HTML lists only Frappe's own tokens. Do not edit that core help. Write Jalali tokens as dotted parts, the same way as `.YYYY.`. A custom naming UI is not required.

Existing documents keep their names until a user changes that DocType's series. Do not rewrite `tabSeries` by hand.

## فارسی

اپ چهار متغیر را با هوک رسمی `naming_series_variables` ثبت می‌کند. موتور نام‌گذاری Frappe و شمارندهٔ `tabSeries` عوض نمی‌شوند. اسناد موجود تغییر نام نمی‌گیرند مگر اینکه سری همان DocType را خودتان عوض کنید.

| متغیر | معنی | نمونه برای `2026-11-01` |
|---|---|---|
| `JYYYY` | سال شمسی چهاررقمی | `1405` |
| `JYY` | دو رقم آخر سال شمسی | `05` |
| `JMM` | ماه شمسی دورقمی | `08` |
| `JDD` | روز شمسی دورقمی | `10` |

نمونه: `SINV-.JYYYY.-.#####` → `SINV-1405-00001`.

متغیرهای استاندارد `YYYY`، `YY`، `MM`، `DD` و `#####` همان رفتار Frappe را دارند.

تاریخ جاری از `now_datetime()` می‌آید؛ همان منبع `YYYY` و `MM`. خروجی فقط رقم لاتین است. تاریخ خارج از سال‌های ۱۲۰۰ تا ۱۵۹۹ خطا می‌دهد و به سال میلادی برنمی‌گردد.

### مسیر تنظیم در Desk

عنوان‌های فارسی از ترجمهٔ `fa` سایت نصب‌شده خوانده شده‌اند.

1. **تنظیمات نام‌گذاری سند** (Document Naming Settings) را باز کنید.
2. DocType را در **انتخاب تراکنش** (Select Transaction) انتخاب کنید.
3. سری را در **فهرست سری برای این تراکنش** (Series List for this Transaction) بنویسید؛ مثلاً `SINV-.JYYYY.-.#####`.
4. همان سری را در **امتحان‌کردن سری نام‌گذاری** (Try a Naming Series) وارد کنید.
5. نتیجه را در **پیش‌نمایش نام‌های ایجادشده** (Preview of generated names) ببینید. این فیلد `NamingSeries.get_preview` را صدا می‌زند و توکن هوک را حل می‌کند.

متن راهنمای داخل همان فرم فقط متغیرهای خود Frappe را فهرست می‌کند. آن متن را در core عوض نکنید. متغیر شمسی را مثل `.YYYY.` بین نقطه بنویسید. UI نام‌گذاری اختصاصی لازم نیست.

اسناد قبلی و شمارنده‌های فعلی دست نخورده می‌مانند.
