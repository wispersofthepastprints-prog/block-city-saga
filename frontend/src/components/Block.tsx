// 3D beveled block - inner shine, side shadow, bottom shadow
import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NEON_COLORS, PieceColor } from "@/src/game/pieces";

type Props = {
  color: PieceColor;
  size: number;
  opacity?: number;
  glow?: boolean;
  golden?: boolean;
};

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amt);
  const g = Math.min(255, ((n >> 8) & 255) + amt);
  const b = Math.min(255, (n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - amt);
  const g = Math.max(0, ((n >> 8) & 255) - amt);
  const b = Math.max(0, (n & 255) - amt);
  return `rgb(${r},${g},${b})`;
}

export const Block = React.memo(function Block({
  color,
  size,
  opacity = 1,
  glow = false,
  golden = false,
}: Props) {
  const baseColor = golden ? "#ffd700" : NEON_COLORS[color];
  const light = lighten(baseColor.startsWith("#") ? baseColor : NEON_COLORS[color], 60);
  const dark = darken(baseColor.startsWith("#") ? baseColor : NEON_COLORS[color], 60);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          opacity,
          boxShadow: `0 0 ${glow ? 14 : 5}px ${baseColor}${glow ? "e6" : "66"}`,
        },
      ]}
    >
      <LinearGradient
        colors={[light, baseColor, dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.block, { borderRadius: Math.max(4, size * 0.18) }]}
      >
        {/* top-left highlight */}
        <View
          style={[
            styles.shine,
            {
              borderTopLeftRadius: Math.max(4, size * 0.18),
              borderTopRightRadius: Math.max(4, size * 0.18),
            },
          ]}
        />
        {/* bottom shadow */}
        <View
          style={[
            styles.bottomShadow,
            {
              borderBottomLeftRadius: Math.max(4, size * 0.18),
              borderBottomRightRadius: Math.max(4, size * 0.18),
            },
          ]}
        />
        {/* inner border for crispness */}
        <View
          style={[
            styles.innerBorder,
            { borderRadius: Math.max(4, size * 0.18) },
          ]}
        />
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    elevation: 4,
  },
  block: {
    flex: 1,
    overflow: "hidden",
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  bottomShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  innerBorder: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
});
