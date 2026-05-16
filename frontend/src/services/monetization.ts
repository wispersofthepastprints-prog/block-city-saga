// Monetization service — abstracted for swap-in of real Google Play Billing + AdMob.
// Currently uses mocks because:
//   1. Real react-native-purchases & react-native-google-mobile-ads require a Dev Client / EAS build
//      (they don't load in Expo Go preview).
//   2. The Season Pass product, AdMob app ID and ad units must be set up in Google Play Console / AdMob
//      with a published app first.
//
// All UI state changes are routed through this service, so swapping in real impls later
// requires no changes to the UI.
//
// REAL INTEGRATION SWAP-IN (post Play Console setup):
//   - Install: `npx expo install react-native-purchases react-native-google-mobile-ads expo-dev-client`
//   - Add AdMob app ID to app.json under top-level "react-native-google-mobile-ads".android_app_id
//   - Configure RevenueCat: see /app/memory/PRD.md "Monetization Setup" section.
//   - Build a dev client: `eas build --profile development --platform android`
//   - Then replace the mock implementations below with the real SDK calls.

import Constants from "expo-constants";

export type IapProductId =
  | "coins_small"
  | "coins_medium"
  | "coins_large"
  | "season_pass_monthly";

export const isExpoGoPreview = Constants.appOwnership === "expo";

// Mock rewarded ad — simulates a 1.5s load and resolves with reward granted.
export async function showRewardedAd(): Promise<{ rewarded: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ rewarded: true }), 1200);
  });
}

// Mock IAP — simulate platform purchase dialog with 1.2s "Play Store loading"
export async function purchaseProduct(
  productId: IapProductId
): Promise<{ success: boolean; productId: IapProductId }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, productId }), 1000);
  });
}

export async function restorePurchases(): Promise<{ entitlements: string[] }> {
  return { entitlements: [] };
}
