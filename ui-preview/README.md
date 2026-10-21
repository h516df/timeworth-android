# TimeWorth · interaction prototype 04

Owner-private preview: https://timeworth-mobile-preview.cloudyloom133.chatgpt.site

A browser-local, mobile-first testbed for an eventual Android app. Initial data are fictional. No payment account, notification listener or remote financial storage is connected. No Android APK is produced in this phase.

## Product direction

Fewer steps is the primary constraint. The main question is “after salary arrives, what may remain at month end?” Category budgets are absent from the primary experience. Manual recording is an optional correction, not the daily workflow. Settings have no avatar or motivational header.

- Home follows **this calendar month’s salary**, the salary already retained, and the estimated month-end remainder. Historical savings, balance anchors and other income do not increase it. Previous months show recorded remainder without a future projection.
- Salary confirmation needs one amount and one save. Generic incoming messages are other income unless explicitly identified as payroll. Imported non-payroll receipts stay separate.
- Cash expenses default to this month’s salary; an optional correction attributes a payment to other funds. This is a declared accounting convention, not per-yuan tracing across bank accounts.
- “Flow” starts with the salary split and category summary. Individual records are one optional drill-down. Transfers into personal savings goals are shown separately and do not count as consumption.
- Any provider is accepted for repayment entry. A sentence such as `信用卡 原价6000 每期520 共12期 25号` infers total repayment 6240 and aggregate interest/fees 240. Original price is optional.
- The calculator accepts total repayment, an all-in payment, or a rate. Known all-in amounts are not charged interest again. A quoted difference combines interest and fees; pure interest cannot be isolated from those totals alone. Optional down payment is excluded from financed principal. Repayment schedules allocate exact cents.
- Time cost includes workdays, work months and approximate calendar days of income. At salary 10000, 22 workdays/month and 8h/day, 6240 equals about 13 workdays 5h49m, 0.62 work months or 19 calendar days of income. Calendar days describe earnings equivalence, not life expectancy. Commute is optional in effective hourly rate and uses minutes in entry.
- Wishes have independent custom symbols, emoji/text or uploaded icons, alongside optional photos. Icons carry into savings goals. There is no mandatory monthly saving target.
- Four skins change materials, typography, borders, spacing and navigation surfaces. Density and optional photo wallpaper persist locally.
- Related choices use custom in-context menus. Tab movement is interruptible, preserves scroll and respects reduced-motion preference.
- Collection offers a statement file or pasted message, with batch acceptance and exception review. Sources are arbitrary; native notification collection remains explicitly unimplemented.

## Salary retention estimate

Current retained salary = received salary this month − net salary-funded cash expenses − installments actually paid this month. Credit-funded purchases are excluded from cash expenses and deducted at repayment instead. Historical assets, other income and personal goal transfers are excluded from this calculation.

Month-end salary remainder = current retained salary + known expected salary − unpaid installments − unmatched fixed bills − estimated remaining everyday salary spending. The everyday estimate uses recorded current-month nonfixed cash spending / elapsed days. It is sensitive to missing records and is not a live bank balance. Paying a reserved installment lowers current retention and removes its future obligation, preserving the month-end estimate when amounts match. Prior prototype balance anchors remain in backup data but no longer drive this screen. Goals can include historical savings and are never represented as entirely funded by this month’s salary.

## Current file support and limits

Bundled SheetJS Community Edition 0.20.3 reads the first Excel worksheet locally. CSV accepts UTF-8/GB18030 and quoted cells. Headers must contain recognizable date, amount and name/type columns; generic fields are `日期,名称,金额,类型,分类,账户,订单号`. Known Alipay/WeChat-style headers are recognized, but not every platform/version has been tested. CSV/Excel files containing ordinary income are supported. ZIP, encrypted workbooks, PDF and screenshot OCR remain unimplemented. Loan and platform-specific adapters need real, desensitized samples before claims of compatibility.

Current browser changes, uploaded covers and backup restores remain local. JSON export/restore and v1/v2 work/record migration remain available.

## Research / dependencies

- Android NotificationListenerService: https://developer.android.com/reference/android/service/notification/NotificationListenerService — native notifications are an incremental source, not a complete historical ledger.
- AutoAccounting: https://github.com/AutoAccountingOrg/AutoAccounting — investigated notification/SMS/OCR/Hook collection and plugin adapters. Its README documents varying Root/LSPosed, LSPatch and OCR prerequisites; GPL-3.0 license. No code copied or integration claimed.
- Copilot Money: https://help.copilot.money/en/articles/11157550-quick-start-guide — income/cash-flow, recurrence and exception review inspiration; US integrations do not imply availability for Chinese payment accounts.
- Apple motion: https://developer.apple.com/design/human-interface-guidelines/motion — short, interruptible transitions and reduced motion.
- Apple pickers: https://developer.apple.com/design/human-interface-guidelines/pickers — keep short choices in context.
- Apple segmented controls: https://developer.apple.com/design/human-interface-guidelines/segmented-controls
- Apple materials guidance: https://developer.apple.com/design/human-interface-guidelines/materials
- SheetJS: https://docs.sheetjs.com/docs/solutions/input/ ; bundled license at `dist/vendor/LICENSE-SheetJS.txt` (Apache-2.0).
- Photos: Unsplash images `photo-1546435770-a3e426bf472b`, `photo-1600210492486-724fe5c67fb0`, `photo-1469474968028-56623f02e42e`. Downloaded static assets; no third-party runtime image requests.

## Verification

Cloud Chromium v4 checks passed for salary isolation from assets/other income/old anchors; goal self-transfer; expense attribution; paid-installment invariance; original-price versus total/payment quotes; exact schedule cents; day/month/calendar equivalents; custom menu selection/outside click/Escape/reopen; custom emoji/tint/image icon and goal carry; material/font/layout theme changes, density/wallpaper persistence; summary-first flow; interruptible tabs/reduced motion; and 360/390/430/1280px layouts. A final targeted check passed for generic versus payroll incoming-message classification. Earlier v3 coverage included real Excel file upload, bulk review and backup validation. No real financial connection, Android device or APK was tested.
