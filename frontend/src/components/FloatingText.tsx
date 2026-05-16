// Floating "+300" / "COMBO" texts that rise & fade
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Props = {
  x: number;
  y: number;
  text: string;
  color: string;
  size?: number;
  onComplete: () => void;
};

export function FloatingText({
  x,
  y,
  text,
  color,
  size = 26,
  onComplete,
}: Props) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, {
      duration: 1100,
      easing: Easing.out(Easing.quad),
    });
    const id = setTimeout(onComplete, 1200);
    return () => clearTimeout(id);
  }, [t, onComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: -t.value * 60 },
        { scale: 0.5 + Math.min(1, t.value * 3) * 0.6 },
      ],
      opacity: t.value < 0.7 ? 1 : 1 - (t.value - 0.7) / 0.3,
    };
  });

  return (
    <Animated.Text
      style={[
        styles.text,
        {
          left: x,
          top: y,
          color,
          fontSize: size,
          textShadowColor: color,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    position: "absolute",
    fontWeight: "900",
    letterSpacing: -0.5,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
});
