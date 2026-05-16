# Block Architect — Product Requirements & Publishing Guide

## Overview
**Block Architect** is a portrait-only React Native / Expo SDK 54 mobile puzzle game targeting **Google Play Store (Android)**. Tetris-like pieces are drag-and-dropped onto an 8×10 grid; clearing rows triggers Tetris-style gravity, particle bursts, combo multipliers, and progressive unlock of a neon city skyline that cycles through day & night.

## Tech Stack
- **Framework**: Expo SDK 54 + expo-router (file-based routing)
- **Language**: TypeScript
- **Rendering**: React Native (no web-specific deps), `react-native-svg` for skyline
- **Animations**: `react-native-reanimated` 4 + `react-native-gesture-handler` for 60 fps drag-drop & micro-animations
- **Audio**: `expo-audio` — synthesised WAV SFX + 8-second arcade-loop atmospheric music
- **Haptics**: `expo-haptics` (light / medium / heavy / success / error / selection)
- **Storage**: AsyncStorage via `@/src/utils/storage`
- **Icons**: in-house `Icon` component using unicode glyphs (avoids `@expo/vector-icons` Expo Go font bugs)
- **No backend**: 100 % offline-capable

## Gameplay
- **Grid**: 8 columns × 10 rows, 36 px cells, 3 px gap
- **Pieces**: 3 random pieces spawn in a compact bottom tray; new set spawns when all 3 placed
- **Drag-drop**: floating 3D ghost lifts 70 px above finger; translucent on-grid preview; green glow valid / red overlay invalid; snap-back on invalid release
- **Line clears**: full row OR column clears, **then per-column gravity collapses remaining blocks to the bottom** (Tetris-style)
- **Scoring**: cells × 5 base; row/col clear = clears × 100 × combo × passMul; cascading clears chain combo; 2× score active during Season Pass
- **Streak**: increments on every line clear; flame icon ignites at 3+
- **Grid Locked**: shows Game Over modal with Watch Ad / Continue (50 c) / Buy Pass / Restart
- **Danger overlay**: pulsing red border when grid >75 % full

## City Skyline (meta-progression)
- 6 buildings unlock at lines cleared: **5, 12, 20, 28, 38, 48** (per 60-line cycle)
- All 6 unlocked → "City Complete! +1000" bonus, scene resets, loop continues
- **Day / Night cycle**: 4-minute period; sky smoothly transitions through 7 color stops (midnight → pre-dawn → dawn pink-purple → noon teal → dusk pink-amber → twilight → midnight)
- **Stars** fade in at night; **horizon glow** band brightens at dawn / dusk; **windows** light up warm yellow at night (per-window deterministic pattern)

## Monetization UI
- **Top bar**: Score · 🔥 Streak · ↶ Undo · ◉ Coins · ⚙ Settings + 5-segment Energy bar
- **Daily Rewards**: 7-day calendar (20, 30, 50, 75, 100, 150, 200) auto-shown on first launch of a new calendar day
- **Shop**: 4 consumables — Hints 15 c, Undos 25 c (gives +3), Hammer 60 c, Energy Refill 40 c
- **Season Pass** `$4.99/month`: 2× scene progress, golden block skins, unlimited energy, no ads (pushed in Shop footer, Game-Over modal, Energy modal)
- **Undo**: 3 free per session; tapping at 0 opens Shop

## Audio / Haptics
- **SFX (priority)**: synthesised WAVs for tap, drop, invalid, line clear, combo, bonus, coin — no external assets
- **Music**: 8-second arcade loop at 110 BPM (synth bass, sparkly arpeggio, four-on-the-floor kick, offbeat hi-hat) at 22 % volume — toggleable
- **Haptics**: every interaction tactile — toggleable

## Persistence
All on-device via AsyncStorage:
- `ba_high_score`, `ba_coins`, `ba_undos`, `ba_energy`, `ba_pass_active`, `ba_lines`
- `ba_daily_day`, `ba_daily_date` (rolling 7-day calendar)
- `ba_sfx`, `ba_music`, `ba_haptics` (settings)

