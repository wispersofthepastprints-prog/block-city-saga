# Block City Saga — Product Requirements & Publishing Guide

> **August 2026 update:** "Tetris Architect" was renamed **Block City Saga** for trademark reasons (The Tetris Company owns the Tetris mark). The package name `com.wispersofthepast.tetrisarchitect` is immutable and stays as-is — it is not user-visible and is legally fine. Monetization was rebuilt: subscriptions and the Season Pass are **retired**, replaced by dual one-time purchases — **Remove Ads US$4.99** and **Premium Pack US$6.99** (includes Remove Ads + 2x city progress + golden block skins + unlimited energy) — plus rewarded "Continue" ads and 90-second-capped interstitials on restart. The legacy "Tetris Architect Pro" entitlement is grandfathered as Premium Pack. Sections below describing the old subscription model are kept for history; the monetization service code (`src/services/monetization.native.ts`) is the source of truth.

## Overview
**Block City Saga** is a portrait-only React Native / Expo SDK 54 mobile puzzle game for **Google Play Store (Android)**. Tetris-like pieces are drag-and-dropped onto an 8 × 10 grid; clearing rows triggers Tetris-style gravity, particle bursts, combo multipliers, and progressive unlock of a neon city skyline that cycles through day & night.

Package: `com.wispersofthepast.tetrisarchitect`
Version: 1.0.2 (versionCode 26+)

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

## Monetization Architecture (current — dual one-time IAP)
The monetization service is split across **platform-specific files** so the web preview never imports native-only SDKs:

| File | Used by | Behaviour |
|---|---|---|
| `src/services/monetization.ts` | Web preview (Metro picks on `Platform.OS === "web"`) | Pure mocks — every function resolves immediately |
| `src/services/monetization.native.ts` | Android / iOS dev-client + standalone (`Platform.OS !== "web"`) | Real RevenueCat & AdMob, with `Constants.appOwnership === "expo"` graceful-fallback for Expo Go |

Current model:
- **Entitlements**: `remove_ads` and `premium_pack` (legacy `Tetris Architect Pro` grandfathered as premium)
- **Products** (one-time, Google Play Billing via RevenueCat): `remove_ads` US$4.99, `premium_pack` US$6.99
- **Ads**: rewarded video (opt-in continues / energy refills, available to everyone) + interstitial on restart, capped at one per 90 seconds, removed permanently by either purchase
- Public API: `initializeMonetization()`, `getEntitlementState()`, `addEntitlementListener(cb)`, `purchaseProduct(id)`, `restorePurchases()`, `presentCustomerCenter()`, `showRewardedAd()`, `showInterstitialAd()`

### Environment variables (in `frontend/.env`)
| Var | Value | Notes |
|---|---|---|
| `EXPO_PUBLIC_RC_ANDROID_KEY` | `goog_…` production key | **Required before public release.** A `test_…` key is sandbox-only. |
| `EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID` | rewarded unit ID | Create unit "continue-rewarded" in AdMob |
| `EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID` | interstitial unit ID | Create unit "restart-interstitial" in AdMob |

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
- **Scoring**: cells × 5 base; row/col = clears × 100 × combo × passMul; 2× during Premium
- **Streak**: flame icon at 3+ consecutive clears
- **Grid Locked**: Watch Ad / Continue (50 c) / Go Ad-Free / Restart
- **Danger overlay**: pulsing red border at >75 % fill

## City Skyline (meta-progression)
- 6 buildings unlock at lines cleared: **5, 12, 20, 28, 38, 48** (per 60-line cycle)
- All 6 unlocked → "City Complete! +1000" bonus
- **Day / Night cycle**: 4-min period, 7 sky color stops (midnight → pre-dawn → dawn pink-purple → noon teal → dusk pink-amber → twilight → midnight)
- Stars fade in at night; horizon glow at dawn/dusk; building windows light up warm yellow at night

## Premium Pack (RevenueCat entitlement `premium_pack`)
- One-time US$6.99 purchase — **no subscriptions**
- Perks: no interstitial ads ever, 2× city progress, **golden block skins**, unlimited energy
- Remove Ads (US$4.99, entitlement `remove_ads`) removes interstitials only; included in Premium Pack
- Customer Center accessible from Settings → **MANAGE PURCHASES**
- Upsells in: Shop footer, Game-Over modal, Energy modal

