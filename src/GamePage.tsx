import { Board } from "./ui/Board";
import { useGameStore } from "./state/useGameStore";

export function GamePage() {
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);

  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  const human = useGameStore((s) => s.human);
  const setHumanSymbol = useGameStore((s) => s.setHumanSymbol);

  const newGame = useGameStore((s) => s.newGame);
  const winner = useGameStore((s) => s.winner);
  const turn = useGameStore((s) => s.turn);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2>Крестики-нолики</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <label>
          Режим:{" "}
          <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="local">Вдвоём (локально)</option>
            <option value="bot">Против бота</option>
          </select>
        </label>

        {mode === "bot" && (
          <>
            <label>
              Сложность:{" "}
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>

            <label>
              Ты играешь за:{" "}
              <select value={human} onChange={(e) => setHumanSymbol(e.target.value as any)}>
                <option value="X">X</option>
                <option value="O">O</option>
              </select>
            </label>
          </>
        )}

        <button onClick={newGame}>Новая игра</button>
      </div>

      <Board />

      <div style={{ marginTop: 12 }}>
        {winner === null ? (
          <b>Ход: {mode === "bot" ? human : turn}</b>
        ) : winner === "draw" ? (
          <b>Ничья</b>
        ) : (
          <b>Победил: {winner}</b>
        )}
      </div>
    </div>
  );
}
