# Jalali Shamsi Datepicker

[English README](README.en.md)

اپ Frappe برای نمایش و ورود تاریخ شمسی در فیلدهای `Date` و `Datetime`. مقدار ذخیره‌شده در مدل و دیتابیس همان میلادی استاندارد Frappe می‌ماند.

این مخزن یک fork نگهداری‌شده توسط SmartProcess است. پروژهٔ بالادستی: [nidyasoft/jalali_shamsi_datepicker](https://github.com/nidyasoft/jalali_shamsi_datepicker). دارندهٔ کپی‌رایت در `LICENSE` همان `nidyasoft` سال ۲۰۲۵ است و عوض نشده است.

- نسخه فعلی: `1.6.4`
- یادداشت انتشار: [docs/RELEASE_NOTES_1.6.4.md](docs/RELEASE_NOTES_1.6.4.md)
- نام اپ Frappe: `jalali_shamsi_datepicker`
- نام مخزن GitHub: `SmartProcess_ERPNext_Calender`

## مسئله‌ای که حل می‌کند

کاربران ایرانی باید تاریخ را شمسی ببینند و وارد کنند. ERPNext و Frappe تاریخ را میلادی ذخیره و محاسبه می‌کنند. این اپ فقط لایهٔ نمایش و ورود را شمسی می‌کند و مقدار مدل را دست نمی‌زند.

## قابلیت‌ها

- نمایش و ورود شمسی در کنترل‌های `Date` و `Datetime`: فرم، جدول فرزند، Quick Entry، دیالوگ، فیلتر لیست و فیلتر گزارش
- نمایش شمسی در حالت فقط‌خواندنی، لیست و گزارش
- ورود با ارقام فارسی، عربی یا لاتین و ورودی فشردهٔ ۸ رقمی شمسی
- رد تاریخ شمسی نامعتبر با پیام؛ مقدار قبلی حفظ می‌شود
- ورود میلادی و عبارت‌هایی مثل `Today` و `+1d` مثل Frappe استاندارد
- حفظ ساعت، ثانیه و تبدیل منطقهٔ زمانی Frappe در `Datetime`
- نمایش مقدار خام میلادی ذخیره‌شده زیر فیلد، بدون تغییر ارتفاع فرم
- فیلد `Time` فقط انتخابگر زمان همین اپ را می‌گیرد؛ مقدار `HH:mm:ss` استاندارد است
- یک سوییچ در **تنظیمات سیستم** (System Settings)
- متغیرهای سری نام‌گذاری `JYYYY`، `JYY`، `JMM` و `JDD` از طریق هوک رسمی Frappe؛ اسناد موجود تغییر نام نمی‌گیرند. راهنما: [docs/NAMING_SERIES.md](docs/NAMING_SERIES.md)

## پشتیبانی‌نشده

- فیلد `DateRange` عمداً میلادی استاندارد می‌ماند
- رشتهٔ شمسی هرگز در `Date` / `Datetime` ذخیره نمی‌شود
- نسخه‌های major غیر از Frappe 16 تست نشده‌اند
- اسکرین‌شات منتشرشده وجود ندارد

## سازگاری

| مورد | وضعیت |
|---|---|
| Frappe | فقط نسخهٔ ۱۶ بررسی شده است. DOM و CSS روی **16.35** چک شده‌اند. |
| ERPNext | روی **16.35.0** در سایت ایزولهٔ اعتبارسنجی بررسی شده است. اپ فقط به `frappe` وابسته است. |
| نسخهٔ major دیگر | ادعا نمی‌شود |

جزئیات: [docs/FRAPPE_COMPATIBILITY.md](docs/FRAPPE_COMPATIBILITY.md)

## نیازها

- Frappe 16 روی bench یا Docker
- مرورگر Desk
- دسترسی مدیر برای نصب، `migrate` و سوییچ تقویم
- وابستگی Python جدا ندارد؛ Frappe را bench فراهم می‌کند

## بازهٔ تقویم

- شمسی پشتیبانی‌شده: `1200/01/01` تا `1599/12/29`
- میلادی متناظر: `1821-03-21` تا `2221-03-20`
- تاریخ خارج از این بازه به شمسی اشتباه تبدیل نمی‌شود و به صورت میلادی دیده می‌شود

## تضمین ذخیرهٔ میلادی

مقدار مدل `Date` برابر `YYYY-MM-DD` و مقدار `Datetime` برابر `YYYY-MM-DD HH:mm:ss` در منطقهٔ زمانی سیستم است. هیچ patch رکورد کسب‌وکار را بازنویسی نمی‌کند.

جزئیات: [docs/DATA_INTEGRITY.md](docs/DATA_INTEGRITY.md)

## نصب

نام مخزن با نام اپ یکی نیست. پوشه باید `jalali_shamsi_datepicker` باشد.

```bash
cd apps
git clone https://github.com/shahrivar88/SmartProcess_ERPNext_Calender.git jalali_shamsi_datepicker
cd ..
bench setup requirements
bench --site SITE install-app jalali_shamsi_datepicker
bench --site SITE migrate
bench --site SITE clear-cache
```

`SITE` را با نام سایت خود عوض کنید. در Docker این فرمان‌ها داخل کانتینر `backend` اجرا می‌شوند.

راهنمای کامل: [docs/INSTALLATION.md](docs/INSTALLATION.md)

## پیکربندی

1. **تنظیمات سیستم** (System Settings) را باز کنید.
2. گزینهٔ `Enable Shamsi (Jalali) Calendar` را فعال کنید.
3. صفحهٔ مرورگر را یک بار رفرش کنید.

نام فیلد: `custom_enable_shamsi_jalali_calendar`. پیش‌فرض خاموش است. `date_format` سیستم را عوض نکنید.

اگر سوییچ خاموش باشد، کنترل‌ها دقیقاً رفتار استاندارد Frappe را دارند.

## استفاده

- بعد از فعال‌سازی، فیلدهای `Date` و `Datetime` شمسی دیده می‌شوند و با فوکوس تقویم شمسی باز می‌شود.
- می‌توانید تاریخ را دستی تایپ کنید یا فیلد را خالی کنید.
- این سه ورودی همه ۳ مهر ۱۴۰۵ هستند و `2026-09-25` ذخیره می‌شود:

| ورودی | معنی | مقدار ذخیره‌شده |
|---|---|---|
| `14050703` | `1405/07/03` | `2026-09-25` |
| `1405/07/03` | `1405/07/03` | `2026-09-25` |
| `۱۴۰۵۰۷۰۳` | `1405/07/03` | `2026-09-25` |

ورودی دقیقاً ۸ رقمی که ۴ رقم اولش سال شمسی `1200` تا `1599` باشد همیشه شمسی خوانده می‌شود. اگر آن روز وجود نداشته باشد رد می‌شود. ورودی ۶ یا ۷ رقمی حدس زده نمی‌شود.

اگر `date_format` سایت `dd-mm-yyyy` یا `mm-dd-yyyy` است و تاریخ میلادی را بدون جداکننده می‌نویسید، ورودی‌ای که ۴ رقم اولش بین `1200` و `1599` باشد شمسی حساب می‌شود. تاریخ میلادی را با جداکننده وارد کنید.

## رفتار Date / Datetime / Time

- `Date`: نمایش و ورود شمسی؛ ذخیره میلادی
- `Datetime`: همان تاریخ شمسی به‌علاوه ساعت و ثانیهٔ Frappe
- `Time`: انتخابگر زمان اپ؛ مقدار استاندارد
- `DateRange`: بدون تغییر

ورودی نامعتبر شمسی یا ساعت نامعتبر در `Date` / `Datetime` به Frappe داده نمی‌شود.

## منطقهٔ زمانی

تبدیل منطقهٔ زمانی همان مسیر Frappe است و دو بار اعمال نمی‌شود. تست مرورگر روی `Asia/Tehran`، `UTC` و `America/New_York` اجرا می‌شود.

## ارتقا

```bash
cd apps/jalali_shamsi_datepicker
git pull
cd ../..
bench --site SITE migrate
bench --site SITE clear-cache
```

قبل از `bench migrate` روی سایت عملیاتی، همهٔ patchهای در انتظار همهٔ اپ‌های نصب‌شده را مرور کنید.

جزئیات: [docs/UPGRADE.md](docs/UPGRADE.md)

## حذف

```bash
bench --site SITE uninstall-app jalali_shamsi_datepicker
```

حذف فقط دو Custom Field متعلق به همین اپ را برمی‌دارد. تاریخ اسناد کسب‌وکار باقی می‌ماند.

جزئیات: [docs/UNINSTALL.md](docs/UNINSTALL.md)

## محدودیت rollback

سوییچ را خاموش کنید و صفحه را رفرش کنید تا Desk به کنترل استاندارد برگردد. uninstall هم همین اثر را دارد. چون مقدار شمسی ذخیره نشده، rollback دادهٔ تاریخی لازم نیست. برگرداندن فایل‌های اپ با git جدا است.

جزئیات: [docs/ROLLBACK.md](docs/ROLLBACK.md)

## عیب‌یابی

- سوییچ را فعال کردید ولی تقویم میلادی است: صفحه را رفرش کنید و cache را پاک کنید.
- ورودی رد می‌شود: روز شمسی وجود ندارد یا خارج از بازه است.
- مقدار زیر فیلد با تقویم فرق دارد: مقدار مدل میلادی است؛ همان باید ذخیره شود.

جزئیات: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## پرسش‌های رایج

**آیا تاریخ در دیتابیس شمسی می‌شود؟** خیر.

**آیا Frappe یا ERPNext core را ویرایش می‌کند؟** خیر.

**آیا روی Frappe 15 کار می‌کند؟** تست نشده است. ادعا نمی‌شود.

**آیا می‌توان vendor تقویم را خودکار ارتقا داد؟** خیر. ارتقای `persian-date` یا `persian-datepicker` نیاز به بررسی سازگاری و رگرسیون کامل دارد.

## امنیت و حریم

اپ راز ذخیره نمی‌کند. `bootinfo` فقط یک boolean برای سوییچ تقویم می‌فرستد. ورودی قبل از نمایش در پیام خطا escape می‌شود. جزئیات: [SECURITY.md](SECURITY.md)

## مجوز و انتساب

MIT. متن مجوز بالادستی حفظ شده است: Copyright (c) 2025 nidyasoft.

فیلد ناشر در `hooks.py` همچنان `Ideenemium` است. رابطهٔ حقوقی دقیق بین `nidyasoft` و `Ideenemium` مستقل از متادیتای بالادستی تأیید نشده است.

کتابخانه‌های شخص ثالث: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)

## پشتیبانی و مشارکت

باگ و پیشنهاد را در [Issues](https://github.com/shahrivar88/SmartProcess_ERPNext_Calender/issues) ثبت کنید.

- [SUPPORT.md](SUPPORT.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CHANGELOG.md](CHANGELOG.md)
- [AGENTS.md](AGENTS.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/TEST_MATRIX.md](docs/TEST_MATRIX.md)
- [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md)
- [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)

## تست

```bash
npm ci
npm run test:unit
npm run test:python
npx playwright install chromium
npm run test:browser
npm test
```

روی Windows با مرورگر سیستم:

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
npm test
```

`npm test` تست‌های Node و سپس Playwright را در سه منطقهٔ زمانی اجرا می‌کند.