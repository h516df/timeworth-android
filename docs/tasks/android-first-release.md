# Android first usable version · 2026-10-21

User request: “好，开发吧，让我可以使用”. Cloud only; continue the existing TimeWorth product rather than recreate the prototype.

Base: product PR #3 / `f06c0a85d79589d2fbd75147276391cf6015ef62`. Independent branch `codex/android-first-release-20261021`; ownership registered in the shared coordination branch. Existing product branch is preserved. Batch: `android-first-release-20261021`.

## Scope and acceptance

1. Installable offline Android APK: salary/work-time setup, monthly salary, spending-to-time conversion and existing debt/goals/themes.
2. Empty initial data; persist across reopening; validate and restore existing browser v2 backups; native document import/export.
3. Android back/system bars; smoother option/dialog appearance without restarting content animation on every input; respect reduced motion (TW-001).
4. Per-app public update check, cancellable download, size/hash/package/version/signature verification and system installer; no embedded GitHub login.
5. Source saved remotely, APK/source metadata verified, actual build/distribution/phone evidence distinguished. No personal accounts, notification collection or OCR implied.

## Implementation and current checks

The original product assets are compiled into an Android WebViewAssetLoader shell. Native operations are restricted to the reserved HTTPS origin/main frame. The browser demo remains separate; native setup starts with an empty ledger. Wrapper Gradle 8.11.1 checksum verified; AGP 8.9.2, compile/target 35, min 26, Java 17 source / Java 21 build; AndroidX WebKit/Core pinned.

Checks passed on the current worktree (base above + this branch's changes):

- `node --test ui-preview/qa/finance.test.cjs`: seven existing financial rule groups.
- Existing `cloud/run-ui-checks.py`: three browser scenarios covering monthly salary, installment fees/timing, imports, themes, icons and layouts.
- `node ui-preview/qa/native.cjs`: actual Chromium at the Android content origin; fresh setup, salary/time conversion, receipt, reload, native export/update messages, invalid-backup rejection and browser-v2 restore, small/tablet screens, reduced motion; screenshot/video evidence is temporary synthetic data.
- `:app:assembleDebug`, unsigned `:app:assembleRelease`, `:app:lintDebug`: passed in this cloud workspace. Lint caught an API-27-only style on min 26; removed before passing. Earlier signing-config failure was fixed by not applying a release signing config without the existing secrets.
- Signed debug APK identity/size/hash/certificate and every bundled product asset checked with `tools/verify-apk.py`. Debug has a distinct preview package; it is not the original stable signing identity.
- `actionlint 1.7.7` checked the real signed-build workflow; downloaded tool SHA256 verified against upstream checksums.

A backup-restore check exposed double history-back navigation; fixed before native browser scenario passed. Signing workflow is not a release claim: current Actions availability, original signing recovery, actual APK download, device install/persistence and update coverage still need actual results. Previously Actions were blocked before running due to account payment/spending limit; do not change billing or repeatedly retry.

Android emulator boot/installation is being checked separately. No physical phone has been operated in this task. No APK or stable manifest has been published at this checkpoint.