---

# 🚀 Google Play Store Publishing Guide

## ✅ What's already production-ready
| Item | Status | Location |
|---|---|---|
| Portrait orientation lock | ✅ | `app.json` `orientation: portrait` |
| Dark UI theme | ✅ | `userInterfaceStyle: dark` |
| App icon + adaptive icon | ✅ | `assets/images/icon.png`, `adaptive-icon.png` |
| Splash screen | ✅ | `expo-splash-screen` plugin |
| Package name | ✅ | `com.emergent.blockarchitect` |
| Bundle identifier | ✅ | `com.emergent.blockarchitect` |
| Version 1.0.0, versionCode 1 | ✅ | `app.json` |
| New Architecture (TurboModules) | ✅ | `newArchEnabled: true` |
| Permissions minimised | ✅ | only `VIBRATE`; all others blocked |
| Privacy / Terms links in Settings | ✅ | `Modals.tsx` SettingsModal |
| `eas.json` build profiles | ✅ | dev / preview (APK) / production (AAB) |
| Edge-to-edge disabled | ✅ | so tray pieces clear nav-bar |
| Local-only data (no PII, no network) | ✅ | AsyncStorage only |
| No deprecated style props | ✅ | all `shadow*`/`textShadow*`/`pointerEvents` migrated |

## 🔧 What you must complete before submission

### 1. Register / configure Expo + Google Play accounts (15 min)
- Run `eas login` once
- `eas init --id <projectId>` then paste the EAS project ID into `app.json` → `extra.eas.projectId`
- Create a Google Play Console developer account ($25 one-time)
- Create the app in Play Console with package `com.emergent.blockarchitect`

### 2. Replace placeholder Privacy & Terms URLs (5 min)
Open `/app/frontend/src/components/Modals.tsx` and replace:
- `https://blockarchitect.app/privacy` → your actual privacy policy URL
- `https://blockarchitect.app/terms` → your actual terms URL

Both must be publicly accessible HTTPS pages. Easiest: host on GitHub Pages, Notion, or a free static site.
Mandatory under Google Play policies because the app has IAP and (planned) ads.

### 3. Wire real Google Play Billing (Season Pass + coin packs) — ~1 hour
Currently `/app/frontend/src/services/monetization.ts` mocks all purchases (resolves after 1 s). To go live:

```bash
cd /app/frontend
npx expo install react-native-purchases expo-dev-client
```

Add the plugin to `app.json` → `plugins`:
```json
["react-native-purchases", {}]
```

Sign up at https://www.revenuecat.com (free up to $10k MTR) and:
1. Create a "Block Architect" project; add Android app with package `com.emergent.blockarchitect`
2. Create a subscription product `block_architect_season_pass` ($4.99/mo monthly base plan) in Play Console; link it to RevenueCat as entitlement `season_pass`
3. (Optional) consumable products: `coins_small`, `coins_medium`, `coins_large`
4. Copy your **Android public SDK key** (starts with `goog_`)

Replace the mock body of `monetization.ts` with:
```ts
import Purchases from "react-native-purchases";

export async function purchaseProduct(productId) {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find(p => p.identifier === productId);
  if (!pkg) return { success: false, productId };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const success = customerInfo.entitlements.active.season_pass !== undefined;
    return { success, productId };
  } catch { return { success: false, productId }; }
}
```

And in `_layout.tsx` initialise once:
```ts
import Purchases from "react-native-purchases";
Purchases.configure({ apiKey: "goog_xxx..." });
```

### 4. Wire AdMob rewarded ads (energy refill + game-over continue) — ~30 min
```bash
npx expo install react-native-google-mobile-ads
```

In `app.json` → root `plugins`:
```json
["react-native-google-mobile-ads", {
  "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
}]
```

Get the AdMob App ID + Rewarded Ad Unit ID from https://admob.google.com (free):
1. Create app "Block Architect" → Android, link to Play Console
2. Create one **Rewarded** ad unit → note its ID `ca-app-pub-…/…`
3. Add **test device IDs** during development

