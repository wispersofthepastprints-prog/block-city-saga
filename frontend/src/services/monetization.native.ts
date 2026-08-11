// Monetization service — RevenueCat (Google Play Billing) + Google AdMob.
//
// Whisper Ball max-revenue strategy applied to Block City Saga:
//   • Dual one-time IAPs: "remove_ads" ($4.99) and "premium_pack" ($6.99).
//     Premium Pack INCLUDES ad removal plus gameplay perks (2x score,
//     golden skins, unlimited energy). No subscriptions.
//   • Rewarded video "Continue with Ad" on game over (and energy refill) —
//     opt-in, available to ALL users including ad-free ones.
//   • Interstitials with a hard 90-second frequency cap, fired by the caller
//     on "back to menu" (session restart). Never shown to ad-free users.
//
// Architecture:
//   • All native SDKs are dynamically imported and ONLY when running in a
//     dev-client or production build (Constants.appOwnership !== "expo").
//     In Expo Go preview and on web, every function returns a safe mock so
//     the rest of the app keeps working without crashing.
//   • AdMob: rewarded + interstitial ads use TestIds in __DEV__, production
//     unit IDs otherwise. Ads are preloaded eagerly and a fresh ad is loaded
//     after each show.
//
// Env vars (set in /app/frontend/.env):
//   EXPO_PUBLIC_RC_ANDROID_KEY            — RevenueCat Android SDK key (test_ or goog_)
//   EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID    — AdMob production rewarded ad unit id
//   EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID — AdMob production interstitial ad unit id
import Constants from "expo-constants";
import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// Entitlements & products (must match RevenueCat dashboard + Play Console)
// ---------------------------------------------------------------------------

export const ENTITLEMENTS = {
  REMOVE_ADS: "remove_ads",
  PREMIUM: "premium_pack",
} as const;

// Grandfathered: the pre-rename entitlement ID from the "Tetris Architect"
// era. Anyone holding it is treated as full Premium.
const LEGACY_ENTITLEMENT_ID = "Tetris Architect Pro";

