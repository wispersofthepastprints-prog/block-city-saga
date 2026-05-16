# Block Architect — Product Requirements Document

## Overview
**Block Architect** is a portrait-only React Native / Expo mobile puzzle game inspired by the classic block-puzzle / Blockudoku genre, with a neon arcade aesthetic and an evolving city-skyline meta-progression. Target platform: **Google Play Store (Android)**.

## Gameplay
- **Grid:** 8 columns × 10 rows (36 px cells, 3 px gap)
- **Pieces:** 3 random tetris-like pieces spawn in a bottom tray; once all 3 are placed, a new set spawns
- **Drag-and-drop:** touch a tray piece, drag anywhere on screen — a floating 3D ghost follows the finger; a translucent preview appears on the grid; ghost glows green if valid / red if invalid
- **Line clears:** any filled row OR column clears with a flash, particle burst, screen shake, and combo bonus
- **Combo / streak:** consecutive clears multiply line score (1×, 2×, 3×…); streak counter with flame icon at 3+
- **Grid Locked modal:** when no remaining piece can be placed → "Watch Ad", "Continue (50 coins)", "Buy Pass", or "Restart"
- **Danger overlay:** pulsing red glow when grid is >75% full

## Visual Design
- **Theme:** dark `#050510` background, radial gradient header
- **Palette:** hot-pink `#ff006e`, electric purple `#8338ec`, cyan `#3a86ff`, mint `#06ffa5`, gold `#ffbe0b`, orange `#ff9500`
- **3D blocks:** linear-gradient + inner shine + bottom shadow for beveled feel
- **Top border:** animated scrolling rainbow gradient (4 px tall)
- **Skyline:** SVG city scene above the grid with 6 procedurally-detailed buildings, gradient fills, and lit windows
  - Buildings unlock at lines cleared: **5, 12, 20, 28, 38, 48**
  - **Day/Night cycle:** sky color, sun, moon, and stars subtly crossfade over a 60 s loop
  - All 6 unlocked → "City Complete! +1000" bonus, scene resets, loop continues
- **Particles:** colored neon dots burst from clearing cells; "+300" / "2X COMBO" floating texts

## Monetization
- **Top bar:** SCORE • STREAK (flame) • COINS  •  ⚙
- **Energy:** 5/5 segmented bar; depletes per game (modal at 0 offers Watch Ad / 40 coins / Season Pass)
- **Shop modal:** 4 consumables priced in coins — Hints 15, Undos 25, Hammer 60, Energy Refill 40
- **Season Pass:** `$4.99` / month — 2× scene progress, golden block skins, unlimited energy, no ads (pushed aggressively in Game-Over and Energy modals)
- **Daily Rewards:** 7-day calendar (20, 30, 50, 75, 100, 150, 200) auto-shown on first launch of a new calendar day
- **Undo:** starts at 3; counter visible on button; tapping at 0 → Shop

## Audio / Feedback
- **Sound effects (priority):** synthesised on-the-fly WAVs for tap, drop, invalid, line clear, combo, bonus, coin (no external assets, zero bandwidth)
- **Music:** quiet atmospheric pad (A-minor drone) looped at 15 % volume, toggleable
- **Haptics:** light on hover-valid, medium on drop, heavy on line clear, success on bonus, error on invalid — toggleable
- **Settings modal:** SFX / Music / Haptics toggles + Restart Game

## Local Persistence (no backend)
All progress is stored on-device via `AsyncStorage` (`@/src/utils/storage`):
- `ba_high_score`, `ba_coins`, `ba_undos`, `ba_energy`, `ba_pass_active`, `ba_lines`
- `ba_daily_day` / `ba_daily_date` (rolling 7-day calendar)
- `ba_sfx`, `ba_music`, `ba_haptics` (user preferences)

## Monetization — MOCKED in Expo Go, real Google Play Billing wired for production
The Google Play Billing & AdMob SDKs require native modules and cannot run inside Expo Go. The codebase ships a clean abstraction in `/app/frontend/src/services/monetization.ts` that today returns deterministic mocks. To go live on Play Store the user must:

1. **Publish a Play Console app** (Internal Testing track) with package `com.emergent.blockarchitect`
2. **Create products:**
   - In-app subscription `block_architect_season_pass` → monthly base plan `$4.99` auto-renewing → maps to RevenueCat entitlement `season_pass`
   - (optional) Consumable coin packs
3. **Create AdMob app + Rewarded ad unit**, paste the AdMob App ID and Rewarded Unit ID into env vars
4. **Add credentials to env / `eas.json`:** `REVENUECAT_ANDROID_API_KEY`, `ADMOB_ANDROID_APP_ID`, `ADMOB_REWARDED_UNIT_ID`
5. **Install native SDKs:** `npx expo install react-native-purchases react-native-google-mobile-ads expo-dev-client`
6. **Build a dev / production client:** `eas build --platform android --profile production`
7. **Swap implementations in `monetization.ts`** with the real SDK calls (Purchases.purchasePackage, RewardedAd.show). The UI layer needs **zero** changes since it only depends on the exported `purchaseProduct()` / `showRewardedAd()` functions.

Until that swap, all monetization buttons work end-to-end with simulated 1-second loaders so the gameplay loop, energy refills, season-pass perks, and continue flows are fully exercised.

## Smart business enhancement
**Season-Pass-driven retention loop** — the Pass is surfaced contextually (Game Over, Energy depleted, Shop footer) and visually elevated with gold accents. The "Golden Block Skin" cosmetic perk is the carrot for non-monetary players and instantly visible on every placement once subscribed, creating a daily visible reminder of value (+ envy-driver in shared screenshots). Combined with the 7-day Daily Rewards loop and the unlocking-city meta progression, this drives D1/D7 retention and reduces the friction toward subscription conversion.

## Files (key)
- `/app/frontend/app/_layout.tsx` — GestureHandler + SafeArea root
- `/app/frontend/app/index.tsx` — entry, renders `GameScreen`
- `/app/frontend/src/components/GameScreen.tsx` — main orchestrator (state, drag callbacks, modals)
- `/app/frontend/src/components/GameGrid.tsx` — grid render + hover overlay + clearing animations
- `/app/frontend/src/components/Tray.tsx` — bottom tray + draggable slots (Reanimated/Gesture)
- `/app/frontend/src/components/Skyline.tsx` — SVG city scene + day/night cycle
- `/app/frontend/src/components/Block.tsx` — 3D-beveled cell
- `/app/frontend/src/components/Modals.tsx` — Daily / Shop / Pass / Game Over / Energy / Settings
- `/app/frontend/src/components/Burst.tsx`, `FloatingText.tsx`, `RainbowBorder.tsx`, `TopBar.tsx`
- `/app/frontend/src/game/pieces.ts`, `logic.ts`
- `/app/frontend/src/services/audio.ts` — synthesised SFX + music + haptics
- `/app/frontend/src/services/monetization.ts` — mocked IAP/Ads with swap-in instructions