Replace `showRewardedAd` in `monetization.ts`:
```ts
import { RewardedAd, RewardedAdEventType, TestIds } from "react-native-google-mobile-ads";
const unit = __DEV__ ? TestIds.REWARDED : "ca-app-pub-…/…";
export async function showRewardedAd() {
  return new Promise(resolve => {
    const ad = RewardedAd.createForAdRequest(unit);
    let rewarded = false;
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => (rewarded = true));
    ad.addAdEventListener("closed", () => resolve({ rewarded }));
    ad.load();
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show());
  });
}
```

### 5. Generate a dev client and test on a real device — ~20 min
```bash
eas build --profile development --platform android
```
Install the resulting APK → side-load → log into the Expo Go-replacement dev client → test the real IAP + Ads end-to-end.

### 6. Build the release AAB — ~15 min
```bash
eas build --profile production --platform android
```
This produces an `.aab` (Android App Bundle, mandatory for Play Store since Aug 2021). Auto-increments `versionCode`.

### 7. Submit to Play Console — ~30 min
- Upload the AAB to **Internal Testing** track first
- Fill in **store listing**: title, short description, full description, screenshots (at least 2 phone screenshots 16:9 or 9:16), feature graphic 1024×500, app icon 512×512
- Fill in **Content rating** (E for Everyone — has no objectionable content, includes IAP + ads disclosure)
- Fill in **Data Safety** form: declare AsyncStorage usage, no PII collected, IAP via Google Play, AdMob ads
- Fill in **Privacy Policy URL** (must match the one inside the Settings modal)
- Add at least one internal tester email, push to Internal Testing
- After internal testing passes → promote to **Closed Testing** → then **Production**

### 8. Optional polish before 1.0 launch
- Add 2-3 phone screenshots showcasing skyline at day + skyline at night + a combo clear
- Record a 30 s gameplay video for the Play Store listing
- Create a 1024×500 feature graphic (use any image editor; export the in-game skyline as PNG)
- Set up `appsflyer` or `Firebase Analytics` for attribution if you plan paid UA later
- Add Crashlytics (`@sentry/react-native`) before scaling

## 📁 Key files
- `/app/frontend/app/_layout.tsx` — Gesture root + safe-area
- `/app/frontend/app/index.tsx` — entry, renders `GameScreen`
- `/app/frontend/src/components/GameScreen.tsx` — orchestrator (state, drag callbacks, modals)
- `/app/frontend/src/components/GameGrid.tsx` — 8×10 grid + hover overlay + flash anim
- `/app/frontend/src/components/Tray.tsx` — draggable tray slots (Reanimated/Gesture)
- `/app/frontend/src/components/Skyline.tsx` — SVG skyline + day/night cycle
- `/app/frontend/src/components/Block.tsx` — 3D-beveled cell
- `/app/frontend/src/components/Modals.tsx` — Daily / Shop / Pass / Game Over / Energy / Settings
- `/app/frontend/src/components/Icon.tsx` — unicode-glyph icon component
- `/app/frontend/src/components/Burst.tsx`, `FloatingText.tsx`, `RainbowBorder.tsx`, `TopBar.tsx`
- `/app/frontend/src/game/pieces.ts`, `logic.ts` (includes `applyGravity`)
- `/app/frontend/src/services/audio.ts` — synthesised SFX + arcade-loop music
- `/app/frontend/src/services/monetization.ts` — IAP/Ads abstraction (currently mocked)
- `/app/frontend/app.json` — production-ready manifest
- `/app/frontend/eas.json` — EAS build profiles

## 💡 Smart business enhancement
**Season-Pass-driven retention loop** — the Pass is surfaced contextually (Game Over, Energy depleted, Shop footer) and visually elevated with gold accents. The Golden Block Skin cosmetic is the carrot for non-monetary players and instantly visible on every placement once subscribed, creating a daily visible reminder of value and an envy-driver in shared screenshots. Combined with the 7-day Daily Rewards loop and the unlocking-city meta progression, this drives D1/D7 retention and reduces friction toward subscription conversion.
