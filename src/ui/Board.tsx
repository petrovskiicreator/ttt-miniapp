import { useGameStore } from "../state/useGameStore";

export function Board() {
  const board = useGameStore((s) => s.board);
  const clickCell = useGameStore((s) => s.clickCell);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 90px)", gap: 10 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <button
          key={i}
          onClick={() => clickCell(i)}
          style={{
            width: 90,
            height: 90,
            fontSize: 36,
            borderRadius: 12,
            border: "1px solid #333",
            cursor: "pointer",
          }}
        >
          {board[i] === "." ? "" : board[i]}
        </button>
      ))}
    </div>
  );
}
