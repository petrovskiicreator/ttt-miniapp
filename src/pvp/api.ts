import { supabase } from "../lib/supabase";
import type { Board, Winner } from "../engine/ttt";
import { getWinner, setCell } from "../engine/ttt";

export type GameRow = {
  id: string;
  board: Board;
  turn: "X" | "O";
  status: "active" | "finished";
  winner: Winner;
  player_x: string | null;
  player_o: string | null;
  updated_at: string;
};

export async function createGame(myId: string): Promise<GameRow> {
  const { data, error } = await supabase
    .from("games")
    .insert({ player_x: myId, player_o: null, board: ".........", turn: "X", status: "active", winner: null })
    .select("*")
    .single();

  if (error) throw error;
  return data as GameRow;
}

export async function getGame(id: string): Promise<GameRow> {
  const { data, error } = await supabase.from("games").select("*").eq("id", id).single();
  if (error) throw error;
  return data as GameRow;
}

export async function joinGame(id: string, myId: string): Promise<GameRow> {
  const g = await getGame(id);
  if (!g.player_o && g.player_x !== myId) {
    const { data, error } = await supabase
      .from("games")
      .update({ player_o: myId })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as GameRow;
  }
  return g;
}

export function mySymbol(g: GameRow, myId: string): "X" | "O" | null {
  if (g.player_x === myId) return "X";
  if (g.player_o === myId) return "O";
  return null;
}

export async function makeMove(id: string, myId: string, idx: number): Promise<GameRow> {
  const g = await getGame(id);
  if (g.status !== "active") return g;

  const s = mySymbol(g, myId);
  if (!s) throw new Error("Not a player");
  if (g.turn !== s) throw new Error("Not your turn");

  const nb = setCell(g.board, idx, s);
  const w = getWinner(nb);
  const status = w ? "finished" : "active";
  const nextTurn = w ? g.turn : (g.turn === "X" ? "O" : "X");

  const { data, error } = await supabase
    .from("games")
    .update({ board: nb, winner: w, status, turn: nextTurn })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as GameRow;
}
