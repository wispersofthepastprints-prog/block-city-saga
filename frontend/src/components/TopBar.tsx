// Top HUD bar — score, combo, undos, coins, settings + powerups
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Icon } from "./Icon";

const AnimatedText = Animated.createAnimatedComponent(Text);

type Props = {
  score: number;
  streak: number;
  coins: number;
  energy: number;
  maxEnergy: number;
  unlimitedEnergy: boolean;
  undos: number;
  onPressCoins: () => void;
  onPressEnergy: () => void;
  hints?: number;
  hammers?: number;
  hammerMode?: boolean;
  onHintPress?: () => void;
  onHammerPress?: () => void;
};

export function TopBar({
  score,
  streak,
  coins,
  energy,
  maxEnergy,
  unlimitedEnergy,
  undos,
  onPressCoins,
  onPressEnergy,
  hints = 0,
  hammers = 0,
  hammerMode = false,
  onHintPress,
  onHammerPress,
}: Props) {
  const scoreScale = useSharedValue(1);

  React.useEffect(() => {
    scoreScale.value = withSpring(1.15, { damping: 8, stiffness: 300 });
    const t = setTimeout(() => {
      scoreScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    }, 150);
    return () => clearTimeout(t);
  }, [score]);

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  return (
    <View style={styles.bar} testID="top-bar">
      {/* Score */}
      <View style={styles.left}>
        <Text style={styles.label}>SCORE</Text>
        <AnimatedText style={[styles.score, scoreStyle]} testID="score-text">
          {score}
        </AnimatedText>
      </View>

      {/* Center HUD */}
      <View style={styles.center}>
        {/* Streak / Combo */}
        <View style={styles.pill}>
          <Icon name="fire" size={14} color="#ff6b00" />
          <Text style={styles.pillText}>{streak}x</Text>
        </View>

        {/* Undos */}
        <View style={styles.pill}>
          <Icon name="undo" size={14} color="#00d4ff" />
          <Text style={styles.pillText}>{undos}</Text>
        </View>

        {/* Hints */}
        <TouchableOpacity
          onPress={onHintPress}
          disabled={hints <= 0 || !onHintPress}
          style={[styles.pill, hints <= 0 && styles.pillDisabled]}
          activeOpacity={0.7}
        >
          <Text style={styles.pillIcon}>💡</Text>
          <Text style={styles.pillText}>{hints}</Text>
        </TouchableOpacity>

        {/* Hammer */}
        <TouchableOpacity
          onPress={onHammerPress}
          disabled={hammers <= 0 || hammerMode || !onHammerPress}
          style={[styles.pill, (hammers <= 0 || hammerMode) && styles.pillDisabled]}
          activeOpacity={0.7}
        >
          <Text style={styles.pillIcon}>🔨</Text>
          <Text style={styles.pillText}>{hammers}</Text>
        </TouchableOpacity>

        {/* Energy */}
        <TouchableOpacity onPress={onPressEnergy} style={styles.pill} activeOpacity={0.7}>
          <Icon name="zap" size={14} color="#06ffa5" />
          <Text style={styles.pillText}>
            {unlimitedEnergy ? "∞" : `${energy}/${maxEnergy}`}
          </Text>
        </TouchableOpacity>

        {/* Coins */}
        <TouchableOpacity onPress={onPressCoins} style={styles.pill} activeOpacity={0.7}>
          <Icon name="coin" size={14} color="#ffd700" />
          <Text style={styles.pillText}>{coins}</Text>
          <Text style={styles.plus}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <TouchableOpacity onPress={onPressEnergy} style={styles.gear} activeOpacity={0.7}>
        <Icon name="settings" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 2,
    width: "100%",
  },
  left: {
    alignItems: "flex-start",
    minWidth: 60,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  score: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 36,
  },
  center: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pillDisabled: {
    opacity: 0.3,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  pillIcon: {
    fontSize: 12,
  },
  plus: {
    fontSize: 14,
    fontWeight: "700",
    color: "#06ffa5",
    marginLeft: 2,
  },
  gear: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
});