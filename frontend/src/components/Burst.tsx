// Particle burst component — spawns N particles at (x,y) and animates them outward.
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
} from "react-native-reanimated";

type ParticleProps = {
  angle: number;
  color: string;
  delay?: number;
};

function Particle({ angle, color, delay = 0 }: ParticleProps) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [t, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    const dist = t.value * 60;
    return {
      transform: [
        { translateX: Math.cos(angle) * dist },
        { translateY: Math.sin(angle) * dist },
        { scale: 1 - t.value * 0.7 },
      ],
      opacity: 1 - t.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color, shadowColor: color },
        animatedStyle,
      ]}
    />
  );
}

type Props = {
  x: number;
  y: number;
  color: string;
  onComplete: () => void;
};

export function Burst({ x, y, color, onComplete }: Props) {
  useEffect(() => {
    const id = setTimeout(onComplete, 900);
    return () => clearTimeout(id);
  }, [onComplete]);

  const count = 10;
  return (
    <View style={[styles.wrap, { left: x, top: y }]} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <Particle
          key={i}
          angle={(i / count) * Math.PI * 2}
          color={color}
          delay={i * 8}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    width: 1,
    height: 1,
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
});
