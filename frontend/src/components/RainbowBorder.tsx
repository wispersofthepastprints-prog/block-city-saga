// Animated rainbow border at the very top of the screen (mimics scrolling neon gradient).
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

export function RainbowBorder() {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 4500, easing: Easing.linear }),
      -1,
      false
    );
  }, [t]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -t.value * 600 }],
    };
  });

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.inner, animatedStyle]}>
        <LinearGradient
          colors={[
            "#ff006e",
            "#ff9500",
            "#ffbe0b",
            "#06ffa5",
            "#3a86ff",
            "#8338ec",
            "#ff006e",
            "#ff9500",
            "#ffbe0b",
            "#06ffa5",
            "#3a86ff",
            "#8338ec",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 4,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  inner: {
    width: 1800,
    height: 4,
  },
  gradient: {
    width: 1800,
    height: 4,
  },
});