## Audio / Haptics
- **SFX**: synthesised WAVs for tap, drop, invalid, line clear, combo, bonus, coin
- **Music**: 8-second arcade loop at 110 BPM (synth bass + sparkly arpeggio + 4/4 kick + offbeat hi-hat) at 22 % volume — toggleable
- **Haptics**: every interaction — toggleable

## Compliance
- **Privacy Policy**: https://wispersofthepastprints-prog.github.io/block-city-saga/privacy-policy.html
- **Terms of Service**: https://wispersofthepastprints-prog.github.io/block-city-saga/terms-of-service.html
- **Developer website**: https://wispersofthepastprints-prog.github.io/ (hosts `app-ads.txt` for AdMob)
- Both linked in Settings modal as required by Play Store IAP/ads policy

---

# 🚀 Final Path to Play Store

## What's done (in this codebase)
- ✅ Package name `com.wispersofthepast.tetrisarchitect`, app name "Block City Saga"
- ✅ Real RevenueCat + AdMob wired into `monetization.native.ts` (dual one-time IAP)
- ✅ Web-safe stub `monetization.ts` keeps the preview working
- ✅ AdMob plugin + App IDs configured in `app.json`
- ✅ Privacy Policy + Terms URLs live in Settings modal
- ✅ "MANAGE PURCHASES" button → Customer Center
- ✅ Dual purchase buttons + Restore purchases on Premium modal
- ✅ Daily rewards, energy bar, shop, undo, streak, gravity, day-night cycle, modals, audio, haptics
- ✅ Permissions hardened (`VIBRATE`, `AD_ID` only; everything else explicitly blocked)
- ✅ `eas.json` build profiles (dev / preview / production)

## What you must do before submitting

### A. RevenueCat dashboard setup
1. Log in at https://app.revenuecat.com
2. Create entitlements **`remove_ads`** and **`premium_pack`** (keep legacy "Tetris Architect Pro" attached to the premium product for grandfathering)
3. Add products `remove_ads` and `premium_pack` (created in Play Console first), attach to the matching entitlements
4. Add both packages to the **current Offering**
5. Copy the **`goog_…` Android SDK key** (Settings → API keys) into `frontend/.env` as `EXPO_PUBLIC_RC_ANDROID_KEY`

### B. Google Play Console setup
1. Under **Monetize → Products → In-app products**: create one-time products **`remove_ads`** (US$4.99) and **`premium_pack`** (US$6.99), both set **Active**
2. **Store listing**: app name **Block City Saga**, screenshots, description
3. **Content rating** (IARC): puzzle game → E; **Target audience**: 13+
4. **Data Safety**: declare AdMob advertising ID, purchase history via Google Play Billing/RevenueCat, local-only storage — must match the privacy policy
5. **Privacy Policy URL**: https://wispersofthepastprints-prog.github.io/block-city-saga/privacy-policy.html
6. **Website**: https://wispersofthepastprints-prog.github.io/
7. **App access**: "All functionality is available without restrictions"
8. **Ads**: yes, contains ads

### C. AdMob production setup
1. Create ad units **"continue-rewarded"** (rewarded) and **"restart-interstitial"** (interstitial); put their IDs in `frontend/.env`
2. `app-ads.txt` is live at https://wispersofthepastprints-prog.github.io/app-ads.txt — the Play Console listing website URL must match this domain for AdMob verification
3. Add your dev phone as a **test device** in AdMob settings

### D. Build & test
```bash
cd frontend
npx eas build --profile preview --platform android
```
Install the APK and verify: gameplay, rewarded ad continue, interstitial on restart (90 s cap), both purchase buttons, restore purchases, settings policy links open the live pages.

### E. Production AAB & Play submission
1. Verify the `goog_…` RevenueCat key and both real ad unit IDs are in `.env`
2. `npx eas build --profile production --platform android` → `.aab`
3. Upload to the testing track → promote through closed testing (≥12 testers × 14 days for new personal accounts) → production
