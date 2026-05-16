// Block Architect — piece definitions
// Each piece is a 2D boolean matrix with a neon color.

export type PieceColor = "pink" | "purple" | "cyan" | "mint" | "gold" | "orange";

export const NEON_COLORS: Record<PieceColor, string> = {
  pink: "#ff006e",
  purple: "#8338ec",
  cyan: "#3a86ff",
  mint: "#06ffa5",
  gold: "#ffbe0b",
  orange: "#ff9500",
};

export type PieceShape = number[][];

export type Piece = {
  id: string;
  shape: PieceShape;
  color: PieceColor;
};

// 25 well-balanced block-puzzle shapes
const SHAPES: PieceShape[] = [
  [[1]], // single
  [[1, 1]], // 2 horizontal
  [[1], [1]], // 2 vertical
  [[1, 1, 1]], // 3 horizontal
  [[1], [1], [1]], // 3 vertical
  [[1, 1, 1, 1]], // 4 horizontal
  [[1], [1], [1], [1]], // 4 vertical
  [[1, 1, 1, 1, 1]], // 5 horizontal
  [[1], [1], [1], [1], [1]], // 5 vertical
  [[1, 1], [1, 1]], // square 2x2
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]], // square 3x3
  [[1, 0], [1, 1]], // L corner
  [[0, 1], [1, 1]], // J corner
  [[1, 1], [1, 0]], // ⌐
  [[1, 1], [0, 1]], // ¬
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 0, 1], [1, 1, 1]], // L
  [[1, 1, 1], [1, 0, 0]], // L flipped
  [[1, 1, 1], [0, 0, 1]], // J flipped
  [[1, 1, 0], [0, 1, 1]], // S
  [[0, 1, 1], [1, 1, 0]], // Z
  [[1, 1, 1], [0, 1, 0]], // T
  [[0, 1, 0], [1, 1, 1]], // T inverted
  [[1, 0], [1, 0], [1, 1]], // L tall
  [[0, 1], [0, 1], [1, 1]], // J tall
];

const COLORS: PieceColor[] = ["pink", "purple", "cyan", "mint", "gold", "orange"];

let pieceCounter = 0;
const nextId = () => `piece_${Date.now()}_${pieceCounter++}`;

export function randomPiece(): Piece {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { id: nextId(), shape, color };
}

export function randomTriple(): Piece[] {
  return [randomPiece(), randomPiece(), randomPiece()];
}

export function pieceWidth(p: Piece): number {
  return p.shape[0].length;
}

export function pieceHeight(p: Piece): number {
  return p.shape.length;
}

export function pieceCellCount(p: Piece): number {
  let c = 0;
  for (const row of p.shape) for (const v of row) if (v) c++;
  return c;
}
