// ---------------------------------------------------------------------------
// DebugOverlay
//
// A tiny floating panel that prints the live safe-area / dimensions /
// platform info for the current device. Used to diagnose UI clipping issues
// on Android devices in the wild (Galaxy S20 nav-bar overlap, etc.).
//
// Activation:
//   * In dev (`__DEV__`), tap the top-right corner 5 times to toggle.
//   * In production, the component is a no-op — nothing renders.
//
// To force it on temporarily in a production build for QA, change
// `FORCE_VISIBLE` below to `true` and rebuild.
// ---------------------------------------------------------------------------

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import Constants from "expo-constants";
import { useSafeLayout } from "@/src/utils/safeLayout";

const FORCE_VISIBLE = false;

export function DebugOverlay() {
  const [visible, setVisible] = useState(FORCE_VISIBLE);
  const tapCount = useRef(0);
  const lastTapAt = useRef(0);
  const layout = useSafeLayout();
  const { width, height } = useWindowDimensions();

  // Only allow toggling in dev builds.
  const canToggle = __DEV__;

  const handleHotspotTap = () => {
    if (!canToggle) return;
    const now = Date.now();
    if (now - lastTapAt.current > 1200) tapCount.current = 0;
    tapCount.current += 1;
    lastTapAt.current = now;
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setVisible((v) => !v);
    }
  };

  return (
    <>
      {/* Invisible 56×56 hotspot in the top-right corner for dev toggle. */}
      {canToggle && (
        <Pressable
          onPress={handleHotspotTap}
          style={styles.hotspot}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}

      {visible && (
        <View pointerEvents="none" style={styles.panel}>
          <Row k="platform" v={`${Platform.OS} ${Platform.Version}`} />
          <Row k="screen" v={`${Math.round(width)}×${Math.round(height)}`} />
          <Row
            k="insets"
            v={`t${Math.round(layout.rawInsets.top)} r${Math.round(layout.rawInsets.right)} b${Math.round(layout.rawInsets.bottom)} l${Math.round(layout.rawInsets.left)}`}
          />
          <Row k="topPad" v={`${Math.round(layout.topPad)} px`} />
          <Row k="bottomPad" v={`${Math.round(layout.bottomPad)} px`} />
          <Row k="statusH" v={`${layout.statusBarHeight} px`} />
          <Row
            k="appV"
            v={`${Constants.expoConfig?.version ?? "?"} (#${Constants.expoConfig?.android?.versionCode ?? "?"})`}
          />
        </View>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.k}>{k}</Text>
      <Text style={styles.v}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hotspot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 56,
    height: 56,
    zIndex: 9999,
  },
  panel: {
    position: "absolute",
    top: 60,
    right: 8,
    minWidth: 180,
    backgroundColor: "rgba(0,0,0,0.78)",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,0,110,0.4)",
    zIndex: 9998,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1,
  },
  k: { color: "#9aa3c7", fontSize: 10, fontWeight: "600" },
  v: { color: "#fff", fontSize: 10, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});
