// Animated city skyline with 6 progressively-unlocked buildings and a subtle day/night cycle.
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  SharedValue,
  withTiming,
  withRepeat,
  Easing,
  interpolateColor,
} from "react-native-reanimated";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const BUILDINGS = [
  { x: 10, w: 38, h: 60, gradId: "g_pink", colors: ["#ff006e", "#8338ec"] },
  { x: 56, w: 32, h: 85, gradId: "g_purple", colors: ["#8338ec", "#3a86ff"] },
  { x: 96, w: 42, h: 70, gradId: "g_cyan", colors: ["#3a86ff", "#06ffa5"] },
  { x: 146, w: 36, h: 95, gradId: "g_mint", colors: ["#06ffa5", "#3a86ff"] },
  { x: 190, w: 44, h: 75, gradId: "g_gold", colors: ["#ffbe0b", "#ff9500"] },
  { x: 242, w: 38, h: 100, gradId: "g_orange", colors: ["#ff9500", "#ff006e"] },
];

const THRESHOLDS = [5, 12, 20, 28, 38, 48];

const STARS = [
  { cx: 30, cy: 18 },
  { cx: 80, cy: 12 },
  { cx: 150, cy: 8 },
  { cx: 200, cy: 20 },
  { cx: 260, cy: 14 },
  { cx: 110, cy: 25 },
  { cx: 175, cy: 30 },
];

function Star({
  cx,
  cy,
  phase,
}: {
  cx: number;
  cy: number;
  phase: SharedValue<number>;
}) {
  const props = useAnimatedProps(() => ({
    opacity: (1 - phase.value) * 0.85,
  }));
  return <AnimatedCircle animatedProps={props} cx={cx} cy={cy} r={0.7} fill="#fff" />;
}

type Props = {
  linesCleared: number;
  width: number;
};

export function Skyline({ linesCleared, width }: Props) {
  const SCENE_W = 290;
  const SCENE_H = 120;
  // Guard against initial bad widths (e.g., on SSR / web hydration)
  const safeWidth = Math.max(50, width || 290);
  const scale = safeWidth / SCENE_W;
  const linesInCycle = linesCleared % 60;

  const dayPhase = useSharedValue(0); // 0 = night, 1 = day

  useEffect(() => {
    dayPhase.value = withRepeat(
      withTiming(1, { duration: 30000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [dayPhase]);

  const skyProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      dayPhase.value,
      [0, 1],
      ["#0a0a1f", "#1e2748"]
    ),
  }));

  const sunProps = useAnimatedProps(() => ({
    opacity: dayPhase.value,
    cy: 22 + (1 - dayPhase.value) * 30,
  }));

  const moonProps = useAnimatedProps(() => ({
    opacity: 1 - dayPhase.value,
    cy: 22 + dayPhase.value * 30,
  }));

  return (
    <View
      style={[styles.wrap, { width: safeWidth, height: SCENE_H * scale }]}
      pointerEvents="none"
    >
      <Svg
        width={safeWidth}
        height={SCENE_H * scale}
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      >
        <Defs>
          {BUILDINGS.map((b) => (
            <SvgGradient
              key={b.gradId}
              id={b.gradId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <Stop offset="0" stopColor={b.colors[0]} stopOpacity="1" />
              <Stop offset="1" stopColor={b.colors[1]} stopOpacity="1" />
            </SvgGradient>
          ))}
        </Defs>

        <AnimatedRect
          animatedProps={skyProps}
          x={0}
          y={0}
          width={SCENE_W}
          height={SCENE_H}
        />

        {STARS.map((s, i) => (
          <Star key={i} cx={s.cx} cy={s.cy} phase={dayPhase} />
        ))}

        {/* Moon glow */}
        <AnimatedCircle
          animatedProps={moonProps}
          cx={50}
          cy={22}
          r={14}
          fill="#e8e8ff"
          opacity={0.18}
        />
        <AnimatedCircle
          animatedProps={moonProps}
          cx={50}
          cy={22}
          r={9}
          fill="#e8e8ff"
        />
        <AnimatedCircle
          animatedProps={moonProps}
          cx={47}
          cy={20}
          r={2}
          fill="#b8b8d4"
        />

        {/* Sun */}
        <AnimatedCircle
          animatedProps={sunProps}
          cx={240}
          cy={22}
          r={16}
          fill="#ffbe0b"
          opacity={0.2}
        />
        <AnimatedCircle
          animatedProps={sunProps}
          cx={240}
          cy={22}
          r={10}
          fill="#ffbe0b"
        />

        {/* Buildings */}
        {BUILDINGS.map((b, i) => {
          const unlocked = linesInCycle >= THRESHOLDS[i];
          const top = SCENE_H - b.h;
          return (
            <React.Fragment key={i}>
              {unlocked && (
                <Rect
                  x={b.x - 2}
                  y={top - 2}
                  width={b.w + 4}
                  height={b.h + 4}
                  fill={`url(#${b.gradId})`}
                  opacity={0.18}
                />
              )}
              <Rect
                x={b.x}
                y={top}
                width={b.w}
                height={b.h}
                fill={unlocked ? `url(#${b.gradId})` : "#1a1a2a"}
                opacity={unlocked ? 1 : 0.45}
              />
              {Array.from({ length: Math.floor(b.h / 8) }).map((_, row) =>
                Array.from({ length: Math.floor(b.w / 7) }).map((_, col) => {
                  const seed = (i * 13 + row * 5 + col * 3) % 7;
                  const lit = unlocked && seed < 5;
                  return (
                    <Rect
                      key={`${row}-${col}`}
                      x={b.x + 2 + col * 7}
                      y={top + 4 + row * 8}
                      width={3}
                      height={3}
                      fill={lit ? "#ffe680" : "#0a0a18"}
                      opacity={lit ? 0.9 : 0.6}
                    />
                  );
                })
              )}
              {unlocked && b.h > 80 && (
                <Rect
                  x={b.x + b.w / 2 - 0.5}
                  y={top - 6}
                  width={1}
                  height={6}
                  fill={b.colors[0]}
                />
              )}
            </React.Fragment>
          );
        })}

        <Rect x={0} y={SCENE_H - 4} width={SCENE_W} height={4} fill="#000" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderRadius: 8,
  },
});
