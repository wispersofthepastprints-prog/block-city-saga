# Tetris Architect — Product Requirements & Publishing Guide

## Overview
**Tetris Architect** is a portrait-only React Native / Expo SDK 54 mobile puzzle game for **Google Play Store (Android)**. Tetris-like pieces are drag-and-dropped onto an 8 × 10 grid; clearing rows triggers Tetris-style gravity, particle bursts, combo multipliers, and progressive unlock of a neon city skyline that cycles through day & night.

Package: `com.wispersofthepast.tetrisarchitect`
Version: 1.0.0 (versionCode 1)

## Tech Stack
- **Framework**: Expo SDK 54 + expo-router (file-based)
- **Language**: TypeScript
- **Rendering**: React Native, `react-native-svg` for skyline
- **Animations**: `react-native-reanimated` 4 + `react-native-gesture-handler`
- **Audio**: `expo-audio` — synthesised WAV SFX + 8 s arcade-loop music
- **Haptics**: `expo-haptics`
- **Storage**: AsyncStorage via `@/src/utils/storage`
- **Icons**: in-house `Icon` component using unicode glyphs
- **Monetization**: RevenueCat (`react-native-purchases` + `react-native-purchases-ui`) + Google AdMob (`react-native-google-mobile-ads`)

## Monetization Architecture
The monetization service is split across **platform-specific files** so the web preview never imports native-only SDKs:

| File | Used by | Behaviour |
|---|---|---|
| `src/services/monetization.ts` | Web preview (Metro picks on `Platform.OS === "web"`) | Pure mocks — every function resolves immediately |
| `src/services/monetization.native.ts` | Android / iOS dev-client + standalone (`Platform.OS !== "web"`) | Real RevenueCat & AdMob, with `Constants.appOwnership === "expo"` graceful-fallback for Expo Go |

Public API (identical in both):
- `initializeMonetization()` — called once in `app/_layout.tsx`
- `presentProPaywall()` — shows the RevenueCat remote-configured Paywall (lifetime / yearly / monthly)
- `presentCustomerCenter()` — shows the RevenueCat-hosted "Manage Subscription" screen
- `hasProEntitlement()` — checks for the **"Tetris Architect Pro"** entitlement
- `addEntitlementListener(cb)` — live updates whenever subscription state changes
- `purchaseProduct(id)` — direct purchase fallback (rarely used; paywall preferred)
- `restorePurchases()` — for "Restore purchases" button
- `showRewardedAd()` — preloaded AdMob rewarded ad; promise resolves with `{ rewarded }`

### Environment variables (in `/app/frontend/.env`)
| Var | Value | Notes |
|---|---|---|
| `EXPO_PUBLIC_RC_ANDROID_KEY` | `test_jJShMostMnjSFsAjSNGQINATFaR` | **TEST KEY — sandbox only.** Replace with the `goog_…` production key before launching to public Play Store track. |
| `EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID` | `ca-app-pub-1508365322358813/7905509396` | Production rewarded unit; the code uses `TestIds.REWARDED` in `__DEV__` so you can develop without burning real impressions. |

### `app.json` config
- AdMob Android App ID: `ca-app-pub-1508365322358813~3278044849`
- AdMob iOS App ID: placeholder (not targeting iOS yet)
- Plugin: `react-native-google-mobile-ads` (handles native AdMob init)
- Plugin: `expo-dev-client` (allows building a dev-client APK)
- Plugin: `expo-audio`
- Plugin: `expo-router`
- Plugin: `expo-splash-screen`
- `android.permissions`: `VIBRATE`, `com.google.android.gms.permission.AD_ID`
- All other permissions explicitly **`blockedPermissions`** (Play Console hygiene)

## Game Loop
- **Grid**: 8 × 10, 36 px cells, 3 px gap
- **Pieces**: 3 random pieces in compact bottom tray; new set spawns when all 3 placed
- **Drag-drop**: floating 3D ghost lifts 70 px above finger, translucent on-grid preview, snap-back on invalid release
- **Line clears**: full row OR column clears, **then per-column gravity collapses remaining blocks** (Tetris-style)
- **Scoring**: cells × 5 base; row/col = clears × 100 × combo × passMul; 2× during Pro
- **Streak**: flame icon at 3+ consecutive clears
- **Grid Locked**: Watch Ad / Continue (50 c) / Unlock Pro / Restart
- **Danger overlay**: pulsing red border at >75 % fill

## City Skyline (meta-progression)
- 6 buildings unlock at lines cleared: **5, 12, 20, 28, 38, 48** (per 60-line cycle)
- All 6 unlocked → "City Complete! +1000" bonus
- **Day / Night cycle**: 4-min period, 7 sky color stops (midnight → pre-dawn → dawn pink-purple → noon teal → dusk pink-amber → twilight → midnight)
- Stars fade in at night; horizon glow at dawn/dusk; building windows light up warm yellow at night

## Tetris Architect Pro (RevenueCat entitlement)
- Three offerings: **Lifetime**, **Yearly**, **Monthly** — shown via the RevenueCat Paywall UI
- Perks: 2× scene progress, **golden block skins**, unlimited energy, no ads, exclusive daily rewards
- Customer Center accessible from Settings → **MANAGE SUBSCRIPTION** (only shown when subscribed)
- Aggressive but tasteful upsells in: Shop footer, Game-Over modal, Energy modal

## Audio / Haptics
- **SFX**: synthesised WAVs for tap, drop, invalid, line clear, combo, bonus, coin
- **Music**: 8-second arcade loop at 110 BPM (synth bass + sparkly arpeggio + 4/4 kick + offbeat hi-hat) at 22 % volume — toggleable
- **Haptics**: every interaction — toggleable

