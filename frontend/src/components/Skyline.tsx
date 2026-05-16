// Animated city skyline with 6 progressively-unlocked buildings + slow day/night
// cycle: the sky brightens and darkens, stars fade in at night, and the
// buildings' windows light up after dusk.
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
  useDerivedValue,
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

// Pre-generated star positions
const STARS = [
  { cx: 30, cy: 18, r: 0.7 },
  { cx: 80, cy: 12, r: 0.6 },
  { cx: 150, cy: 8, r: 0.8 },
  { cx: 200, cy: 20, r: 0.7 },
  { cx: 260, cy: 14, r: 0.6 },
  { cx: 110, cy: 25, r: 0.5 },
  { cx: 175, cy: 30, r: 0.7 },
  { cx: 45, cy: 35, r: 0.5 },
  { cx: 225, cy: 38, r: 0.6 },
  { cx: 130, cy: 15, r: 0.4 },
  { cx: 65, cy: 28, r: 0.5 },
  { cx: 240, cy: 42, r: 0.4 },
];

// Pre-generated window pattern per building (deterministic, no hooks in loops)
function windowsFor(b: (typeof BUILDINGS)[number], i: number) {
  const cells: { x: number; y: number; on: boolean }[] = [];
  const rows = Math.floor(b.h / 8);
  const cols = Math.floor(b.w / 7);
  const top = 120 - b.h;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const seed = (i * 13 + row * 5 + col * 3) % 7;
      cells.push({
        x: b.x + 2 + col * 7,
        y: top + 4 + row * 8,
        on: seed < 5, // ~70% windows are "lit"
      });
    }
  }
  return cells;
}

function Star({
  cx,
  cy,
  r,
  nightness,
}: {
  cx: number;
  cy: number;
  r: number;
  nightness: SharedValue<number>;
}) {
  const props = useAnimatedProps(() => ({
    opacity: nightness.value * 0.9,
  }));
  return <AnimatedCircle animatedProps={props} cx={cx} cy={cy} r={r} fill="#fff" />;
}

function LitWindow({
  x,
  y,
  on,
  nightness,
  buildingUnlocked,
}: {
  x: number;
  y: number;
  on: boolean;
  nightness: SharedValue<number>;
  buildingUnlocked: boolean;
}) {
  // Day: dim. Night: bright if window is "on", dim otherwise.
  const props = useAnimatedProps(() => {
    if (!on) {
      // unlit windows always faint
      return { opacity: 0.35 } as any;
    }
    const litAtNight = 0.95;
    const dimByDay = buildingUnlocked ? 0.55 : 0.15;
    const op = dimByDay + (litAtNight - dimByDay) * nightness.value;
    const fill = interpolateColor(
      nightness.value,
      [0, 1],
      [buildingUnlocked ? "#ffd966" : "#3a3a4f", "#ffe680"]
    );
    return { opacity: op, fill } as any;
  });
  return (
    <AnimatedRect
      animatedProps={props}
      x={x}
      y={y}
      width={3}
      height={3}
      fill={on ? "#ffe680" : "#0a0a18"}
    />
  );
}

type Props = {
  linesCleared: number;
  width: number;
};

export function Skyline({ linesCleared, width }: Props) {
  const SCENE_W = 290;
  const SCENE_H = 120;
  const safeWidth = Math.max(50, width || 290);
  const scale = safeWidth / SCENE_W;
  const linesInCycle = linesCleared % 60;

  // dayPhase: 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk, 1 = back to midnight
  // Cycle period = 4 minutes (240s) — slow and meditative.
  const dayPhase = useSharedValue(0.5);
  useEffect(() => {
    dayPhase.value = withRepeat(
      withTiming(1, { duration: 240000, easing: Easing.linear }),
      -1,
      false
    );
  }, [dayPhase]);

  // Convert phase to a "nightness" 0..1 where 1 = full night, 0 = full day
  // shaped like a smooth sine so midnight (phase=0 or 1) = 1, noon (phase=0.5) = 0
  const nightness = useDerivedValue(() => {
    const p = dayPhase.value;
    return 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
  });

  // Animated sky color: deep night → dawn pink → noon teal → dusk amber → night
  const skyProps = useAnimatedProps(() => {
    const fill = interpolateColor(
      dayPhase.value,
      [0, 0.15, 0.25, 0.5, 0.75, 0.85, 1],
      [
        "#070716", // midnight
        "#181434", // pre-dawn
        "#4a2e5e", // dawn pink-purple
        "#2c5f8f", // noon teal
        "#7a3a4a", // dusk pink-amber
        "#241836", // twilight
        "#070716", // back to midnight
      ]
    );
    return { fill } as any;
  });

  // Horizon glow band that brightens at dawn/dusk
  const horizonProps = useAnimatedProps(() => {
    const p = dayPhase.value;
    // Peak intensity around dawn (0.2) and dusk (0.78)
    const dawnPeak = Math.exp(-Math.pow((p - 0.2) * 10, 2));
    const duskPeak = Math.exp(-Math.pow((p - 0.78) * 10, 2));
    const intensity = Math.max(dawnPeak, duskPeak);
    return { opacity: intensity * 0.6 } as any;
  });

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
          <SvgGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ff9500" stopOpacity="0" />
            <Stop offset="0.7" stopColor="#ff9500" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#ffbe0b" stopOpacity="1" />
          </SvgGradient>
        </Defs>

        {/* Animated sky */}
        <AnimatedRect
          animatedProps={skyProps}
          x={0}
          y={0}
          width={SCENE_W}
          height={SCENE_H}
        />

        {/* Dawn / dusk horizon glow band */}
        <AnimatedRect
          animatedProps={horizonProps}
          x={0}
          y={SCENE_H - 50}
          width={SCENE_W}
          height={50}
          fill="url(#horizonGlow)"
        />

        {/* Stars (only show at night) */}
        {STARS.map((s, i) => (
          <Star
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            nightness={nightness}
          />
        ))}

        {/* Buildings */}
        {BUILDINGS.map((b, i) => {
          const unlocked = linesInCycle >= THRESHOLDS[i];
          const top = SCENE_H - b.h;
          const cells = windowsFor(b, i);
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
                opacity={unlocked ? 1 : 0.5}
              />
              {/* Windows */}
              {cells.map((c, idx) => (
                <LitWindow
                  key={idx}
                  x={c.x}
                  y={c.y}
                  on={c.on}
                  nightness={nightness}
                  buildingUnlocked={unlocked}
                />
              ))}
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

        {/* Ground / horizon line */}
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