export const PRODUCT_IDS = {
  REMOVE_ADS: "remove_ads", // $4.99 one-time — kills interstitials
  PREMIUM_PACK: "premium_pack", // $6.99 one-time — ad removal + all perks
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

export type EntitlementState = {
  premium: boolean; // Premium Pack (or grandfathered legacy Pro)
  removeAds: boolean; // Remove Ads OR Premium Pack
};

export const IS_EXPO_GO = Constants.appOwnership === "expo";
export const IS_NATIVE_RUNTIME =
  !IS_EXPO_GO && (Platform.OS === "android" || Platform.OS === "ios");

function stateFromCustomerInfo(info: any): EntitlementState {
  const active = info?.entitlements?.active ?? {};
  const premium =
    active[ENTITLEMENTS.PREMIUM] !== undefined ||
    active[LEGACY_ENTITLEMENT_ID] !== undefined;
  // Premium Pack includes ad removal.
  const removeAds = premium || active[ENTITLEMENTS.REMOVE_ADS] !== undefined;
  return { premium, removeAds };
}

// ---------------------------------------------------------------------------
// Lazy native module loaders — never crash in Expo Go / web
// ---------------------------------------------------------------------------

async function getPurchases(): Promise<any | null> {
  if (!IS_NATIVE_RUNTIME) return null;
  try {
    const mod = await import("react-native-purchases");
    return mod.default;
  } catch (e) {
    console.warn("[RevenueCat] failed to load react-native-purchases", e);
    return null;
  }
}

async function getRevenueCatUI(): Promise<any | null> {
  if (!IS_NATIVE_RUNTIME) return null;
  try {
    const mod = await import("react-native-purchases-ui");
    return mod.default;
  } catch (e) {
    console.warn("[RevenueCat] failed to load react-native-purchases-ui", e);
    return null;
  }
}

async function getGoogleMobileAds(): Promise<any | null> {
  if (!IS_NATIVE_RUNTIME) return null;
  try {
    const mod = await import("react-native-google-mobile-ads");
    return mod;
  } catch (e) {
    console.warn("[AdMob] failed to load react-native-google-mobile-ads", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// UMP / GDPR consent gathering
//
// Google's User Messaging Platform (UMP) is mandatory for serving AdMob ads to
// users in the EEA / UK / Switzerland (GDPR) and California (CCPA). Without it
// AdMob may refuse to serve ads or flag the app for policy violation.
//
// Flow on first launch:
//   1. Call AdsConsent.gatherConsent() — Google decides whether the user is in
//      a regulated region. If yes, it shows the consent form automatically.
//   2. AdsConsent reports `canRequestAds` — if true, we initialize MobileAds.
//   3. We pass `requestNonPersonalizedAdsOnly` based on the user's choice.
// ---------------------------------------------------------------------------

let adsCanBeRequested = false;
let adsRequireNonPersonalized = true; // safe default

async function gatherAdConsent(): Promise<void> {
  if (!IS_NATIVE_RUNTIME) return;
  const ads = await getGoogleMobileAds();
  if (!ads) return;
  const { AdsConsent, AdsConsentDebugGeography } = ads as any;
  if (!AdsConsent) {
    console.warn("[UMP] AdsConsent API unavailable in this SDK version");
    return;
  }
  try {
    // In __DEV__, force EEA geography so we can verify the consent UI on test
    // devices. In production this is undefined and Google detects geography
    // from the user's IP.
    const info = await AdsConsent.gatherConsent(
      __DEV__
        ? {
            debugGeography: AdsConsentDebugGeography?.EEA,
            testDeviceIdentifiers: [],
          }
        : undefined,
    );
    adsCanBeRequested = info?.canRequestAds ?? true;
    // Personalized ads are only allowed if the user has granted consent for
    // purpose 1 (storage & access of information on a device). UMP returns a
    // TC string but the simpler `canRequestAds` + purposeConsents check works.
    try {
      const purposes: string = await AdsConsent.getPurposeConsents();
      // "1" present in the string = personalised ads consented.
      adsRequireNonPersonalized = !purposes?.includes("1");
    } catch {
      adsRequireNonPersonalized = true;
    }
    console.log(
      `[UMP] canRequestAds=${adsCanBeRequested}, nonPersonalizedOnly=${adsRequireNonPersonalized}`,
    );
  } catch (e) {
    console.warn("[UMP] gatherConsent failed", e);
    // If UMP itself fails, fall back to allowing ads with NPA only — this is
    // the most conservative legally-compliant default.
    adsCanBeRequested = true;
    adsRequireNonPersonalized = true;
  }
}

/**
 * Re-show the UMP privacy options form so the user can change their consent.
 * Called from the Settings modal — required by Google for users in regulated
 * regions.
 */
export async function presentPrivacyOptions(): Promise<void> {
  if (!IS_NATIVE_RUNTIME) {
    console.log("[UMP] (mock) presentPrivacyOptions");
    return;
  }
  const ads = await getGoogleMobileAds();
  const AdsConsent = (ads as any)?.AdsConsent;
  if (!AdsConsent) return;
  try {
    await AdsConsent.showPrivacyOptionsForm();
    // Re-read consent after the user changes selections.
    try {
      const purposes: string = await AdsConsent.getPurposeConsents();
      adsRequireNonPersonalized = !purposes?.includes("1");
    } catch {}
  } catch (e) {
    console.warn("[UMP] showPrivacyOptionsForm failed", e);
  }
}

/**
 * Whether the UMP "Privacy options" button should be visible in the app's
 * Settings (only visible to users in regulated regions per Google's policy).
 */
export async function isPrivacyOptionsRequired(): Promise<boolean> {
  if (!IS_NATIVE_RUNTIME) return false;
  const ads = await getGoogleMobileAds();
  const AdsConsent = (ads as any)?.AdsConsent;
  if (!AdsConsent) return false;
  try {
    const status = await AdsConsent.getPrivacyOptionsRequirementStatus?.();
    return status === "REQUIRED";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// One-time SDK initialisation (called from app/_layout.tsx)
// ---------------------------------------------------------------------------

let initStarted = false;
export async function initializeMonetization(): Promise<void> {
  if (initStarted || !IS_NATIVE_RUNTIME) return;
  initStarted = true;

  // --- RevenueCat ---
  try {
    const Purchases = await getPurchases();
    if (Purchases) {
      const apiKey = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "";
      if (!apiKey) {
        console.warn(
          "[RevenueCat] EXPO_PUBLIC_RC_ANDROID_KEY is not set — purchases disabled",
        );
      } else {
        if (apiKey.startsWith("test_")) {
          console.warn(
            "[RevenueCat] Using a TEST key — real purchases will not go through. Swap for a goog_… production key before submitting to Play Store.",
          );
        }
        if (__DEV__) {
          try {
            Purchases.setLogLevel("verbose" as any);
          } catch {}
        }
        Purchases.configure({ apiKey });
        console.log("[RevenueCat] configured");
      }
    }
  } catch (e) {
    console.warn("[RevenueCat] init failed", e);
  }

  // --- Google Mobile Ads ---
  // IMPORTANT: gather UMP / GDPR consent BEFORE initialising MobileAds, otherwise
  // ads served to EU users will violate Google's published policy.
  try {
    await gatherAdConsent();
  } catch (e) {
    console.warn("[UMP] consent flow failed", e);
  }

  try {
    if (!adsCanBeRequested) {
      console.log("[AdMob] user has not granted consent — skipping init");
    } else {
      const ads = await getGoogleMobileAds();
      if (ads?.default) {
        await ads.default().initialize();
        console.log("[AdMob] MobileAds initialised");
        // Preload first rewarded + interstitial ads
        void preloadRewardedAd();
        void preloadInterstitial();
      }
    }
  } catch (e) {
    console.warn("[AdMob] init failed", e);
  }
}

// ---------------------------------------------------------------------------
// Entitlement state
// ---------------------------------------------------------------------------

export async function getEntitlementState(): Promise<EntitlementState> {
  const Purchases = await getPurchases();
  if (!Purchases) return { premium: false, removeAds: false };
  try {
    const info = await Purchases.getCustomerInfo();
    return stateFromCustomerInfo(info);
  } catch (e) {
    console.warn("[RevenueCat] getCustomerInfo failed", e);
    return { premium: false, removeAds: false };
  }
}

export async function addEntitlementListener(
  cb: (state: EntitlementState) => void,
): Promise<() => void> {
  const Purchases = await getPurchases();
  if (!Purchases) return () => {};
  const listener = (info: any) => {
    cb(stateFromCustomerInfo(info));
  };
  try {
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener?.(listener);
      } catch {}
    };
  } catch (e) {
    console.warn("[RevenueCat] listener failed", e);
    return () => {};
  }
}

// ---------------------------------------------------------------------------
// Customer Center (manage / restore purchases)
// ---------------------------------------------------------------------------

export async function presentCustomerCenter(): Promise<void> {
  const RevenueCatUI = await getRevenueCatUI();
  if (!RevenueCatUI) {
    console.log("[RevenueCat] (mock) Customer Center");
    return;
  }
  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch (e) {
    console.warn("[RevenueCat] customer center error", e);
  }
}

// ---------------------------------------------------------------------------
// Direct product purchase by ID (remove_ads / premium_pack)
// ---------------------------------------------------------------------------

export async function purchaseProduct(
  productId: string,
): Promise<{ success: boolean; productId: string }> {
  const Purchases = await getPurchases();
  if (!Purchases) {
    console.log(`[RevenueCat] (mock) purchase ${productId}`);
    await new Promise((r) => setTimeout(r, 800));
    return { success: true, productId };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings?.current?.availablePackages?.find(
      (p: any) =>
        p.identifier === productId || p.product?.identifier === productId,
    );
    if (!pkg) {
      console.warn(
        `[RevenueCat] package ${productId} not found in current offering`,
      );
      return { success: false, productId };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const state = stateFromCustomerInfo(customerInfo);
    const success = state.premium || state.removeAds;
    return { success, productId };
  } catch (e: any) {
    if (e?.userCancelled) {
      return { success: false, productId };
    }
    console.warn("[RevenueCat] purchase error", e);
    return { success: false, productId };
  }
}

export async function restorePurchases(): Promise<{ entitlements: string[] }> {
  const Purchases = await getPurchases();
  if (!Purchases) return { entitlements: [] };
  try {
    const info = await Purchases.restorePurchases();
    return {
      entitlements: Object.keys(info?.entitlements?.active ?? {}),
    };
  } catch (e) {
    console.warn("[RevenueCat] restore failed", e);
    return { entitlements: [] };
  }
}

// ---------------------------------------------------------------------------
// AdMob rewarded ads (opt-in: continue on game over, energy refill)
// ---------------------------------------------------------------------------

let rewardedAd: any = null;
let rewardedAdLoaded = false;
let rewardedAdLoading = false;

async function preloadRewardedAd(): Promise<void> {
  if (rewardedAdLoaded || rewardedAdLoading) return;
  const ads = await getGoogleMobileAds();
  if (!ads) return;
  try {
    const { RewardedAd, RewardedAdEventType, TestIds } = ads as any;
    const productionUnit = process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID ?? "";
    const unitId = __DEV__ || !productionUnit ? TestIds.REWARDED : productionUnit;
    rewardedAd = RewardedAd.createForAdRequest(unitId, {
      // Honor the user's UMP / GDPR choice. If they opted out of personalised
      // ads (or are in a region requiring consent and haven't granted it),
      // serve non-personalised ads only.
      requestNonPersonalizedAdsOnly: adsRequireNonPersonalized,
    });
    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedAdLoaded = true;
      rewardedAdLoading = false;
    });
    rewardedAd.addAdEventListener("closed", () => {
      rewardedAdLoaded = false;
      rewardedAd = null;
      // Preload the next one
      void preloadRewardedAd();
    });
    rewardedAd.addAdEventListener("error", (err: any) => {
      console.warn("[AdMob] rewarded ad error", err);
      rewardedAdLoading = false;
      rewardedAd = null;
    });
    rewardedAdLoading = true;
    rewardedAd.load();
  } catch (e) {
    console.warn("[AdMob] preload failed", e);
    rewardedAdLoading = false;
  }
}

export async function showRewardedAd(): Promise<{ rewarded: boolean }> {
  if (!IS_NATIVE_RUNTIME) {
    // Mock path — simulate a 1.2 s "ad" then grant reward.
    await new Promise((r) => setTimeout(r, 1200));
    return { rewarded: true };
  }

  const ads = await getGoogleMobileAds();
  if (!ads) return { rewarded: false };

  if (!rewardedAdLoaded) {
    void preloadRewardedAd();
    // Wait up to 4s for an ad to load
    const started = Date.now();
    while (!rewardedAdLoaded && Date.now() - started < 4000) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  if (!rewardedAd || !rewardedAdLoaded) {
    console.warn("[AdMob] no rewarded ad available");
    return { rewarded: false };
  }

  return new Promise<{ rewarded: boolean }>((resolve) => {
    let rewarded = false;
    const { RewardedAdEventType } = ads as any;
    const onReward = () => {
      rewarded = true;
    };
    const onClosed = () => {
      resolve({ rewarded });
    };
    try {
      rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, onReward);
      rewardedAd.addAdEventListener("closed", onClosed);
      rewardedAd.show();
    } catch (e) {
      console.warn("[AdMob] show error", e);
      resolve({ rewarded: false });
    }
  });
}

// ---------------------------------------------------------------------------
// AdMob interstitial ads — Whisper Ball 90-second frequency cap
//
// Fired by the CALLER on "back to menu" (session restart in this game).
// The cap is enforced HERE in the service so no caller can ever over-serve.
// Ad-free users (Remove Ads / Premium Pack) are filtered by the caller —
// GameScreen never invokes this for them.
// ---------------------------------------------------------------------------

export const INTERSTITIAL_COOLDOWN_MS = 90_000; // 90 seconds, hard cap

let interstitialAd: any = null;
let interstitialLoaded = false;
let interstitialLoading = false;
let lastInterstitialShownAt = 0;

async function preloadInterstitial(): Promise<void> {
  if (interstitialLoaded || interstitialLoading) return;
  if (!adsCanBeRequested) return;
  const ads = await getGoogleMobileAds();
  if (!ads) return;
  try {
    const { InterstitialAd, TestIds } = ads as any;
    const productionUnit =
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID ?? "";
    const unitId =
      __DEV__ || !productionUnit ? TestIds.INTERSTITIAL : productionUnit;
    interstitialAd = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: adsRequireNonPersonalized,
    });
    interstitialAd.addAdEventListener("loaded", () => {
      interstitialLoaded = true;
      interstitialLoading = false;
    });
    interstitialAd.addAdEventListener("closed", () => {
      interstitialLoaded = false;
      interstitialAd = null;
      // Preload the next one
      void preloadInterstitial();
    });
    interstitialAd.addAdEventListener("error", (err: any) => {
      console.warn("[AdMob] interstitial error", err);
      interstitialLoading = false;
      interstitialLoaded = false;
      interstitialAd = null;
    });
    interstitialLoading = true;
    interstitialAd.load();
  } catch (e) {
    console.warn("[AdMob] interstitial preload failed", e);
    interstitialLoading = false;
  }
}

/**
 * Show an interstitial IF the 90-second cap allows it.
 * Returns { shown } — false means the cap or ad availability suppressed it,
 * which is a normal, expected outcome (callers should not treat it as an error).
 */
export async function showInterstitialAd(): Promise<{ shown: boolean }> {
  if (!IS_NATIVE_RUNTIME) {
    // Mock path — simulate a short "ad".
    console.log("[AdMob] (mock) interstitial");
    await new Promise((r) => setTimeout(r, 600));
    return { shown: true };
  }

  if (Date.now() - lastInterstitialShownAt < INTERSTITIAL_COOLDOWN_MS) {
    console.log("[AdMob] interstitial suppressed by 90s cap");
    return { shown: false };
  }

  const ads = await getGoogleMobileAds();
  if (!ads) return { shown: false };

  if (!interstitialLoaded) {
    void preloadInterstitial();
    // Wait up to 3s for an ad to load — interstitials must never stall the UI
    const started = Date.now();
    while (!interstitialLoaded && Date.now() - started < 3000) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  if (!interstitialAd || !interstitialLoaded) {
    console.warn("[AdMob] no interstitial available");
    return { shown: false };
  }

  return new Promise<{ shown: boolean }>((resolve) => {
    try {
      interstitialAd.addAdEventListener("closed", () => {
        lastInterstitialShownAt = Date.now();
        resolve({ shown: true });
      });
      interstitialAd.show();
    } catch (e) {
      console.warn("[AdMob] interstitial show error", e);
      resolve({ shown: false });
    }
  });
}
