"use client";

import { useEffect, useRef, useState } from "react";
import { generateGenome, genomeToSprite } from "../art/generator";
import { Color } from "../engine/renderer";

const SPECIES = ["slime", "demon", "wraith", "golem", "insect", "fungal"];

interface AssemblingCreature {
  sprite: number[][];
  palette: Color[];
  pixels: { x: number; y: number; colorIdx: number; delay: number }[];
  x: number;
  y: number;
  scale: number;
}

export default function TitleScreen({ onStart }: { onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;

    const creatures: AssemblingCreature[] = [];
    const bgParticles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: Color;
      life: number;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const species = SPECIES[i % SPECIES.length];
      const seed = Date.now() + i * 777;
      const genome = generateGenome(species, seed, Math.floor(Math.random() * 5));
      const sprite = genomeToSprite(genome);

      const pixels: AssemblingCreature["pixels"] = [];
      for (let y = 0; y < sprite.length; y++) {
        for (let x = 0; x < sprite[y].length; x++) {
          if (sprite[y][x] !== 0) {
            pixels.push({
              x,
              y,
              colorIdx: sprite[y][x],
              delay: Math.random() * 3 + i * 0.8,
            });
          }
        }
      }
      pixels.sort((a, b) => a.delay - b.delay);

      const scale = 6 + Math.random() * 4;
      creatures.push({
        sprite,
        palette: genome.palette,
        pixels,
        x: canvas.width * (0.1 + Math.random() * 0.8),
        y: canvas.height * (0.15 + Math.random() * 0.6),
        scale,
      });
    }

    let time = 0;
    const startTime = performance.now();

    const loop = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      time += 0.016;

      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.3) {
        bgParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.2 - Math.random() * 0.3,
          size: 1 + Math.random(),
          color: {
            r: 80 + Math.floor(Math.random() * 40),
            g: 60 + Math.floor(Math.random() * 30),
            b: 120 + Math.floor(Math.random() * 60),
          },
          life: 1,
        });
      }

      for (let i = bgParticles.length - 1; i >= 0; i--) {
        const p = bgParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.003;
        if (p.life <= 0) {
          bgParticles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life * 0.2;
        ctx.fillStyle = `rgb(${p.color.r},${p.color.g},${p.color.b})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      for (const creature of creatures) {
        const floatY = Math.sin(time * 0.8 + creature.x * 0.01) * 5;

        for (const pixel of creature.pixels) {
          if (elapsed < pixel.delay) continue;

          const assembleProgress = Math.min(1, (elapsed - pixel.delay) * 2);
          const c = creature.palette[pixel.colorIdx] || creature.palette[1];

          const startX = creature.x + (Math.random() - 0.5) * 200;
          const startY = creature.y + (Math.random() - 0.5) * 200;
          const targetX =
            creature.x + pixel.x * creature.scale - (creature.sprite[0].length * creature.scale) / 2;
          const targetY =
            creature.y + pixel.y * creature.scale - (creature.sprite.length * creature.scale) / 2 + floatY;

          const eased = 1 - Math.pow(1 - assembleProgress, 3);
          const px = startX + (targetX - startX) * eased;
          const py = startY + (targetY - startY) * eased;

          const glow = assembleProgress < 1 ? 1.5 : 1;
          ctx.fillStyle = `rgba(${Math.min(255, c.r * glow)},${Math.min(255, c.g * glow)},${Math.min(255, c.b * glow)},${assembleProgress * 0.9})`;
          ctx.fillRect(px, py, creature.scale, creature.scale);

          if (assembleProgress < 1 && assembleProgress > 0.1) {
            ctx.globalAlpha = (1 - assembleProgress) * 0.5;
            ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
            ctx.fillRect(px - 1, py - 1, creature.scale + 2, creature.scale + 2);
            ctx.globalAlpha = 1;
          }
        }
      }

      if (elapsed > 1.5) {
        setTitleOpacity(Math.min(1, (elapsed - 1.5) / 2));
      }
      if (elapsed > 3) {
        setSubtitleOpacity(Math.min(1, (elapsed - 3) / 1.5));
      }
      if (elapsed > 4.5) {
        setShowPrompt(true);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        onStart();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onStart]);

  return (
    <div
      className="relative w-full h-screen bg-[#0a0a0f] cursor-pointer"
      onClick={onStart}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <h1
          className="text-6xl font-bold tracking-[0.3em] text-purple-400 mb-4"
          style={{
            opacity: titleOpacity,
            textShadow:
              "0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.2)",
            fontFamily: "monospace",
          }}
        >
          THE LIVING DUNGEON
        </h1>

        <p
          className="text-lg text-purple-300/60 tracking-[0.5em] uppercase mb-16"
          style={{ opacity: subtitleOpacity }}
        >
          A Self-Evolving Roguelike
        </p>

        {showPrompt && (
          <p className="text-sm text-gray-400 animate-pulse tracking-widest">
            Press ENTER or click to begin
          </p>
        )}
      </div>
    </div>
  );
}
