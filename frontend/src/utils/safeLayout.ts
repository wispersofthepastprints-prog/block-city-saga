// ---------------------------------------------------------------------------
// Safe layout helpers
//
// Computing padding to keep our UI clear of the status bar (top) and the
// navigation bar / home indicator (bottom) is surprisingly tricky on Android:
//
//   * `useSafeAreaInsets()` returns 0 / undersized values on several older
//     Samsung One UI builds (Galaxy S10, S20, Note 10), so the topbar/tray
//     can slip beneath system UI.
//   * `StatusBar.currentHeight` is available only on Android, and only roughly
//     correlates with the cutout / nav bar size — but it is a useful fallback.
//   * Stock Android (Pixel) is well-behaved; the issues only show on Samsung,
//     Xiaomi, Huawei skins.
//
// We expose one helper, `useSafeLayout()`, which returns the effective top
// and bottom padding the screen should use. It applies generous Android
// floors so the UI never collides with system chrome on any device we expect
// to hit in the wild.
// ---------------------------------------------------------------------------

import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Visible floors (px) — chosen empirically to cover the worst-case Samsung
// One UI nav bar (~120 px) and Android status-bar cutouts on devices that
// report wrong insets.
const ANDROID_TOP_FLOOR = 36;
const ANDROID_BOTTOM_FLOOR = 140;
const IOS_TOP_FLOOR = 12;
const IOS_BOTTOM_FLOOR = 80;

export type SafeLayout = {
  /** Padding to add at the top of the screen (status bar / cutout). */
  topPad: number;
  /** Padding to add at the bottom of the screen (nav bar / home indicator). */
  bottomPad: number;
  /** The raw insets returned by safe-area-context — exposed for debugging. */
  rawInsets: { top: number; right: number; bottom: number; left: number };
  /** Status bar height (Android only). 0 elsewhere. */
  statusBarHeight: number;
};

export function useSafeLayout(): SafeLayout {
  const insets = useSafeAreaInsets();
  const statusBarHeight = StatusBar.currentHeight ?? 0;

  const isAndroid = Platform.OS === "android";

  const topPad = Math.max(
    insets.top + 4,
    isAndroid ? ANDROID_TOP_FLOOR : IOS_TOP_FLOOR,
    // If status-bar height reports tall (cutout / punch-hole), respect it.
    isAndroid ? statusBarHeight + 6 : 0,
  );

  const bottomPad = Math.max(
    (insets.bottom || 0) + 24,
    isAndroid ? ANDROID_BOTTOM_FLOOR : IOS_BOTTOM_FLOOR,
    // Triple-defensive Android fallback — assume nav bar is at least as tall
    // as the status bar with a 80 px buffer on top.
    isAndroid ? statusBarHeight + 80 : 0,
  );

  return {
    topPad,
    bottomPad,
    rawInsets: {
      top: insets.top,
      right: insets.right,
      bottom: insets.bottom,
      left: insets.left,
    },
    statusBarHeight,
  };
}
