// Block Architect — grid logic
import type { Piece, PieceColor } from "./pieces";

export const COLS = 8;
export const ROWS = 10;

export type Cell = { filled: boolean; color: PieceColor | null };

export function emptyGrid(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ filled: false, color: null }))
  );
}

export function canPlace(grid: Cell[][], piece: Piece, row: number, col: number): boolean {
  const h = piece.shape.length;
  const w = piece.shape[0].length;
  if (row < 0 || col < 0 || row + h > ROWS || col + w > COLS) return false;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (piece.shape[r][c] && grid[row + r][col + c].filled) return false;
    }
  }
  return true;
}

export function placePiece(grid: Cell[][], piece: Piece, row: number, col: number): Cell[][] {
  const next = grid.map((r) => r.map((c) => ({ ...c })));
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[0].length; c++) {
      if (piece.shape[r][c]) {
        next[row + r][col + c] = { filled: true, color: piece.color };
      }
    }
  }
  return next;
}

export type ClearResult = {
  grid: Cell[][];
  rowsCleared: number[];
  colsCleared: number[];
};

export function clearLines(grid: Cell[][]): ClearResult {
  const rowsCleared: number[] = [];
  const colsCleared: number[] = [];

  for (let r = 0; r < ROWS; r++) {
    if (grid[r].every((c) => c.filled)) rowsCleared.push(r);
  }
  for (let c = 0; c < COLS; c++) {
    let full = true;
    for (let r = 0; r < ROWS; r++) {
      if (!grid[r][c].filled) {
        full = false;
        break;
      }
    }
    if (full) colsCleared.push(c);
  }

  if (rowsCleared.length === 0 && colsCleared.length === 0) {
    return { grid, rowsCleared, colsCleared };
  }

  const next = grid.map((r) => r.map((c) => ({ ...c })));
  for (const r of rowsCleared) {
    for (let c = 0; c < COLS; c++) next[r][c] = { filled: false, color: null };
  }
  for (const c of colsCleared) {
    for (let r = 0; r < ROWS; r++) next[r][c] = { filled: false, color: null };
  }
  // Apply gravity: all remaining blocks fall to the bottom of each column.
  return { grid: applyGravity(next), rowsCleared, colsCleared };
}

// Per-column gravity — for each column, collect filled cells and stack them
// at the bottom. Empty cells float to the top. Used after line/column clears.
export function applyGravity(grid: Cell[][]): Cell[][] {
  const next = emptyGrid();
  for (let c = 0; c < COLS; c++) {
    const stack: Cell[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][c].filled) stack.push({ ...grid[r][c] });
    }
    let writeRow = ROWS - 1;
    for (let i = stack.length - 1; i >= 0; i--, writeRow--) {
      next[writeRow][c] = stack[i];
    }
  }
  return next;
}

export function isGridLocked(grid: Cell[][], pieces: (Piece | null)[]): boolean {
  for (const piece of pieces) {
    if (!piece) continue;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (canPlace(grid, piece, r, c)) return false;
      }
    }
  }
  return true;
}

export function fillPercent(grid: Cell[][]): number {
  let f = 0;
  for (const row of grid) for (const c of row) if (c.filled) f++;
  return f / (ROWS * COLS);
}
