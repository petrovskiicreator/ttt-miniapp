export type Cell = "X" | "O" | ".";
export type Board = string;
export type Winner = "X" | "O" | "draw" | null;

const WIN_LINES: number[][] = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

export function newBoard(): Board {
  return ".........";
}

export function cellAt(board: Board, idx: number): Cell {
  return board[idx] as Cell;
}

export function setCell(board: Board, idx: number, v: "X" | "O"): Board {
  if (board[idx] !== ".") throw new Error("Cell not empty");
  return board.slice(0, idx) + v + board.slice(idx + 1);
}

export function availableMoves(board: Board): number[] {
  const res: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === ".") res.push(i);
  }
  return res;
}

export function getWinner(board: Board): Winner {
  for (const [a,b,c] of WIN_LINES) {
    const v = board[a];
    if (v !== "." && v === board[b] && v === board[c]) {
      return v as "X" | "O";
    }
  }

  if (!board.includes(".")) return "draw";

  return null;
}
