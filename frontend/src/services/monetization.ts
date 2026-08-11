// Web stub for monetization. Metro picks this on `Platform.OS === "web"`.
// The browser preview never loads any native ad / IAP SDKs — every function
// returns a safe mock so the UI stays exercise-able.
//
// On Android / iOS Metro automatically resolves to ./monetization.native.ts
// which loads the real RevenueCat + AdMob SDKs.
//
// IMPORTANT: keep this export surface in sync with monetization.native.ts.

export const ENTITLEMENTS = {
  REMOVE_ADS: "remove_ads",
  PREMIUM: "premium_pack",
} as const;

export const PRODUCT_IDS = {
  REMOVE_ADS: "remove_ads", // $4.99 one-time — kills interstitials
  PREMIUM_PACK: "premium_pack", // $6.99 one-time — ad removal + all perks
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

export type EntitlementState = {
  premium: boolean;
  removeAds: boolean;
};

export const INTERSTITIAL_COOLDOWN_MS = 90_000;

export const IS_EXPO_GO = false;
export const IS_NATIVE_RUNTIME = false;

export async function initializeMonetization(): Promise<void> {
  // no-op on web
}

export async function getEntitlementState(): Promise<EntitlementState> {
  return { premium: false, removeAds: false };
}

export async function addEntitlementListener(
  _cb: (state: EntitlementState) => void,
): Promise<() => void> {
  return () => {};
}

export async function presentCustomerCenter(): Promise<void> {
  // no-op on web
}

export async function purchaseProduct(
  productId: string,
): Promise<{ success: boolean; productId: string }> {
  // Mock: pretend the user purchased so the unlock flow can be exercised.
  await new Promise((r) => setTimeout(r, 800));
  return { success: true, productId };
}

export async function restorePurchases(): Promise<{ entitlements: string[] }> {
  return { entitlements: [] };
}

export async function showRewardedAd(): Promise<{ rewarded: boolean }> {
  await new Promise((r) => setTimeout(r, 1200));
  return { rewarded: true };
}

export async function showInterstitialAd(): Promise<{ shown: boolean }> {
  await new Promise((r) => setTimeout(r, 600));
  return { shown: true };
}

// UMP / GDPR consent — no-ops on web.
export async function presentPrivacyOptions(): Promise<void> {
  // no-op on web
}

export async function isPrivacyOptionsRequired(): Promise<boolean> {
  return false;
}
