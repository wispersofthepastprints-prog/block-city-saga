// 8x10 game grid + hover overlay
import React from "react";
import { View, StyleSheet } from "react-native";
import { Block } from "./Block";
import type { Cell } from "@/src/game/logic";
import { COLS, ROWS } from "@/src/game/logic";
import type { Piece, PieceColor } from "@/src/game/pieces";

export const CELL_SIZE = 36;
export const CELL_GAP = 3;
export const GRID_PAD = 4;

export const GRID_INNER_W = COLS * CELL_SIZE + (COLS - 1) * CELL_GAP;
export const GRID_INNER_H = ROWS * CELL_SIZE + (ROWS - 1) * CELL_GAP;
export const GRID_W = GRID_INNER_W + GRID_PAD * 2;
export const GRID_H = GRID_INNER_H + GRID_PAD * 2;

type Props = {
  grid: Cell[][];
  hover: { row: number; col: number; piece: Piece; valid: boolean } | null;
  clearingRows: number[];
  clearingCols: number[];
  flashRows: number[];
  flashCols: number[];
  goldenSkin: boolean;
  onGridLayout: (x: number, y: number) => void;
};

export const GameGrid = React.memo(function GameGrid({
  grid,
  hover,
  clearingRows,
  clearingCols,
  flashRows,
  flashCols,
  goldenSkin,
  onGridLayout,
}: Props) {
  // hover overlay cells
  const hoverCells: { r: number; c: number; color: PieceColor; valid: boolean }[] = [];
  if (hover) {
    for (let r = 0; r < hover.piece.shape.length; r++) {
      for (let c = 0; c < hover.piece.shape[0].length; c++) {
        if (hover.piece.shape[r][c]) {
          hoverCells.push({
            r: hover.row + r,
            c: hover.col + c,
            color: hover.piece.color,
            valid: hover.valid,
          });
        }
      }
    }
  }

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const { x, y } = e.nativeEvent.layout;
        onGridLayout(x, y);
      }}
    >
      {/* background cells (empty grid) */}
      {Array.from({ length: ROWS }).map((_, r) =>
        Array.from({ length: COLS }).map((__, c) => (
          <View
            key={`bg-${r}-${c}`}
            style={[
              styles.bgCell,
              {
                left: GRID_PAD + c * (CELL_SIZE + CELL_GAP),
                top: GRID_PAD + r * (CELL_SIZE + CELL_GAP),
                width: CELL_SIZE,
                height: CELL_SIZE,
              },
            ]}
          />
        ))
      )}

      {/* placed blocks */}
      {grid.map((row, r) =>
        row.map((cell, c) =>
          cell.filled && cell.color ? (
            <View
              key={`blk-${r}-${c}`}
              style={[
                styles.posCell,
                {
                  left: GRID_PAD + c * (CELL_SIZE + CELL_GAP),
                  top: GRID_PAD + r * (CELL_SIZE + CELL_GAP),
                  opacity:
                    clearingRows.includes(r) || clearingCols.includes(c)
                      ? 0
                      : 1,
                },
              ]}
            >
              <Block color={cell.color} size={CELL_SIZE} golden={goldenSkin} />
            </View>
          ) : null
        )
      )}

      {/* hover overlay - translucent ghost on grid */}
      {hoverCells.map((hc, i) => {
        const inBounds =
          hc.r >= 0 && hc.r < ROWS && hc.c >= 0 && hc.c < COLS;
        return (
          <View
            key={`hov-${i}`}
            style={[
              styles.posCell,
              {
                left: GRID_PAD + hc.c * (CELL_SIZE + CELL_GAP),
                top: GRID_PAD + hc.r * (CELL_SIZE + CELL_GAP),
                opacity: inBounds ? 0.55 : 0,
              },
            ]}
            pointerEvents="none"
          >
            <Block
              color={hc.color}
              size={CELL_SIZE}
              opacity={hc.valid ? 0.65 : 0.4}
              glow={hc.valid}
            />
            {!hc.valid && (
              <View
                style={[
                  styles.invalidOverlay,
                  { width: CELL_SIZE, height: CELL_SIZE },
                ]}
              />
            )}
          </View>
        );
      })}

      {/* row/col flash (white flash before clearing) */}
      {flashRows.map((r) => (
        <View
          key={`fr-${r}`}
          pointerEvents="none"
          style={[
            styles.flash,
            {
              left: GRID_PAD,
              top: GRID_PAD + r * (CELL_SIZE + CELL_GAP),
              width: GRID_INNER_W,
              height: CELL_SIZE,
            },
          ]}
        />
      ))}
      {flashCols.map((c) => (
        <View
          key={`fc-${c}`}
          pointerEvents="none"
          style={[
            styles.flash,
            {
              left: GRID_PAD + c * (CELL_SIZE + CELL_GAP),
              top: GRID_PAD,
              width: CELL_SIZE,
              height: GRID_INNER_H,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: GRID_W,
    height: GRID_H,
    backgroundColor: "#0a0a18",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a40",
    overflow: "hidden",
  },
  bgCell: {
    position: "absolute",
    backgroundColor: "#151525",
    borderRadius: 6,
  },
  posCell: {
    position: "absolute",
  },
  flash: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 4,
  },
  invalidOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,0,51,0.45)",
    borderRadius: 6,
  },
});
