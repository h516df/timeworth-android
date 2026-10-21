# TimeWorth · mobile interaction prototype 02

Owner-private preview: https://timeworth-mobile-preview.cloudyloom133.chatgpt.site

Buildless HTML/CSS/JavaScript in `dist/`; serve with a static HTTP server. No framework build or external assets are required. The native Android implementation is a later phase; this is not an APK.

## Implemented interactions

- Apple-inspired large titles, grouped lists, focused value editors, minute-based commute presets/slider, translucent navigation, dark appearance and reduced-motion support.
- Editable income, work days/hours/costs, two consistent hourly-rate bases, category budgets and net spending.
- Purchase calculator with custom terms, zero interest, fixed periodic fee, nominal annual interest with equal installments, upfront fee, penny-adjusted schedule and cashflow-derived reference annual rate. Example fees are not platform offers.
- Repayment create/edit/delete, per-period principal/fee/date editing and paid/unpaid toggles. Changes affect monthly totals. Regenerating an already paid schedule requires an explicit warning.
- Wish create/edit/delete, conversion to a savings goal; goal edits, deposits/withdrawals and movement deletion, with current-month allocation reflected on the overview.
- All demo import records are selectable, source switching, refund classification, explicit duplicate override, existing repayment merge without double-counting consumption.
- Browser-local CSV parsing, quoted cells, UTF-8/GB18030, standard template download, common Alipay/WeChat header recognition, review before import. Supports standard CSV for other accounts; Huabei/Baitiao PDF/screenshots and platform-specific exports remain unimplemented.
- Transaction editing/deletion; local persistence, prior-preview work/record migration, JSON backup export and validated restore.

## Calculation boundaries

The overview is an income-allocation estimate, not a bank balance: income minus per-category maximum of budget/net spending, minus all installment obligations for the current month, minus current-month net goal deposits. Marking an installment paid reduces pending repayments without freeing its already reserved allocation. Repayment imports do not create another expense. Initial goal savings are historical and do not subtract again this month. Refunds reduce net category spending.

Calculator fixed fees are charged against the original financed principal each period. APR mode uses nominal annual rate / 12 and equal monthly installments. Upfront fee is charged with the first installment. Reference annualized rate is monthly cashflow IRR × 12, assuming equally spaced months; actual due-date day counts and platform APR disclosures can differ.

## Verification

Cloud Chromium checks covered minute editing, hourly-basis changes, calculator fees/APR, schedule cent rounding, repayment creation/edit/paid toggles, wish-to-goal conversion, deposits/withdrawals, all import selections and duplicate review, repayment merging, actual quoted CSV upload, expense editing, persistence, JSON restore, prior-version migration, modal dismissal and layouts at 360/390/430/1280px. Scripts are retained in the cloud task artifacts. No live financial accounts or production billing formats were used.

## References

- Apple Human Interface Guidelines / Materials: https://developer.apple.com/design/human-interface-guidelines/materials — glass is used sparingly for navigation and controls; financial content remains readable.
- Cashew: https://github.com/jameskokoska/Cashew — inspiration for editable budgets, goals and transactions. No source code copied.

All initial records are synthetic. User changes and files stay in the current browser; there is no server-side financial storage or cross-device sync. Export a backup before clearing browser data.
