"use client";

import { useEffect, useRef } from "react";
import { Color } from "../engine/renderer";

interface SpeciesData {
  species: string;
  totalKills: number;
  totalDeaths: number;
  currentGeneration: number;
}

interface Props {
  speciesStats: Map<string, SpeciesData>;
  onClose: () => void;
  turn: number;
  depth: number;
}

const SPECIES_COLORS: Record<string, Color> = {
  slime: { r: 80, g: 200, b: 80 },
  demon: { r: 200, g: 40, b: 40 },
  wraith: { r: 100, g: 80, b: 200 },
  golem: { r: 140, g: 120, b: 100 },
  insect: { r: 180, g: 150, b: 20 },
  fungal: { r: 160, g: 100, b: 160 },
};

export default function EvolutionPanel({ speciesStats, onClose, turn, depth }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "Escape") {
        onClose();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const w = 600;
    const h = 400;
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = "rgba(10,10,20,0.95)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(100,80,160,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    ctx.fillStyle = "#a855f7";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("EVOLUTION TREE", w / 2, 28);

    ctx.fillStyle = "#666";
    ctx.font = "11px monospace";
    ctx.fillText(`Turn ${turn} | Depth ${depth}`, w / 2, 46);

    const sorted = Array.from(speciesStats.entries())
      .filter(([, d]) => d.totalKills + d.totalDeaths > 0)
      .sort((a, b) => b[1].currentGeneration - a[1].currentGeneration);

    if (sorted.length === 0) {
      ctx.fillStyle = "#555";
      ctx.font = "13px monospace";
      ctx.fillText("No species data yet. Explore deeper...", w / 2, h / 2);
      return;
    }

    const barAreaY = 70;
    const barAreaH = 180;
    const barWidth = Math.min(70, (w - 80) / Math.max(sorted.length, 1));
    const startX = (w - sorted.length * barWidth) / 2;

    const maxGen = Math.max(1, ...sorted.map(([, d]) => d.currentGeneration));

    for (let i = 0; i < sorted.length; i++) {
      const [species, data] = sorted[i];
      const c = SPECIES_COLORS[species.replace("alpha ", "")] || { r: 150, g: 150, b: 150 };
      const x = startX + i * barWidth;
      const barH = (data.currentGeneration / maxGen) * barAreaH;

      const gradient = ctx.createLinearGradient(x, barAreaY + barAreaH - barH, x, barAreaY + barAreaH);
      gradient.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.9)`);
      gradient.addColorStop(1, `rgba(${c.r * 0.5},${c.g * 0.5},${c.b * 0.5},0.7)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 4, barAreaY + barAreaH - barH, barWidth - 8, barH);

      ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},0.3)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4, barAreaY + barAreaH - barH, barWidth - 8, barH);

      ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`G${data.currentGeneration}`, x + barWidth / 2, barAreaY + barAreaH - barH - 6);

      ctx.save();
      ctx.translate(x + barWidth / 2, barAreaY + barAreaH + 14);
      ctx.fillStyle = "#aaa";
      ctx.font = "10px monospace";
      ctx.fillText(species, 0, 0);
      ctx.restore();
    }

    const statsY = barAreaY + barAreaH + 40;
    ctx.fillStyle = "#555";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("SPECIES", 30, statsY);
    ctx.fillText("GEN", 160, statsY);
    ctx.fillText("KILLS", 220, statsY);
    ctx.fillText("DEATHS", 300, statsY);
    ctx.fillText("FITNESS", 390, statsY);
    ctx.fillText("STATUS", 480, statsY);

    ctx.strokeStyle = "rgba(100,80,160,0.2)";
    ctx.beginPath();
    ctx.moveTo(20, statsY + 6);
    ctx.lineTo(w - 20, statsY + 6);
    ctx.stroke();

    for (let i = 0; i < sorted.length; i++) {
      const [species, data] = sorted[i];
      const c = SPECIES_COLORS[species.replace("alpha ", "")] || { r: 150, g: 150, b: 150 };
      const y = statsY + 20 + i * 18;
      const fitness = data.totalKills / Math.max(1, data.totalDeaths);

      ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
      ctx.fillText(species, 30, y);

      ctx.fillStyle = "#ccc";
      ctx.fillText(`${data.currentGeneration}`, 160, y);
      ctx.fillText(`${data.totalKills}`, 220, y);
      ctx.fillText(`${data.totalDeaths}`, 300, y);
      ctx.fillText(fitness.toFixed(2), 390, y);

      let status = "stable";
      let statusColor = "#888";
      if (fitness > 2) { status = "dominant"; statusColor = "#ff4444"; }
      else if (fitness > 1) { status = "thriving"; statusColor = "#ffaa44"; }
      else if (fitness < 0.1 && data.totalDeaths > 10) { status = "endangered"; statusColor = "#ff6666"; }
      else if (data.currentGeneration > 3) { status = "evolving"; statusColor = "#aa88ff"; }

      ctx.fillStyle = statusColor;
      ctx.fillText(status, 480, y);
    }
  }, [speciesStats, turn, depth]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <canvas ref={canvasRef} className="rounded border border-purple-900/30" />
        <p className="text-center text-xs text-gray-500 mt-2">
          Press <kbd className="bg-gray-800 px-1 rounded">E</kbd> or <kbd className="bg-gray-800 px-1 rounded">ESC</kbd> to close
        </p>
      </div>
    </div>
  );
}
