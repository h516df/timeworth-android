# TimeWorth 2.0 product delivery batch (2026-11-01)

Coordination task `timeworth2-product-20261101`, base `6b41d80791c873d8baea6ca8a8f76596a0205c93` (merged original-key #17 and UI #18).

## Scope delivered to CI

- Bump `versionCode 1 -> 2`, `versionName 0.1.0 -> 2.0.0`, unchanged `dev.h516.timeworth` and original protected signing identity.
- Point `assets/product/index.html` (the unchanged native `MainActivity.START` route) at three-entry 2.0 UI.
- Android ACTION_OPEN_DOCUMENT supports 1–10 screenshots per batch. Bundled Google ML Kit Simplified Chinese text recognizer processes images on device; no new permission, screenshot uploads or image retention.
- Explicit OCR confirmation, manual fixes, no guessed year, exact dedup, opted-in same-date update, immediate undo. Import creates only repayment plans with **unknown principal/fee breakdown**, never transactions.
- Transient job/commute/car/rent scenario comparisons, cautious unknown calculations, optional living reserve, 2.0 settings/about.
- Preserve legacy v2 storage and historical transaction read-only access. Repair loading a saved zero-income native state and safe v1 savings migration.
- New QA: pure OCR/scenario/migration tests, Chromium manual-error/undo/scenario/entry tests, Android build and certificate-gated publish workflow.

## Delivery guardrails

- Android `assembleRelease` is unsigned before it reaches protected `android-signing` environment. `cloud/sign_apk.py` rechecks actual original private key and SHA256 certificate; release workflow refuses overwrites.
- Release workflow on `main` publishes `v2.0.0` only if product CI and protected signing both succeed. PRs never receive signing material and do not publish.
- All app-private localStorage stays in the same WebView origin. Never remove `transactions` or legacy balances during upgrade, uninstall the app or rotate the keystore.
- Update manager reads the separate **public** `h516df/app-releases` stable manifest. After an actual signed public artifact is available, update that manifest with verified asset metadata; never advertise an unverified APK.

## Remaining acceptance on a physical phone

- Check screenshot accuracy against multiple real 花呗/白条 formats, recognition failure and manual correction, and low-memory device behavior.
- Install 0.1.0, export backup, add sample user data; overlay 2.0.0 with same signer, compare all data and test check-update/download/system install. Manual device inspection and original-signing cold recovery are not replaced by cloud CI.
