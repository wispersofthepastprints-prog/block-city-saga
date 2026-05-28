// ---------------------------------------------------------------------------
// useLiveCellSize
//
// Responsively shrinks the 8×10 game grid so it always fits on screen above
// the piece tray, while keeping every cell large enough to be a comfortable
// touch target on tiny phones and not absurdly large on tablets.
//
// SINGLE SOURCE OF TRUTH for any code that needs to translate between
// drag-position and grid coordinates — both `GameGrid` (rendering) and
// `GameScreen` (drag math + danger overlay) consume this hook.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { COLS, ROWS } from "@/src/game/logic";

// Tunable layout constants — exported so callers can share the same gap/pad.
export const CELL_GAP = 3;
export const GRID_PAD = 4;

// Per-cell guardrails. 44 dp is Apple/Google's minimum recommended touch
// target — at 28 px the cell is smaller than that, but the *piece itself* is
// drag-tracked by absoluteX/Y on the gesture handler, so this stays usable.
const MIN_CELL = 28;
const MAX_CELL = 38;

// Vertical space reserved for everything that is NOT the grid:
//   TopBar / HUD ≈ 90
//   Skyline      ≈ 100
//   Tray         ≈ 90
//   Safe-area    ≈ 40
const RESERVED_HEIGHT = 320;

export type GridSize = {
  /** Width/height of one cell in dp. */
  cellSize: number;
  /** Inner playable width (cols × cellSize + gaps). */
  innerW: number;
  /** Inner playable height (rows × cellSize + gaps). */
  innerH: number;
  /** Total grid width including the frame padding. */
  gridW: number;
  /** Total grid height including the frame padding. */
  gridH: number;
};

export function useLiveCellSize(): GridSize {
  const { height: winH } = useWindowDimensions();
  return useMemo(() => {
    const available = Math.max(winH - RESERVED_HEIGHT, 280);
    const raw = Math.floor(
      (available - (ROWS - 1) * CELL_GAP - GRID_PAD * 2) / ROWS,
    );
    const cellSize = Math.max(MIN_CELL, Math.min(MAX_CELL, raw));
    const innerW = COLS * cellSize + (COLS - 1) * CELL_GAP;
    const innerH = ROWS * cellSize + (ROWS - 1) * CELL_GAP;
    const gridW = innerW + GRID_PAD * 2;
    const gridH = innerH + GRID_PAD * 2;
    return { cellSize, innerW, innerH, gridW, gridH };
  }, [winH]);
}
