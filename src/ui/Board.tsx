import { useGameStore } from "../state/useGameStore";
import type { Board as BoardType } from "../engine/ttt";

export function Board(props: { board?: BoardType; onCellClick?: (idx: number) => void }) {
  const storeBoard = useGameStore((s) => s.board);
  const clickCell = useGameStore((s) => s.clickCell);

  const board = props.board ?? storeBoard;
  const onCellClick = props.onCellClick ?? clickCell;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 90px)", gap: 10 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <button
          key={i}
          onClick={() => onCellClick(i)}
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
