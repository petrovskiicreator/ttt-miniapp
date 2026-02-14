import type { Board, Winner } from "./ttt";
import { availableMoves, getWinner, setCell } from "./ttt";

export type Difficulty = "easy" | "medium" | "hard";

function score(w: Winner, bot: "X" | "O"): number {
  if (w === null || w === "draw") return 0;
  return w === bot ? 1 : -1;
}

function next(turn: "X" | "O"): "X" | "O" {
  return turn === "X" ? "O" : "X";
}

function minimax(board: Board, turn: "X" | "O", bot: "X" | "O"): { move: number | null; val: number } {
  const w = getWinner(board);
  if (w !== null) return { move: null, val: score(w, bot) };

  const moves = availableMoves(board);
  const isMax = turn === bot;

  let bestMove: number | null = null;
  let bestVal = isMax ? -Infinity : Infinity;

  for (const m of moves) {
    const nb = setCell(board, m, turn);
    const res = minimax(nb, next(turn), bot);

    if (isMax) {
      if (res.val > bestVal) { bestVal = res.val; bestMove = m; }
    } else {
      if (res.val < bestVal) { bestVal = res.val; bestMove = m; }
    }
  }

  return { move: bestMove, val: bestVal };
}

export function pickBotMove(board: Board, bot: "X" | "O", difficulty: Difficulty): number {
  const moves = availableMoves(board);
  if (moves.length === 0) throw new Error("No moves");

  if (difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (difficulty === "medium") {
    if (Math.random() < 0.35) return moves[Math.floor(Math.random() * moves.length)];
  }

  const { move } = minimax(board, bot, bot);
  return move ?? moves[0];
}
