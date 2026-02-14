import { create } from "zustand";
import type { Board, Winner } from "../engine/ttt";
import { getWinner, newBoard, setCell } from "../engine/ttt";
import type { Difficulty } from "../engine/ai";
import { pickBotMove } from "../engine/ai";

export type Mode = "local" | "bot";

type State = {
  mode: Mode;
  difficulty: Difficulty;

  board: Board;
  turn: "X" | "O";
  winner: Winner;

  human: "X" | "O"; // актуально в режиме bot
  bot: "X" | "O";   // актуально в режиме bot
};

type Actions = {
  newGame: () => void;
  setMode: (m: Mode) => void;
  setDifficulty: (d: Difficulty) => void;
  setHumanSymbol: (s: "X" | "O") => void;
  clickCell: (idx: number) => void;
};

export const useGameStore = create<State & Actions>((set, get) => ({
  mode: "local",
  difficulty: "medium",

  board: newBoard(),
  turn: "X",
  winner: null,

  human: "X",
  bot: "O",

 newGame: () => {
  const { mode, human, bot, difficulty } = get();
  let board = newBoard();
  let turn: "X" | "O" = "X";
  let winner: Winner = null;

  // если режим bot и человек играет за O,
  // бот (X) ходит первым
  if (mode === "bot" && human === "O") {
    const botMove = pickBotMove(board, bot, difficulty);
    board = setCell(board, botMove, bot);
    winner = getWinner(board);
    turn = human;
  } else {
    turn = mode === "bot" ? human : "X";
  }

  set({ board, turn, winner });
},


  setMode: (m) => {
    set({ mode: m });
    get().newGame();
  },

  setDifficulty: (d) => set({ difficulty: d }),

  setHumanSymbol: (s) => {
    set({ human: s, bot: s === "X" ? "O" : "X" });
    get().newGame();
  },

  clickCell: (idx) => {
    const { mode, board, turn, winner, human, bot, difficulty } = get();
    if (winner !== null) return;

    // --- LOCAL: X и O по очереди ---
    if (mode === "local") {
      try {
        const nb = setCell(board, idx, turn);
        const w = getWinner(nb);

        set({
          board: nb,
          winner: w,
          turn: w === null ? (turn === "X" ? "O" : "X") : turn,
        });
      } catch {
        return;
      }
      return;
    }

    // --- BOT: человек ходит только своим символом, бот отвечает ---
    if (turn !== human) return;

    let afterHuman: Board;
    try {
      afterHuman = setCell(board, idx, human);
    } catch {
      return;
    }

    const w1 = getWinner(afterHuman);
    if (w1 !== null) {
      set({ board: afterHuman, winner: w1 });
      return;
    }

    // ход бота
    const botMove = pickBotMove(afterHuman, bot, difficulty);
    const afterBot = setCell(afterHuman, botMove, bot);

    const w2 = getWinner(afterBot);
    set({
      board: afterBot,
      winner: w2,
      turn: human, // после бота снова очередь человека
    });
  },
}));
