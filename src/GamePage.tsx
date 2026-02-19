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
  // --- store (локально/бот) ---
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);

  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  const human = useGameStore((s) => s.human);
  const setHumanSymbol = useGameStore((s) => s.setHumanSymbol);

  const newGame = useGameStore((s) => s.newGame);
  const winner = useGameStore((s) => s.winner);
  const turn = useGameStore((s) => s.turn);

  // --- PvP ---
  const myId = useMemo(() => getTelegramUserId(), []);
  const [pvpId, setPvpId] = useState<string | null>(null);
  const [pvpGame, setPvpGame] = useState<GameRow | null>(null);
  const [pvpError, setPvpError] = useState<string | null>(null);

  const isPvp = !!pvpId;

  const myPvpSymbol = useMemo(() => {
    if (!pvpGame) return null;
    return mySymbol(pvpGame, myId);
  }, [pvpGame, myId]);

  // если открыли по ссылке ?game=... → join
  useEffect(() => {
    const gid = getGameIdFromUrl();
    if (!gid) return;

    (async () => {
      try {
        setPvpError(null);
        const g = await joinGame(gid, myId);
        setPvpId(gid);
        setPvpGame(g);
      } catch (e: any) {
        setPvpError(String(e?.message ?? e));
      }
    })();
  }, [myId]);

  // polling (потом заменим на realtime)
  useEffect(() => {
    if (!pvpId) return;

    const interval = setInterval(async () => {
      try {
        const g = await getGame(pvpId);
        setPvpGame(g);
      } catch {
        // ignore
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pvpId]);

  async function onCreatePvp() {
    try {
      setPvpError(null);
      const g = await createGame(myId);
      const link = `${window.location.origin}/?game=${g.id}`;

      try {
        await navigator.clipboard.writeText(link);
        alert("Ссылка скопирована:\n" + link);
      } catch {
        prompt("Скопируй ссылку:", link);
      }

      setPvpId(g.id);
      setPvpGame(g);
    } catch (e: any) {
      setPvpError(String(e?.message ?? e));
    }
  }

  async function onPvpCellClick(idx: number) {
    if (!pvpId || !pvpGame) return;

    // ждём второго игрока
    if (!pvpGame.player_o) return;

    // игра закончена
    if (pvpGame.winner) return;

    const s = mySymbol(pvpGame, myId);
    if (!s) return;

    // не твой ход
    if (pvpGame.turn !== s) return;

    try {
      setPvpError(null);
      const g = await makeMove(pvpId, myId, idx);
      setPvpGame(g);
    } catch (e: any) {
      setPvpError(String(e?.message ?? e));
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2>Крестики-нолики</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <button onClick={onCreatePvp}>Играть с другом (ссылка)</button>

        {isPvp ? (
          <button
            onClick={() => {
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

      {/* Ключевой фикс:
          - в PvP передаём board и обработчик
          - иначе рендерим <Board /> как раньше (из store) */}
      {isPvp ? (
        <Board board={pvpGame?.board ?? "........."} onCellClick={onPvpCellClick} />
      ) : (
        <Board />
      )}

      <div style={{ marginTop: 12 }}>
        {isPvp ? (
          pvpGame?.winner === null ? (
            <b>
              Ход: {pvpGame.turn}
              {myPvpSymbol ? ` (ты: ${myPvpSymbol})` : ""}
              {!pvpGame.player_o ? " — ждём второго игрока…" : ""}
            </b>
          ) : pvpGame?.winner === "draw" ? (
            <b>Ничья</b>
          ) : (
            <b>Победил: {pvpGame?.winner}</b>
          )
        ) : winner === null ? (
          <b>Ход: {mode === "bot" ? human : turn}</b>
        ) : winner === "draw" ? (
          <b>Ничья</b>
        ) : (
          <b>Победил: {winner}</b>
        )}
      </div>

      {pvpError && <div style={{ marginTop: 10, color: "crimson" }}>Ошибка: {pvpError}</div>}
    </div>
  );
}
