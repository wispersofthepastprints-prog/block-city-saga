// Web stub for monetization. Metro picks this on `Platform.OS === "web"`.
// The browser preview never loads any native ad / IAP SDKs — every function
// returns a safe mock so the UI stays exercise-able.
//
// On Android / iOS Metro automatically resolves to ./monetization.native.ts
// which loads the real RevenueCat + AdMob SDKs.

export const ENTITLEMENT_ID = "Tetris Architect Pro";

export const PRODUCT_IDS = {
  lifetime: "lifetime",
  yearly: "yearly",
  monthly: "monthly",
} as const;

export type ProductId = keyof typeof PRODUCT_IDS;

export const IS_EXPO_GO = false;
export const IS_NATIVE_RUNTIME = false;

export type PaywallResult =
  | "purchased"
  | "restored"
  | "cancelled"
  | "error"
  | "not_presented";

export async function initializeMonetization(): Promise<void> {
  // no-op on web
}

export async function hasProEntitlement(): Promise<boolean> {
  return false;
}

export async function addEntitlementListener(
  _cb: (hasPro: boolean) => void
): Promise<() => void> {
  return () => {};
}

export async function presentProPaywall(): Promise<{
  didGainAccess: boolean;
  result: PaywallResult;
}> {
  // Mock: pretend the user purchased so the unlock flow can be exercised.
  await new Promise((r) => setTimeout(r, 800));
  return { didGainAccess: true, result: "purchased" };
}

export async function presentCustomerCenter(): Promise<void> {
  // no-op on web
}

export async function purchaseProduct(
  productId: string
): Promise<{ success: boolean; productId: string }> {
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
