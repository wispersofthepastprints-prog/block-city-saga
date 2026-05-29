const fs = require("fs");

// ── 1. Write Tray.tsx ──
const tray = `// Bottom tray + drag-drop slots + floating ghost piece
import React from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { PieceView } from "./PieceView";
import type { Piece } from "@/src/game/pieces";
import { haptic } from "@/src/services/audio";

const TRAY_CELL = 16;
const TRAY_GAP = 2;
const GHOST_CELL = 36;

type Props = {
  pieces: (Piece | null)[];
  slotWidth: number;
  onDragStart: (idx: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (idx: number, x: number, y: number) => boolean;
  goldenSkin: boolean;
};

export function Tray({
  pieces,
  slotWidth,
  onDragStart,
  onDragMove,
  onDragEnd,
  goldenSkin,
}: Props) {
  return (
    <View style={[styles.tray, { gap: 6 }]} testID="game-tray">
      {pieces.map((piece, i) => (
        <View key={i} style={[styles.slotWrap, { width: slotWidth }]}>
          {piece ? (
            <DraggableSlot
              piece={piece}
              idx={i}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              goldenSkin={goldenSkin}
            />
          ) : (
            <View style={styles.emptySlot} />
          )}
        </View>
      ))}
    </View>
  );
}

function DraggableSlot({
  piece,
  idx,
  onDragStart,
  onDragMove,
  onDragEnd,
  goldenSkin,
}: {
  piece: Piece;
  idx: number;
  onDragStart: (idx: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (idx: number, x: number, y: number) => boolean;
  goldenSkin: boolean;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(0);

  const onMoveJS = (x: number, y: number) => {
    onDragMove(x, y);
  };
  const onStartJS = () => {
    haptic.light();
    onDragStart(idx);
  };
  const onEndJS = (x: number, y: number) => {
    onDragEnd(idx, x, y);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onStart(() => {
      isDragging.value = 1;
      scale.value = withTiming(1.0, { duration: 100 });
      runOnJS(onStartJS)();
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      runOnJS(onMoveJS)(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      runOnJS(onEndJS)(e.absoluteX, e.absoluteY);
      tx.value = withSpring(0, { damping: 14, stiffness: 180 });
      ty.value = withSpring(0, { damping: 14, stiffness: 180 });
      scale.value = withTiming(1, { duration: 150 });
      isDragging.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const draggingScale = isDragging.value === 1 ? GHOST_CELL / TRAY_CELL : 1;
    const liftY = isDragging.value === 1 ? -70 : 0;
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value + liftY },
        { scale: draggingScale },
      ],
      zIndex: isDragging.value === 1 ? 999 : 1,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.draggable, animatedStyle]}
        testID={\`tray-piece-\${idx}\`}
      >
        <PieceView
          piece={piece}
          cellSize={TRAY_CELL}
          gap={TRAY_GAP}
          golden={goldenSkin}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
    height: 90,
    flexShrink: 0,
    alignItems: "center",
    backgroundColor: "#050510",
  },
  slotWrap: {
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  emptySlot: {
    width: "100%",
    height: "100%",
  },
  draggable: {
    alignItems: "center",
    justifyContent: "center",
  },
});
`;

fs.writeFileSync("src/components/Tray.tsx", tray);
console.log("✓ Tray.tsx written");

