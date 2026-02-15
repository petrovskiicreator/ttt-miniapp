import { useEffect, useMemo, useState } from "react";
import { Board } from "./ui/Board";
import { useGameStore } from "./state/useGameStore";

import { getTelegramUserId } from "./lib/telegram";
import { createGame, getGame, joinGame, makeMove, mySymbol, type GameRow } from "./pvp/api";

function getGameIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("game");
}

export function GamePage() {
  // --- local/bot store ---
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);

  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  const human = useGameStore((s) => s.human);
  const setHumanSymbol = useGameStore((s) => s.setHumanSymbol);

  const newGame = useGameStore((s) => s.newGame);

  // --- PvP state ---
  const myId = useMemo(() => getTelegramUserId(), []);
  const [pvpId, setPvpId] = useState<string | null>(null);
  const [pvpGame, setPvpGame] = useState<GameRow | null>(null);
  const [pvpError, setPvpError] = useState<string | null>(null);

  const myPvpSymbol = useMemo(() => {
    if (!pvpGame) return null;
    return mySymbol(pvpGame, myId);
  }, [pvpGame, myId]);

  // 1) Если открыли по ссылке ?game=... → join
  useEffect(() => {
    const gameId = getGameIdFromUrl();
    if (!gameId) return;

    (async () => {
      try {
        setPvpError(null);
        const g = await joinGame(gameId, myId);
        setPvpId(gameId);
        setPvpGame(g);
      } catch (e: any) {
        setPvpError(String(e?.message ?? e));
      }
    })();
  }, [myId]);

  // 2) Polling раз в 1 сек
  useEffect(() => {
    if (!pvpId) return;

    const interval = setInterval(async () => {
      try {
        const g = await getGame(pvpId);
        setPvpGame(g);
      } catch {
        // игнор
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pvpId]);

  // 3) Создать PvP игру и скопировать ссылку
  async function onCreatePvp() {
    try {
      setPvpError(null);
      const g = await createGame(myId);
      const link = `${window.location.origin}/?game=${g.id}`;

      try {
        await navigator.clipboard.writeText(link);
        alert("Ссылка скопирована:\n" + link);
      } catch {
        // если clipboard не доступен
        prompt("Скопируй ссылку:", link);
      }

      // (опционально) можно сразу перейти в свой матч
      // window.location.href = link;

      setPvpId(g.id);
      setPvpGame(g);
    } catch (e: any) {
      setPvpError(String(e?.message ?? e));
    }
  }

  // 4) Ход в PvP
  async function onPvpCellClick(idx: number) {
    if (!pvpId || !pvpGame) return;
    try {
      setPvpError(null);
      const g = await makeMove(pvpId, myId, idx);
      setPvpGame(g);
    } catch (e: any) {
      // можно показывать мягко, без алерта
      setPvpError(String(e?.message ?? e));
    }
  }

  // --- Что отображаем: PvP или обычную игру ---
  const isPvp = !!pvpId;

  // для Board
  const boardForUi = isPvp && pvpGame ? pvpGame.board : useGameStore.getState().board;
  const winnerForUi = isPvp && pvpGame ? pvpGame.winner : useGameStore.getState().winner;

  const turnText = isPvp
    ? pvpGame
      ? `Ход: ${pvpGame.turn}${myPvpSymbol ? ` (ты: ${myPvpSymbol})` : ""}`
      : "Загрузка PvP..."
    : winnerForUi === null
      ? `Ход: ${mode === "bot" ? human : useGameStore.getState().turn}`
      : "";

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2>Крестики-нолики</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <button onClick={onCreatePvp}>Играть с другом (ссылка)</button>

        {isPvp ? (
          <button
            onClick={() => {
              // выйти из PvP и вернуться в обычные режимы
              setPvpId(null);
              setPvpGame(null);
              setPvpError(null);
              window.history.replaceState({}, "", window.location.origin + window.location.pathname);
              newGame();
            }}
          >
            Выйти из PvP
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Важно: Board теперь должен принимать props (см. ниже) */}
      <Board board={boardForUi} onCellClick={isPvp ? onPvpCellClick : undefined} />

      <div style={{ marginTop: 12 }}>
        {winnerForUi === null ? (
          <b>{turnText}</b>
        ) : winnerForUi === "draw" ? (
          <b>Ничья</b>
        ) : (
          <b>Победил: {winnerForUi}</b>
        )}
      </div>

      {isPvp && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          <div>PvP gameId: {pvpId}</div>
          <div>Ты: {myPvpSymbol ?? "наблюдатель"}</div>
          {pvpGame?.player_o ? <div>Игрок O подключился ✅</div> : <div>Ждём игрока O…</div>}
        </div>
      )}

      {pvpError && (
        <div style={{ marginTop: 10, color: "crimson" }}>
          Ошибка: {pvpError}
        </div>
      )}
    </div>
  );
}
