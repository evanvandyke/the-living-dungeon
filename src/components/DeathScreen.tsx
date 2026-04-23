"use client";

import { useEffect, useRef, useState } from "react";
import { GameState, EvolutionEvent } from "../game/entities/types";
import { Color } from "../engine/renderer";

interface DeathScreenProps {
  state: GameState;
  speciesStats: Map<string, { totalKills: number; totalDeaths: number; currentGeneration: number }>;
  onRestart: () => void;
}

export default function DeathScreen({ state, speciesStats, onRestart }: DeathScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fadeIn, setFadeIn] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let frame: number;

    const animate = () => {
      const elapsed = (performance.now() - start) / 1000;
      setFadeIn(Math.min(1, elapsed / 1.5));
      if (elapsed > 1) setShowStats(true);
      if (elapsed > 2) setShowEvolution(true);
      if (elapsed > 3) setShowPrompt(true);

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

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R" || e.key === "Enter") {
        onRestart();
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onRestart, fadeIn]);

  const sortedSpecies = Array.from(speciesStats.entries()).sort(
    (a, b) => b[1].totalKills - a[1].totalKills
  );

  const topKiller = sortedSpecies[0];
  const mostEvolved = Array.from(speciesStats.entries()).sort(
    (a, b) => b[1].currentGeneration - a[1].currentGeneration
  )[0];

  return (
    <div className="fixed inset-0 z-50">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
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

        <p
          className="text-red-300/60 text-lg mb-12"
          style={{ opacity: fadeIn }}
        >
          The dungeon claims another soul...
        </p>

        {showStats && (
          <div className="grid grid-cols-4 gap-8 mb-10 animate-fadeIn">
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
                <span className="text-gray-500">Species encountered:</span>{" "}
                {speciesStats.size}
              </p>
              <p className="text-gray-400">
                <span className="text-gray-500">Evolution events:</span>{" "}
                {state.evolutionLog.length}
              </p>
            </div>

            {state.evolutionLog.length > 0 && (
              <div className="mt-4 pt-3 border-t border-purple-900/20">
                <p className="text-xs text-gray-500 mb-2">Last evolution events:</p>
                {state.evolutionLog.slice(-3).map((e, i) => (
                  <p key={i} className="text-xs text-purple-300/70">
                    Turn {e.turn}: {e.description}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {showPrompt && (
          <button
            onClick={onRestart}
            className="text-sm text-gray-400 hover:text-white transition-colors animate-pulse tracking-widest cursor-pointer"
          >
            Press R or ENTER to descend again
          </button>
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
