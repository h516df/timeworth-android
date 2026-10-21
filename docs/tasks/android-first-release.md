# Android first usable version · 2026-10-21

User request: “好，开发吧，让我可以使用”. Cloud only; continue the existing TimeWorth product rather than recreate the prototype.

Base: product PR #3 / `f06c0a85d79589d2fbd75147276391cf6015ef62`. Independent branch `codex/android-first-release-20261021`; ownership registered in the shared coordination branch. Existing product branch is preserved. Batch: `android-first-release-20261021`.

## Delivery checkpoint

- APK product source: `718832345d6cf46fdf7be92f1cf8c0c5872dc348`; Android 8.0+, universal (no native ABI libraries), distinct `dev.h516.timeworth.preview` / version `0.1.0-preview` / code 1. The original stable certificate is unchanged.
- Original signed build run [39598429467](https://github.com/h516df/timeworth-android/actions/runs/39598429467) failed before any steps. Check annotation explicitly says account payments failed or spending limit must be increased. No billing settings changed; workflow now runs on demand rather than retrying on every push.
- API-30 software emulator booted but its system services died (`com.android.systemui`, phone and Bluetooth `DeadSystemException`); installation did not complete. Emulator stopped; no physical phone check is claimed.
- Final native browser check also disabled `crypto.randomUUID` to exercise the secure UUID fallback, saved a wish and restored data successfully. Native engine-upgrade guidance is included for older system WebViews.
- Android API-26 lint and debug compile passed after adding explicit local-only backup rules and a distinct preview label. Actual native document-provider, update installation and physical-device behavior remain unverified.
- Private delivery page prepared: https://chatgpt.com/space/page_42f579b273ac81919688f4bb471bd035 . Integration will attach the verified APK; public stable manifest remains unavailable.

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
