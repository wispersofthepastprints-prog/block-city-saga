// Lightweight icon component using unicode glyphs + text rendering.
// Avoids @expo/vector-icons font-loading issues entirely (Expo Go has known
// intermittent bugs where Ionicons.ttf is reported as empty).
// API mirrors Ionicons: <Icon name="flame" size={16} color="#ff9500" />
import React from "react";
import { Text, TextStyle, StyleProp } from "react-native";

const GLYPHS: Record<string, string> = {
  flame: "🔥",
  cash: "◉",
  "add-circle": "＋",
  "settings-outline": "⚙",
  flash: "⚡",
  bulb: "💡",
  "arrow-undo": "↶",
  hammer: "🔨",
  refresh: "↻",
  "volume-high": "🔊",
  "musical-notes": "♪",
  "phone-portrait": "▭",
  close: "✕",
  star: "★",
  rocket: "▲",
  trophy: "♛",
  "close-circle": "⊘",
  diamond: "◆",
  "play-circle": "▶",
  "checkmark-circle": "✓",
  checkmark: "✓",
};

// Some glyphs are emoji and should keep their native color (set by the OS).
const EMOJI_GLYPHS = new Set(["flame", "bulb", "hammer"]);

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 16, color = "#fff", style }: Props) {
  const glyph = GLYPHS[name] ?? "•";
  const isEmoji = EMOJI_GLYPHS.has(name);
  return (
    <Text
      style={[
        {
          fontSize: size,
          lineHeight: size * 1.1,
          color: isEmoji ? undefined : color,
          textAlign: "center",
          width: size * 1.2,
        },
        style,
      ]}
      allowFontScaling={false}
    >
      {glyph}
    </Text>
  );
}