// ── 2. Write GameGrid.tsx ──
const grid = `// 8x10 game grid + hover overlay
import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Block } from "./Block";
import type { Cell } from "@/src/game/logic";
import { COLS, ROWS } from "@/src/game/logic";
import type { Piece, PieceColor } from "@/src/game/pieces";

const MAX_CELL = 38;
const MIN_CELL = 28;

export const CELL_GAP = 3;
export const GRID_PAD = 4;

export const CELL_SIZE = 36;
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
  cellSize?: number;
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
  cellSize: propCellSize,
}: Props) {
  const { height: winH } = useWindowDimensions();

  const liveCellSize = useMemo(() => {
    if (propCellSize) return propCellSize;
    const reserved = 320;
    const available = Math.max(winH - reserved, 280);
    const raw = Math.floor(
      (available - (ROWS - 1) * CELL_GAP - GRID_PAD * 2) / ROWS
    );
    return Math.max(MIN_CELL, Math.min(MAX_CELL, raw));
  }, [propCellSize, winH]);

  const innerW = COLS * liveCellSize + (COLS - 1) * CELL_GAP;
  const innerH = ROWS * liveCellSize + (ROWS - 1) * CELL_GAP;
  const gridW = innerW + GRID_PAD * 2;
  const gridH = innerH + GRID_PAD * 2;

  const hoverCells = [];
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
      style={[styles.wrap, { width: gridW, height: gridH }]}
      onLayout={(e) => {
        const { x, y } = e.nativeEvent.layout;
        onGridLayout(x, y);
      }}
    >
      {Array.from({ length: ROWS }).map((_, r) =>
        Array.from({ length: COLS }).map((__, c) => (
          <View
            key={\`bg-\${r}-\${c}\`}
            style={[
              styles.bgCell,
              {
                left: GRID_PAD + c * (liveCellSize + CELL_GAP),
                top: GRID_PAD + r * (liveCellSize + CELL_GAP),
                width: liveCellSize,
                height: liveCellSize,
              },
            ]}
          />
        ))
      )}

      {grid.map((row, r) =>
        row.map((cell, c) =>
          cell.filled && cell.color ? (
            <View
              key={\`blk-\${r}-\${c}\`}
              style={[
                styles.posCell,
                {
                  left: GRID_PAD + c * (liveCellSize + CELL_GAP),
                  top: GRID_PAD + r * (liveCellSize + CELL_GAP),
                  opacity:
                    clearingRows.includes(r) || clearingCols.includes(c)
                      ? 0
                      : 1,
                },
              ]}
            >
              <Block color={cell.color} size={liveCellSize} golden={goldenSkin} />
            </View>
          ) : null
        )
      )}

      {hoverCells.map((hc, i) => {
        const inBounds =
          hc.r >= 0 && hc.r < ROWS && hc.c >= 0 && hc.c < COLS;
        return (
          <View
            key={\`hov-\${i}\`}
            style={[
              styles.posCell,
              {
                left: GRID_PAD + hc.c * (liveCellSize + CELL_GAP),
                top: GRID_PAD + hc.r * (liveCellSize + CELL_GAP),
                opacity: inBounds ? 0.55 : 0,
                pointerEvents: "none",
              },
            ]}
          >
            <Block
              color={hc.color}
              size={liveCellSize}
              opacity={hc.valid ? 0.65 : 0.4}
              glow={hc.valid}
            />
            {!hc.valid && (
              <View
                style={[
                  styles.invalidOverlay,
                  { width: liveCellSize, height: liveCellSize },
                ]}
              />
            )}
          </View>
        );
      })}

      {flashRows.map((r) => (
        <View
          key={\`fr-\${r}\`}
          style={[
            styles.flash,
            {
              left: GRID_PAD,
              top: GRID_PAD + r * (liveCellSize + CELL_GAP),
              width: innerW,
              height: liveCellSize,
              pointerEvents: "none",
            },
          ]}
        />
      ))}
      {flashCols.map((c) => (
        <View
          key={\`fc-\${c}\`}
          style={[
            styles.flash,
            {
              left: GRID_PAD + c * (liveCellSize + CELL_GAP),
              top: GRID_PAD,
              width: liveCellSize,
              height: innerH,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
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
`;

fs.writeFileSync("src/components/GameGrid.tsx", grid);
console.log("✓ GameGrid.tsx written");

// ── 3. Patch GameScreen.tsx ──
let gs = fs.readFileSync("src/components/GameScreen.tsx", "utf8");

// Remove bottomPad spacer
gs = gs.replace(/<View\s+style=\{\{\s*height:\s*bottomPad\s*\}\}\s*\/>/g, "");

// Wrap Tray in trayArea
const trayRegex = /(<Tray[\s\S]*?goldenSkin=\{passActive\}[\s\S]*?\/>)/;
if (trayRegex.test(gs)) {
  gs = gs.replace(trayRegex, "<View style={styles.trayArea}>\n        $1\n        </View>");
  console.log("✓ Tray wrapped in trayArea");
} else {
  console.log("⚠ Could not find Tray tag — manual edit needed");
}

// Add cellSize to GameGrid
if (!gs.includes("cellSize={liveCellSize}")) {
  gs = gs.replace(
    /<GameGrid\s*\n/,
    "<GameGrid\n            cellSize={liveCellSize}\n"
  );
  console.log("✓ cellSize prop added to GameGrid");
}

// Update dangerOverlay style
if (!gs.includes("width: liveGridW")) {
  gs = gs.replace(
    /style=\{\[styles\.dangerOverlay,\s*dangerStyle,\s*\{\s*pointerEvents:\s*"none"\s*\}\]\}/,
    "style={[styles.dangerOverlay, dangerStyle, { pointerEvents: "none", width: liveGridW, height: liveGridH }]}"
  );
  console.log("✓ dangerOverlay uses live dimensions");
}

// Add new styles to StyleSheet.create
if (!gs.includes("trayArea:")) {
  const newStyles = `  topContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  trayArea: {
    height: 90,
    flexShrink: 0,
    width: "100%",
    justifyContent: "center",
    backgroundColor: "#050510",
  },`;
  gs = gs.replace(
    /const styles = StyleSheet\.create\(\{/,
    `const styles = StyleSheet.create({\n${newStyles}`
  );
  console.log("✓ Styles added");
}

fs.writeFileSync("src/components/GameScreen.tsx", gs);
console.log("✓ GameScreen.tsx patched");
console.log("\nAll layout fixes applied. Run: git add . && git commit -m \"Fix layout\" && git push");
