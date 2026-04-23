"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GameState } from "../game/entities/types";

interface DeathScreenProps {
  state: GameState;
  score: number;
  seed: number;
  speciesStats: Map<string, { totalKills: number; totalDeaths: number; currentGeneration: number }>;
  onRestart: () => void;
}

interface SavedScore {
  name: string;
  score: number;
  depth: number;
  kills: number;
  level: number;
  turns: number;
  seed: number;
  date: string;
}

export default function DeathScreen({ state, score, seed, speciesStats, onRestart }: DeathScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fadeIn, setFadeIn] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [saved, setSaved] = useState(false);
  const [highScores, setHighScores] = useState<SavedScore[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then(setHighScores)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const start = performance.now();
    let frame: number;

    const animate = () => {
      const elapsed = (performance.now() - start) / 1000;
      setFadeIn(Math.min(1, elapsed / 1.5));
      if (elapsed > 1) setShowStats(true);
      if (elapsed > 2) setShowEvolution(true);
      if (elapsed > 3) setShowNameEntry(true);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d")!;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        ctx.fillStyle = `rgba(10,5,15,${Math.min(0.85, fadeIn * 0.85)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const time = elapsed;
        for (let i = 0; i < 50; i++) {
          const x = (Math.sin(i * 1.7 + time * 0.3) * 0.5 + 0.5) * canvas.width;
          const y = (Math.cos(i * 2.3 + time * 0.2) * 0.5 + 0.5) * canvas.height;
          ctx.globalAlpha = 0.05 + Math.sin(time + i) * 0.03;
          ctx.fillStyle = `rgb(${100 + i * 3},20,20)`;
          ctx.fillRect(x, y, 2, 2);
        }
        ctx.globalAlpha = 1;
      }

      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [fadeIn]);

  useEffect(() => {
    if (showNameEntry && inputRef.current && !saved) {
      inputRef.current.focus();
    }
  }, [showNameEntry, saved]);

  const saveScore = useCallback(async () => {
    if (!playerName.trim() || saved) return;

    const entry: SavedScore = {
      name: playerName.trim().slice(0, 12),
      score,
      depth: state.depth,
      kills: state.player.killCount,
      level: state.player.stats.level,
      turns: state.turn,
      seed,
      date: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      setHighScores(data.scores);
      setPlayerRank(data.rank);
    } catch {
      setHighScores((prev) => [...prev, entry].sort((a, b) => b.score - a.score));
      setPlayerRank(null);
    }

    setSaved(true);
    setShowRestart(true);
  }, [playerName, saved, score, seed, state]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!showRestart) return;
      if (e.key === "Enter" || e.key === " ") {
        onRestart();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showRestart, onRestart]);

  const sortedSpecies = Array.from(speciesStats.entries()).sort(
    (a, b) => b[1].totalKills - a[1].totalKills
  );

  const topKiller = sortedSpecies[0];
  const mostEvolved = Array.from(speciesStats.entries()).sort(
    (a, b) => b[1].currentGeneration - a[1].currentGeneration
  )[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <canvas ref={canvasRef} className="fixed inset-0" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-full text-center py-8">
        <h1
          className="text-5xl font-bold text-red-500 mb-2 tracking-[0.2em]"
          style={{
            opacity: fadeIn,
            textShadow: "0 0 30px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.2)",
            fontFamily: "monospace",
          }}
        >
          YOU HAVE FALLEN
        </h1>

        <p className="text-red-300/60 text-lg mb-8" style={{ opacity: fadeIn }}>
          The dungeon claims another soul...
        </p>

        {showStats && (
          <div className="grid grid-cols-5 gap-6 mb-8 animate-fadeIn">
            <StatBox label="Score" value={score} color="text-yellow-300" />
            <StatBox label="Depth" value={state.depth} color="text-purple-400" />
            <StatBox label="Turns" value={state.turn} color="text-blue-400" />
            <StatBox label="Kills" value={state.player.killCount} color="text-red-400" />
            <StatBox label="Level" value={state.player.stats.level} color="text-yellow-400" />
          </div>
        )}

        {showEvolution && sortedSpecies.length > 0 && (
          <div className="bg-black/40 rounded-lg border border-purple-900/30 p-6 mb-8 max-w-lg animate-fadeIn">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4">
              Evolution Report
            </h3>
            <div className="space-y-2 text-sm text-left">
              {topKiller && (
                <p className="text-red-300">
                  <span className="text-gray-500">Most Deadly:</span>{" "}
                  {topKiller[0]} ({topKiller[1].totalKills} kills, gen {topKiller[1].currentGeneration})
                </p>
              )}
              {mostEvolved && (
                <p className="text-purple-300">
                  <span className="text-gray-500">Most Evolved:</span>{" "}
                  {mostEvolved[0]} (generation {mostEvolved[1].currentGeneration})
                </p>
              )}
              <p className="text-gray-400">
                <span className="text-gray-500">Evolution events:</span>{" "}
                {state.evolutionLog.length}
              </p>
            </div>
          </div>
        )}

        {showNameEntry && !saved && (
          <div className="bg-black/60 rounded-lg border border-yellow-900/40 p-6 mb-6 animate-fadeIn">
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-4">
              Enter Your Name
            </h3>
            <div className="flex gap-3 items-center justify-center">
              <input
                ref={inputRef}
                type="text"
                maxLength={12}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && playerName.trim()) {
                    saveScore();
                  }
                  e.stopPropagation();
                }}
                placeholder="AAA"
                className="bg-black/80 border border-yellow-700/50 text-yellow-300 text-center text-xl font-mono tracking-[0.3em] px-4 py-2 rounded w-48 focus:outline-none focus:border-yellow-400"
              />
              <button
                onClick={saveScore}
                disabled={!playerName.trim()}
                className="bg-yellow-700/30 border border-yellow-600/50 text-yellow-300 px-4 py-2 rounded font-mono tracking-wider hover:bg-yellow-600/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                SAVE
              </button>
            </div>
          </div>
        )}

        {saved && highScores.length > 0 && (
          <div className="bg-black/60 rounded-lg border border-purple-900/30 p-6 mb-6 max-w-md animate-fadeIn">
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-4">
              High Scores
            </h3>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-gray-500 mb-2">
                <span className="w-8">#</span>
                <span className="flex-1 text-left">NAME</span>
                <span className="w-16 text-right">SCORE</span>
                <span className="w-12 text-right">DEPTH</span>
                <span className="w-12 text-right">KILLS</span>
              </div>
              {highScores.slice(0, 10).map((s, i) => {
                const isCurrentRun = playerRank !== null && i === playerRank - 1;
                return (
                  <div
                    key={i}
                    className={`flex justify-between ${isCurrentRun ? "text-yellow-300" : "text-gray-400"}`}
                  >
                    <span className="w-8">{i + 1}.</span>
                    <span className="flex-1 text-left">{s.name}</span>
                    <span className="w-16 text-right">{s.score}</span>
                    <span className="w-12 text-right">{s.depth}</span>
                    <span className="w-12 text-right">{s.kills}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showRestart && (
          <p className="text-sm text-gray-400 animate-pulse tracking-widest mt-4">
            Press ENTER or SPACE to descend again
          </p>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
