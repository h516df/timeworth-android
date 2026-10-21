# TimeWorth · interaction prototype 03

Owner-private preview: https://timeworth-mobile-preview.cloudyloom133.chatgpt.site

A browser-local, mobile-first testbed for an eventual Android app. Initial data are fictional. No payment account, notification listener or remote financial storage is connected. No Android APK is produced in this phase.

## Product direction

Fewer steps is the primary constraint. The main question is “after salary arrives, what may remain at month end?” Category budgets are absent from the primary experience. Manual recording is an optional correction, not the daily workflow. Settings have no avatar or motivational header.

- Salary confirmation takes one amount and one save; editing the same salary does not duplicate it. Current available balance can be calibrated without rebuilding historic records.
- Home shows month-end estimate, received income and upcoming repayments. Calculation assumptions are inspectable.
- Repayments accept one sentence such as `招商信用卡 每月680 剩6期 25号`. Any provider name is supported. Known all-in payments do not invent a principal/interest breakdown. One-period amounts can be edited directly. Paid state affects cash flow without double counting.
- The purchase calculator can create a repayment directly, without another entity form. Supports interest, periodic fees, upfront fees and detailed installments.
- Wish collection uses photo cards; savings goals use full-width cover/progress cards. A wish becomes a goal in one action, with no required monthly saving commitment. Covers can be chosen or uploaded locally.
- Four themes (frost, cream, forest, night) apply immediately and persist.
- Collection offers a whole statement file or pasted message. Standard/common-header CSV and Excel are parsed locally; normal records are batched, suspected duplicates skipped unless explicitly reviewed. The UI explains what CSV means and supports arbitrary account names.
- Notification collection is explicitly a future native Android capability. The notification example is a labelled text simulation and never requests notification permission.

## Cash-flow estimate

Current derived available amount = opening available money + received cash income − recorded cash expenses (refunds netted) − actually paid installments − current-month goal allocations. Credit-funded purchases are excluded from cash expenses and deducted at repayment instead. A balance calibration sets an anchor and subsequent recorded differences adjust that anchor.

Month-end estimate = current available + confirmed expected future income − outstanding installments − unmatched fixed bills − estimated remaining everyday cash spending. Everyday spending uses current-month nonfixed recorded cash spending / elapsed days. This is sensitive to missing records; the UI shows sample size and warns it is not a live bank balance. The reference range varies only projected daily spending by ±30%; it is not a confidence interval. The small curve is an explicitly documented schematic, not an account history chart. Month-specific estimates are a prototype, not a complete multi-account accounting engine.

A paid installment reduces current cash and removes the corresponding future obligation, leaving the month-end estimate unchanged when the payment matches the reserved amount. Receipts and repayments are separate from consumption so the same credit purchase is not deducted twice.

## Current file support and limits

Bundled SheetJS Community Edition 0.20.3 reads the first Excel worksheet locally. CSV accepts UTF-8/GB18030 and quoted cells. Headers must contain recognizable date, amount and name/type columns; generic fields are `日期,名称,金额,类型,分类,账户,订单号`. Known Alipay/WeChat-style headers are recognized, but not every platform/version has been tested. CSV/Excel files containing ordinary income are supported. ZIP, encrypted workbooks, PDF and screenshot OCR remain unimplemented. Loan and platform-specific adapters need real, desensitized samples before claims of compatibility.

Current browser changes, uploaded covers and backup restores remain local. JSON export/restore and v1/v2 work/record migration remain available.

## Research / dependencies

- Android NotificationListenerService: https://developer.android.com/reference/android/service/notification/NotificationListenerService — native notifications are an incremental source, not a complete historical ledger.
- AutoAccounting: https://github.com/AutoAccountingOrg/AutoAccounting — investigated notification/SMS/OCR/Hook collection and plugin adapters. Its README documents varying Root/LSPosed, LSPatch and OCR prerequisites; GPL-3.0 license. No code copied or integration claimed.
- Copilot Money: https://help.copilot.money/en/articles/11157550-quick-start-guide — income/cash-flow, recurrence and exception review inspiration; US integrations do not imply availability for Chinese payment accounts.
- Apple materials guidance: https://developer.apple.com/design/human-interface-guidelines/materials
- SheetJS: https://docs.sheetjs.com/docs/solutions/input/ ; bundled license at `dist/vendor/LICENSE-SheetJS.txt` (Apache-2.0).
- Photos: Unsplash images `photo-1546435770-a3e426bf472b`, `photo-1600210492486-724fe5c67fb0`, `photo-1469474968028-56623f02e42e`. Downloaded static assets; no third-party runtime image requests.

## Verification

Cloud Chromium checks covered salary edit/idempotence, estimates without budgets, arbitrary-provider sentence entry, single-period amount editing, the paid-cash invariant, theme persistence, photo wishes/one-tap goal conversion, deposits, direct calculator-to-debt with fees, custom sources, labelled notification-text demo, actual Excel upload including income, bulk review, backup validation and 360/390/430/1280px layouts. No live bank or payment integrations were tested or enabled.
