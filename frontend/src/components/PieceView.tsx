// Visual representation of a Piece (used in tray, ghost, hover overlay)
import React from "react";
import { View, StyleSheet } from "react-native";
import { Block } from "./Block";
import type { Piece } from "@/src/game/pieces";

type Props = {
  piece: Piece;
  cellSize: number;
  gap: number;
  opacity?: number;
  glow?: boolean;
  golden?: boolean;
};

export const PieceView = React.memo(function PieceView({
  piece,
  cellSize,
  gap,
  opacity,
  glow,
  golden,
}: Props) {
  const w = piece.shape[0].length;
  const h = piece.shape.length;
  return (
    <View
      style={{
        width: w * cellSize + (w - 1) * gap,
        height: h * cellSize + (h - 1) * gap,
      }}
    >
      {piece.shape.map((row, r) =>
        row.map((v, c) =>
          v ? (
            <View
              key={`${r}-${c}`}
              style={[
                styles.cell,
                {
                  left: c * (cellSize + gap),
                  top: r * (cellSize + gap),
                  width: cellSize,
                  height: cellSize,
                },
              ]}
            >
              <Block
                color={piece.color}
                size={cellSize}
                opacity={opacity}
                glow={glow}
                golden={golden}
              />
            </View>
          ) : null
        )
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  cell: { position: "absolute" },
});
