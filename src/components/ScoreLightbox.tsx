"use client";

import { SavedScore } from "../game/scores";

interface Props {
  score: SavedScore;
  rank: number;
  onClose: () => void;
}

export default function ScoreLightbox({ score, rank, onClose }: Props) {
  const topSpecies = [...score.speciesStats].sort((a, b) => b.kills - a.kills);
  const mostEvolved = [...score.speciesStats].sort((a, b) => b.generation - a.generation);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f1a] border border-purple-900/40 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-yellow-400 text-xs font-mono uppercase tracking-wider">
              Rank #{rank}
            </p>
            <h2 className="text-2xl font-bold text-purple-400 tracking-wider">
              {score.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl cursor-pointer"
          >
            x
          </button>
        </div>

        <div className="text-4xl font-bold text-yellow-300 text-center mb-4"
          style={{ textShadow: "0 0 20px rgba(250,204,21,0.3)" }}
        >
          {score.score}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCell label="Depth" value={score.depth} color="text-purple-300" />
          <StatCell label="Kills" value={score.kills} color="text-red-300" />
          <StatCell label="Level" value={score.level} color="text-yellow-300" />
          <StatCell label="Turns" value={score.turns} color="text-blue-300" />
          <StatCell label="ATK" value={score.attack} color="text-orange-300" />
          <StatCell label="DEF" value={score.defense} color="text-orange-300" />
        </div>

        <div className="text-xs text-gray-500 mb-4 flex justify-between">
          <span>{new Date(score.date).toLocaleDateString()}</span>
          <span>{score.evolutionEvents} evolution events</span>
        </div>

        {score.speciesStats.length > 0 && (
          <div className="border-t border-purple-900/20 pt-4">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
              Species Encountered ({score.speciesEncountered})
            </h3>
            <div className="space-y-2">
              {topSpecies.map((sp) => {
                const fitness = sp.kills / Math.max(1, sp.deaths);
                let status = "stable";
                let statusColor = "text-gray-500";
                if (fitness > 2) { status = "dominant"; statusColor = "text-red-400"; }
                else if (fitness > 1) { status = "thriving"; statusColor = "text-orange-400"; }
                else if (sp.deaths > 10 && fitness < 0.1) { status = "extinct"; statusColor = "text-gray-600"; }
                else if (sp.generation > 3) { status = "evolved"; statusColor = "text-purple-400"; }

                return (
                  <div key={sp.species} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 capitalize flex-1">{sp.species}</span>
                    <span className="text-gray-500 w-16 text-right">gen {sp.generation}</span>
                    <span className="text-gray-500 w-20 text-right">{sp.kills}k / {sp.deaths}d</span>
                    <span className={`w-20 text-right text-xs ${statusColor}`}>{status}</span>
                  </div>
                );
              })}
            </div>

            {mostEvolved[0] && mostEvolved[0].generation > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-900/10 text-xs">
                <span className="text-gray-500">Most evolved: </span>
                <span className="text-purple-300 capitalize">
                  {mostEvolved[0].species} (gen {mostEvolved[0].generation})
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-600 font-mono">Seed: {score.seed}</p>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-black/30 rounded p-2 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 uppercase">{label}</div>
    </div>
  );
}
