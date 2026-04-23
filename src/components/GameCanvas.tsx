"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Renderer, Color } from "../engine/renderer";
import { GameLoop } from "../game/gameLoop";
import { TileType } from "../game/generation/dungeon";

const TILE_SIZE = 24;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameLoop | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const [messages, setMessages] = useState<{ text: string; color: string }[]>(
    []
  );
  const [stats, setStats] = useState({
    hp: 30,
    maxHp: 30,
    level: 1,
    xp: 0,
    depth: 0,
    turn: 0,
    attack: 5,
    defense: 2,
    kills: 0,
  });
  const [gameOver, setGameOver] = useState(false);
  const [evolutionEvents, setEvolutionEvents] = useState<string[]>([]);

  const updateUI = useCallback(() => {
    if (!gameRef.current) return;
    const s = gameRef.current.state;
    setStats({
      hp: s.player.stats.hp,
      maxHp: s.player.stats.maxHp,
      level: s.player.stats.level,
      xp: s.player.stats.xp,
      depth: s.depth,
      turn: s.turn,
      attack: s.player.stats.attack,
      defense: s.player.stats.defense,
      kills: s.player.killCount,
    });
    setMessages(s.messages.slice(-8));
    setGameOver(s.gameOver);
    setEvolutionEvents(
      s.evolutionLog.slice(-5).map((e) => `[T${e.turn}] ${e.description}`)
    );
  }, []);

  const processVisualEvents = useCallback(() => {
    const game = gameRef.current;
    const renderer = rendererRef.current;
    if (!game || !renderer) return;

    const events = game.drainVisualEvents();
    const px = game.state.player.pos.x;
    const py = game.state.player.pos.y;
    const camCol = px - Math.floor(renderer.cols / 2);
    const camRow = py - Math.floor(renderer.rows / 2);

    for (const event of events) {
      const screenX = (event.x - camCol) * TILE_SIZE;
      const screenY = (event.y - camRow) * TILE_SIZE;

      switch (event.type) {
        case "death":
          if (event.palette) {
            renderer.spawnDeathExplosion(
              screenX,
              screenY,
              event.palette,
              event.intensity || 1
            );
          }
          renderer.shake((event.intensity || 1) * 0.4);
          break;

        case "hit":
          renderer.spawnParticles(
            screenX + TILE_SIZE / 2,
            screenY + TILE_SIZE / 2,
            { r: 255, g: 200, b: 100 },
            5,
            1.5,
            "spark"
          );
          renderer.shake(0.2);
          break;

        case "playerHit":
          renderer.spawnParticles(
            screenX + TILE_SIZE / 2,
            screenY + TILE_SIZE / 2,
            { r: 255, g: 50, b: 50 },
            8,
            2,
            "spark"
          );
          renderer.shake(event.intensity || 0.5);
          break;

        case "levelUp":
          for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            renderer.spawnParticles(
              screenX + TILE_SIZE / 2 + Math.cos(angle) * 15,
              screenY + TILE_SIZE / 2 + Math.sin(angle) * 15,
              { r: 255, g: 255, b: 100 },
              2,
              1,
              "glow"
            );
          }
          renderer.shake(0.3);
          break;
      }
    }
  }, []);

  const render = useCallback(() => {
    const game = gameRef.current;
    const renderer = rendererRef.current;
    if (!game || !renderer) return;

    processVisualEvents();
    renderer.clear();

    const px = game.state.player.pos.x;
    const py = game.state.player.pos.y;
    const camCol = px - Math.floor(renderer.cols / 2);
    const camRow = py - Math.floor(renderer.rows / 2);
    const playerScreenCol = px - camCol;
    const playerScreenRow = py - camRow;

    for (let row = 0; row < renderer.rows; row++) {
      for (let col = 0; col < renderer.cols; col++) {
        const worldCol = col + camCol;
        const worldRow = row + camRow;

        if (
          worldRow < 0 ||
          worldRow >= game.level.height ||
          worldCol < 0 ||
          worldCol >= game.level.width
        )
          continue;

        const tile = game.level.tiles[worldRow][worldCol];
        if (tile === TileType.VOID) continue;

        const env = game.envColors;

        if (tile === TileType.WALL) {
          renderer.drawWallWithFlicker(col, row, env.wall, playerScreenCol, playerScreenRow);
        } else if (tile === TileType.FLOOR) {
          renderer.drawFloorWithLight(col, row, env.floor, playerScreenCol, playerScreenRow);
          renderer.spawnAmbientDust(col * TILE_SIZE, row * TILE_SIZE);
        } else if (tile === TileType.WATER) {
          renderer.drawAnimatedWater(col, row, { r: 20, g: 50, b: 120 });
          renderer.spawnWaterRipple(col * TILE_SIZE, row * TILE_SIZE);
        } else if (tile === TileType.LAVA) {
          renderer.drawAnimatedLava(col, row, { r: 200, g: 60, b: 10 });
          renderer.spawnLavaEmber(col * TILE_SIZE, row * TILE_SIZE);
        } else if (tile === TileType.STAIRS_DOWN) {
          renderer.drawFloorWithLight(col, row, env.floor, playerScreenCol, playerScreenRow);
          renderer.drawTile(col, row, { r: 0, g: 0, b: 0, a: 0 }, ">", { r: 255, g: 200, b: 50 });
        } else if (tile === TileType.STAIRS_UP) {
          renderer.drawFloorWithLight(col, row, env.floor, playerScreenCol, playerScreenRow);
          renderer.drawTile(col, row, { r: 0, g: 0, b: 0, a: 0 }, "<", { r: 100, g: 200, b: 255 });
        } else if (tile === TileType.DOOR) {
          renderer.drawTile(col, row, env.floor, "+", { r: 180, g: 140, b: 80 });
        }
      }
    }

    for (const item of game.state.items) {
      if (!item.pos) continue;
      const screenCol = item.pos.x - camCol;
      const screenRow = item.pos.y - camRow;
      if (
        screenCol >= 0 &&
        screenCol < renderer.cols &&
        screenRow >= 0 &&
        screenRow < renderer.rows &&
        game.visible.has(`${item.pos.x},${item.pos.y}`)
      ) {
        const itemColor: Record<string, Color> = {
          potion: { r: 255, g: 50, b: 100 },
          weapon: { r: 200, g: 200, b: 220 },
          armor: { r: 100, g: 150, b: 255 },
          scroll: { r: 255, g: 255, b: 150 },
        };
        const bobY = Math.sin(renderer.time * 2 + screenCol + screenRow) * 2;
        const glowAlpha = 0.15 + Math.sin(renderer.time * 3 + screenCol * 2) * 0.1;

        const ix = screenCol * TILE_SIZE + TILE_SIZE / 2;
        const iy = screenRow * TILE_SIZE + TILE_SIZE / 2 + bobY;
        const c = itemColor[item.type] || { r: 255, g: 255, b: 255 };
        const gradient = renderer["ctx"].createRadialGradient(ix, iy, 0, ix, iy, TILE_SIZE * 0.6);
        gradient.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${glowAlpha})`);
        gradient.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
        renderer["ctx"].fillStyle = gradient;
        renderer["ctx"].fillRect(
          screenCol * TILE_SIZE,
          screenRow * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );

        renderer.drawTile(
          screenCol,
          screenRow,
          { r: 0, g: 0, b: 0, a: 0 },
          item.glyph,
          c
        );
      }
    }

    for (const monster of game.state.monsters) {
      if (!monster.alive) continue;
      const screenCol = monster.pos.x - camCol;
      const screenRow = monster.pos.y - camRow;
      if (
        screenCol >= 0 &&
        screenCol < renderer.cols &&
        screenRow >= 0 &&
        screenRow < renderer.rows &&
        game.visible.has(`${monster.pos.x},${monster.pos.y}`)
      ) {
        const pulse = monster.behavior === "chase" ? 1 : 0;
        renderer.drawCreature(
          screenCol,
          screenRow,
          monster.sprite,
          monster.genome.palette,
          pulse
        );
        if (monster.stats.hp < monster.stats.maxHp) {
          renderer.drawHealthBar(
            screenCol,
            screenRow,
            monster.stats.hp,
            monster.stats.maxHp
          );
        }
      }
    }

    renderer.drawPlayerGlow(playerScreenCol, playerScreenRow);
    renderer.drawTile(
      playerScreenCol,
      playerScreenRow,
      { r: 0, g: 0, b: 0, a: 0 },
      "@",
      { r: 255, g: 255, b: 100 }
    );

    renderer.drawFogOfWar(game.visible, game.state.player.explored, camCol, camRow);
    renderer.updateParticles(0.016);
    renderer.endFrame();
  }, [processVisualEvents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = Math.floor(window.innerWidth * 0.65);
    const h = Math.floor(window.innerHeight * 0.85);
    canvas.width = w;
    canvas.height = h;

    rendererRef.current = new Renderer(canvas, TILE_SIZE);
    gameRef.current = new GameLoop();
    updateUI();

    const loop = () => {
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render, updateUI]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const game = gameRef.current;
      if (!game) return;

      if (game.state.gameOver) {
        if (e.key === "r" || e.key === "R") {
          game.restart();
          updateUI();
        }
        return;
      }

      let moved = false;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "k":
          moved = game.movePlayer(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "j":
          moved = game.movePlayer(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "h":
          moved = game.movePlayer(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "l":
          moved = game.movePlayer(1, 0);
          break;
        case ">":
        case ".":
          game.descend();
          moved = true;
          break;
        case "<":
        case ",":
          game.ascend();
          moved = true;
          break;
        case " ":
          game.movePlayer(0, 0);
          moved = true;
          break;
      }

      if (moved) {
        updateUI();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [updateUI]);

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-gray-200 overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          className="border border-gray-800 rounded"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      <div className="w-80 flex flex-col gap-3 p-4 bg-[#0f0f18] border-l border-gray-800 overflow-y-auto">
        <div className="text-center">
          <h1 className="text-xl font-bold text-purple-400 tracking-wider">
            THE LIVING DUNGEON
          </h1>
          <p className="text-xs text-gray-500">
            A self-evolving roguelike
          </p>
        </div>

        <div className="bg-[#141422] rounded p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">HP</span>
            <span
              className={
                stats.hp < stats.maxHp * 0.3
                  ? "text-red-400"
                  : "text-green-400"
              }
            >
              {stats.hp}/{stats.maxHp}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(stats.hp / stats.maxHp) * 100}%`,
                backgroundColor:
                  stats.hp < stats.maxHp * 0.3 ? "#ef4444" : "#22c55e",
              }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Level</span>
            <span className="text-yellow-300">{stats.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">XP</span>
            <span className="text-blue-300">
              {stats.xp}/{stats.level * 20}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ATK / DEF</span>
            <span className="text-orange-300">
              {stats.attack} / {stats.defense}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Depth</span>
            <span className="text-purple-300">{stats.depth}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Turn</span>
            <span className="text-gray-400">{stats.turn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Kills</span>
            <span className="text-red-300">{stats.kills}</span>
          </div>
        </div>

        <div className="bg-[#141422] rounded p-3 flex-1 min-h-0">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
            Messages
          </h3>
          <div className="space-y-1 text-xs">
            {messages.map((msg, i) => (
              <p key={i} style={{ color: msg.color }}>
                {msg.text}
              </p>
            ))}
          </div>
        </div>

        {evolutionEvents.length > 0 && (
          <div className="bg-[#1a1428] rounded p-3 border border-purple-900/30">
            <h3 className="text-xs font-bold text-purple-400 uppercase mb-2">
              Evolution Log
            </h3>
            <div className="space-y-1 text-xs text-purple-300">
              {evolutionEvents.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-600 space-y-1">
          <p>
            <kbd className="bg-gray-800 px-1 rounded">WASD</kbd> /
            <kbd className="bg-gray-800 px-1 rounded">arrows</kbd> move
          </p>
          <p>
            <kbd className="bg-gray-800 px-1 rounded">&gt;</kbd> descend
            <kbd className="bg-gray-800 px-1 rounded ml-2">&lt;</kbd> ascend
          </p>
          <p>
            <kbd className="bg-gray-800 px-1 rounded">space</kbd> wait
          </p>
          {gameOver && (
            <p className="text-red-400">
              <kbd className="bg-gray-800 px-1 rounded">R</kbd> restart
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