## Compliance
- **Privacy Policy**: https://wispersofthepastprints-prog.github.io/WhisperBall/tetris-architect-privacy.html
- **Terms of Service**: https://wispersofthepastprints-prog.github.io/WhisperBall/tetris-architect-terms.html
- Both linked in Settings modal as required by Play Store IAP/ads policy

---

# 🚀 Final Path to Play Store

## What's done (in this codebase)
- ✅ Package name `com.wispersofthepast.tetrisarchitect`, app name "Tetris Architect"
- ✅ Real RevenueCat + AdMob wired into `monetization.native.ts`
- ✅ Web-safe stub `monetization.ts` keeps the preview working
- ✅ AdMob plugin + App IDs configured in `app.json`
- ✅ Privacy Policy + Terms URLs live in Settings modal
- ✅ "MANAGE SUBSCRIPTION" button → Customer Center (when Pro is active)
- ✅ "CHOOSE A PLAN" button on Pro modal → Paywall with all 3 SKUs
- ✅ Daily rewards, energy bar, shop, undo, streak, gravity, day-night cycle, modals, audio, haptics
- ✅ Permissions hardened (`VIBRATE`, `AD_ID` only; everything else explicitly blocked)
- ✅ All deprecation warnings cleaned (`shadow*`, `textShadow*`, `pointerEvents`)
- ✅ `eas.json` build profiles (dev / preview / production)

## What you must do before submitting (one-time, ~3 hours)

### A. RevenueCat dashboard setup (15 min)
1. Log in at https://app.revenuecat.com
2. Create project "Tetris Architect" → add **Google Play** app with package `com.wispersofthepast.tetrisarchitect`
3. Under **Entitlements**, create one entitlement with identifier exactly **`Tetris Architect Pro`**
4. Under **Products** (or via the Play Console import), add **three products** with IDs `lifetime`, `yearly`, `monthly` — attach each to the `Tetris Architect Pro` entitlement
5. Under **Offerings**, set the current offering to include all three packages
6. **Paywalls** → Create a Paywall for the current offering with the visual template you prefer. This is what `presentProPaywall()` will display.
7. When ready for production: copy your **`goog_…` Android SDK key** (Settings → API keys), and replace `EXPO_PUBLIC_RC_ANDROID_KEY` in `/app/frontend/.env`

### B. Google Play Console setup (45 min)
1. Sign up: https://play.google.com/console ($25 one-time)
2. Create app "Tetris Architect" → package `com.wispersofthepast.tetrisarchitect` → Game → Free → with ads + IAP
3. Under **Monetize → Products**:
   - Subscription product `monthly` (auto-renewing, base plan $4.99 / month)
   - Subscription product `yearly` (auto-renewing, base plan $39.99 / year)
   - In-app product `lifetime` (one-time, $79.99) — managed product, not consumable
4. Link them to RevenueCat (in RevenueCat dashboard → Google Play Service Account JSON upload)
5. **Store listing**: title (30 chars), short description (80 chars), full description (4000 chars), icon 512×512, feature graphic 1024×500, 2-8 phone screenshots
6. **Content rating** (IARC questionnaire): puzzle game, no objectionable content → rated E
7. **Target audience**: 13+
8. **Data Safety**: declare AsyncStorage, no PII, IAP via Google Play, AdMob ads, advertising ID usage
9. **Privacy Policy URL**: https://wispersofthepastprints-prog.github.io/WhisperBall/tetris-architect-privacy.html
10. **App access**: "All functionality is available without restrictions"
11. **Ads**: yes, contains ads

### C. AdMob production setup (10 min)
1. https://admob.google.com → add app with Play Store URL
2. The App ID `ca-app-pub-1508365322358813~3278044849` is already wired into `app.json`
3. The Rewarded Unit ID `ca-app-pub-1508365322358813/7905509396` is already in `/app/frontend/.env`
4. Add your dev phone as a **test device** in AdMob settings so you don't rack up real impressions
5. (Optional) link AdMob to a Firebase project for revenue + retention analytics

### D. Build & test (30 min)
```bash
cd /app/frontend
eas login          # uses your expo.dev account
eas init           # generates a project ID — paste it into app.json → extra.eas.projectId
eas build --profile development --platform android
```
Download the APK from the build URL, install on your phone, open it, and verify:
- Drag/drop & gameplay
- Pro modal "CHOOSE A PLAN" → opens the real RevenueCat Paywall with 3 products
- Watch Ad buttons → show a real AdMob test ad → grant energy / continue
- Settings → "MANAGE SUBSCRIPTION" (after a sandbox purchase) → opens Customer Center

### E. Production AAB & Play submission (~1 hour + 3-7 day review)
1. Make sure you've swapped the `test_…` RevenueCat key for a `goog_…` key in `.env`
2. `eas build --profile production --platform android`  → produces `.aab`
3. In Play Console → Internal Testing → upload the AAB → add internal testers → wait ~2 hours
4. Test on a real device with a real Google account
5. Promote Internal → Closed Testing → Production
6. Submit for review (3-7 days typical)

## Smart business enhancement
**"Lifetime" tier as the high-LTV anchor.** Most block-puzzle apps only sell a monthly sub; offering Lifetime alongside Monthly/Yearly in the same RevenueCat Paywall lets 1-3 % of engaged players convert into ~$80 one-time purchasers — a meaningful slice of revenue with zero churn. The Pro entitlement triggers golden block skins immediately, which is socially visible (screenshots, replays) and acts as a daily reminder of value for retention.
