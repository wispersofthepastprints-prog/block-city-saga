// Top bar: Score | Streak (flame) | Coins + Energy bar
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Icon } from "./Icon";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  score: number;
  streak: number;
  coins: number;
  energy: number;
  maxEnergy: number;
  unlimitedEnergy: boolean;
  onPressCoins: () => void;
  onPressEnergy: () => void;
  onPressSettings: () => void;
};

export function TopBar({
  score,
  streak,
  coins,
  energy,
  maxEnergy,
  unlimitedEnergy,
  onPressCoins,
  onPressEnergy,
  onPressSettings,
}: Props) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={["#1a1a3a", "#050510"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.headerGradient}
      />
      <View style={styles.row}>
        {/* Score */}
        <View style={styles.scoreBlock} testID="topbar-score">
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>
        {/* Streak */}
        <View style={styles.streakBlock} testID="topbar-streak">
          <View style={styles.streakInner}>
            <Icon
              name="flame"
              size={16}
              color={streak >= 3 ? "#ff9500" : "#555"}
            />
            <Text
              style={[
                styles.streakValue,
                streak >= 3 && { color: "#ff9500" },
              ]}
            >
              {streak}x
            </Text>
          </View>
        </View>
        {/* Coins */}
        <TouchableOpacity
          style={styles.coinsBlock}
          onPress={onPressCoins}
          testID="topbar-coins"
        >
          <Icon name="cash" size={14} color="#ffbe0b" />
          <Text style={styles.coinsValue}>{coins.toLocaleString()}</Text>
          <Icon
            name="add-circle"
            size={16}
            color="#06ffa5"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
        {/* Settings */}
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={onPressSettings}
          testID="topbar-settings"
        >
          <Icon name="settings-outline" size={18} color="#aaa" />
        </TouchableOpacity>
      </View>
      {/* Energy bar */}
      <TouchableOpacity
        style={styles.energyRow}
        onPress={onPressEnergy}
        activeOpacity={0.7}
        testID="topbar-energy"
      >
        <Icon name="flash" size={12} color="#ffbe0b" />
        <View style={styles.energyBar}>
          {Array.from({ length: maxEnergy }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.energyCell,
                {
                  backgroundColor:
                    unlimitedEnergy || i < energy
                      ? unlimitedEnergy
                        ? "#ffbe0b"
                        : "#06ffa5"
                      : "#222238",
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.energyText}>
          {unlimitedEnergy ? "∞" : `${energy}/${maxEnergy}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
    overflow: "hidden",
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "#666",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  scoreBlock: {
    flex: 1,
  },
  scoreValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  streakBlock: {
    paddingHorizontal: 6,
  },
  streakInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,149,0,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,149,0,0.2)",
  },
  streakValue: {
    color: "#888",
    fontSize: 14,
    fontWeight: "800",
  },
  coinsBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,190,11,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,190,11,0.25)",
  },
  coinsValue: {
    color: "#ffbe0b",
    fontSize: 14,
    fontWeight: "800",
  },
  settingsBtn: {
    padding: 6,
  },
  energyRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  energyBar: {
    flex: 1,
    flexDirection: "row",
    gap: 3,
    height: 6,
  },
  energyCell: {
    flex: 1,
    height: 6,
    borderRadius: 2,
  },
  energyText: {
    color: "#aaa",
    fontSize: 10,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "right",
  },
});
