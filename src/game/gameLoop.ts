import { TileType, DungeonLevel, generateDungeon, computeFOV } from "./generation/dungeon";
import { GameState, Player, Monster, Item, GameMessage, VisualEvent } from "./entities/types";
import { EvolutionEngine } from "./evolution/engine";
import { generateEnvironmentColors } from "../art/generator";
import { Color } from "../engine/renderer";

const SPECIES = ["slime", "demon", "wraith", "golem", "insect", "fungal"];

export class GameLoop {
  state: GameState;
  level: DungeonLevel;
  evolution: EvolutionEngine;
  visible: Set<string> = new Set();
  envColors: { floor: Color; wall: Color; accent: Color };
  readonly seed: number;

  constructor(seed = Date.now()) {
    this.seed = seed;
    this.evolution = new EvolutionEngine(seed);
    this.level = generateDungeon(60, 40, 0, seed);
    this.envColors = generateEnvironmentColors(0, seed);

    const startRoom = this.level.rooms[0];
    const startX = Math.floor(startRoom.x + startRoom.width / 2);
    const startY = Math.floor(startRoom.y + startRoom.height / 2);

    this.state = {
      player: {
        pos: { x: startX, y: startY },
        stats: {
          hp: 30,
          maxHp: 30,
          attack: 5,
          defense: 2,
          speed: 10,
          xp: 0,
          level: 1,
        },
        inventory: [],
        explored: new Set(),
        killCount: 0,
        deepestLevel: 0,
      },
      monsters: [],
      items: [],
      messages: [{ text: "You descend into The Living Dungeon...", color: "#a0a0ff", turn: 0 }],
      turn: 0,
      depth: 0,
      gameOver: false,
      evolutionLog: [],
      visualEvents: [],
    };

    this.spawnMonstersForLevel();
    this.spawnItemsForLevel();
    this.updateFOV();
  }

  private addMessage(text: string, color = "#ccc") {
    this.state.messages.push({ text, color, turn: this.state.turn });
    if (this.state.messages.length > 50) {
      this.state.messages = this.state.messages.slice(-30);
    }
  }

  private spawnMonstersForLevel() {
    const count = 3 + this.state.depth * 2 + Math.floor(Math.random() * 3);
    const availableSpecies = SPECIES.slice(
      0,
      Math.min(SPECIES.length, 2 + this.state.depth)
    );

    for (let i = 0; i < count; i++) {
      const room =
        this.level.rooms[1 + Math.floor(Math.random() * (this.level.rooms.length - 1))];
      if (!room) continue;

      const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
      const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

      if (this.level.tiles[y][x] !== TileType.FLOOR) continue;

      const species =
        availableSpecies[Math.floor(Math.random() * availableSpecies.length)];
      this.state.monsters.push(
        this.evolution.spawnMonster(species, x, y, this.state.depth)
      );
    }

    if (this.state.depth > 0 && this.state.depth % 3 === 0) {
      const bossRoom = this.level.rooms[this.level.rooms.length - 1];
      const bx = Math.floor(bossRoom.x + bossRoom.width / 2);
      const by = Math.floor(bossRoom.y + bossRoom.height / 2) + 1;
      if (this.level.tiles[by]?.[bx] === TileType.FLOOR) {
        const dominant = this.evolution.getMostDangerousSpecies();
        const bossSpecies = dominant || availableSpecies[Math.floor(Math.random() * availableSpecies.length)];
        const boss = this.evolution.spawnBoss(bossSpecies, bx, by, this.state.depth);
        this.state.monsters.push(boss);
        this.addMessage(`A powerful alpha ${bossSpecies} lurks on this level!`, "#ff44ff");
      }
    }
  }

  private spawnItemsForLevel() {
    const count = 2 + Math.floor(Math.random() * 3);
    const itemTypes: Item[] = [];

    for (let i = 0; i < count; i++) {
      const room =
        this.level.rooms[Math.floor(Math.random() * this.level.rooms.length)];
      const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
      const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

      if (this.level.tiles[y][x] !== TileType.FLOOR) continue;

      const roll = Math.random();
      if (roll < 0.5) {
        itemTypes.push({
          id: `item_${Date.now()}_${i}`,
          name: "Health Potion",
          type: "potion",
          pos: { x, y },
          power: 10 + this.state.depth * 3,
          glyph: "!",
        });
      } else if (roll < 0.75) {
        itemTypes.push({
          id: `item_${Date.now()}_${i}`,
          name: `Sword +${1 + this.state.depth}`,
          type: "weapon",
          pos: { x, y },
          power: 2 + this.state.depth,
          glyph: "/",
        });
      } else {
        itemTypes.push({
          id: `item_${Date.now()}_${i}`,
          name: `Shield +${1 + this.state.depth}`,
          type: "armor",
          pos: { x, y },
          power: 1 + this.state.depth,
          glyph: "]",
        });
      }
    }

    this.state.items.push(...itemTypes);
  }

  updateFOV() {
    this.visible = computeFOV(
      this.level.tiles,
      this.state.player.pos.x,
      this.state.player.pos.y,
      8
    );
    for (const key of this.visible) {
      this.state.player.explored.add(key);
    }
  }

  movePlayer(dx: number, dy: number): boolean {
    if (this.state.gameOver) return false;

    const nx = this.state.player.pos.x + dx;
    const ny = this.state.player.pos.y + dy;

    if (
      ny < 0 ||
      ny >= this.level.height ||
      nx < 0 ||
      nx >= this.level.width
    )
      return false;

    const tile = this.level.tiles[ny][nx];

    if (tile === TileType.WALL || tile === TileType.VOID) return false;

    const monster = this.state.monsters.find(
      (m) => m.alive && m.pos.x === nx && m.pos.y === ny
    );

    if (monster) {
      this.combat(this.state.player.stats, monster);
    } else {
      this.state.player.pos.x = nx;
      this.state.player.pos.y = ny;

      if (tile === TileType.STAIRS_DOWN) {
        this.addMessage("You see stairs leading down. Press > to descend.", "#ffcc00");
      } else if (tile === TileType.STAIRS_UP && this.state.depth > 0) {
        this.addMessage("You see stairs leading up. Press < to ascend.", "#ffcc00");
      } else if (tile === TileType.LAVA) {
        const damage = 3 + this.state.depth;
        this.state.player.stats.hp -= damage;
        this.addMessage(`The lava burns! (-${damage} HP)`, "#ff4400");
      } else if (tile === TileType.WATER) {
        this.addMessage("You wade through water.", "#4488ff");
      }

      const item = this.state.items.find(
        (it) => it.pos && it.pos.x === nx && it.pos.y === ny
      );
      if (item) {
        this.pickupItem(item);
      }
    }

    this.state.turn++;
    this.moveMonsters();
    this.updateFOV();
    this.checkEvolution();
    this.checkPlayerDeath();

    return true;
  }

  private emitVisual(event: VisualEvent) {
    this.state.visualEvents.push(event);
  }

  drainVisualEvents(): VisualEvent[] {
    const events = this.state.visualEvents;
    this.state.visualEvents = [];
    return events;
  }

  private combat(attackerStats: { attack: number }, target: Monster) {
    const damage = Math.max(
      1,
      attackerStats.attack -
        target.stats.defense +
        Math.floor(Math.random() * 3)
    );
    target.stats.hp -= damage;

    if (target.stats.hp <= 0) {
      target.alive = false;
      this.state.player.stats.xp += target.stats.xp;
      this.state.player.killCount++;
      this.evolution.recordKill(target.species);
      this.addMessage(
        `You slay the ${target.species}! (+${target.stats.xp} XP)`,
        "#44ff44"
      );
      this.emitVisual({
        type: "death",
        x: target.pos.x,
        y: target.pos.y,
        palette: target.genome.palette.filter((c) => (c.a ?? 1) > 0),
        intensity: 1 + target.stats.level * 0.3,
      });
      this.checkLevelUp();
    } else {
      this.addMessage(
        `You hit the ${target.species} for ${damage} damage.`,
        "#ffaa44"
      );
      this.emitVisual({
        type: "hit",
        x: target.pos.x,
        y: target.pos.y,
        intensity: 0.5,
      });
    }
  }

  private moveMonsters() {
    for (const monster of this.state.monsters) {
      if (!monster.alive) continue;

      if (monster.abilityCooldown > 0) monster.abilityCooldown--;

      const px = this.state.player.pos.x;
      const py = this.state.player.pos.y;
      const dist = Math.abs(monster.pos.x - px) + Math.abs(monster.pos.y - py);

      if (this.tryUseAbility(monster, dist)) continue;

      let dx = 0;
      let dy = 0;

      if (monster.behavior === "chase" && dist < 10) {
        dx = Math.sign(px - monster.pos.x);
        dy = Math.sign(py - monster.pos.y);
      } else if (monster.behavior === "flee" && dist < 5) {
        dx = -Math.sign(px - monster.pos.x);
        dy = -Math.sign(py - monster.pos.y);
      } else if (monster.behavior === "ambush" && dist < 3) {
        dx = Math.sign(px - monster.pos.x);
        dy = Math.sign(py - monster.pos.y);
      } else {
        const dirs = [
          [0, 0],
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        dx = dir[0];
        dy = dir[1];
      }

      if (Math.random() > 0.5) dy = 0;
      else dx = 0;

      const nx = monster.pos.x + dx;
      const ny = monster.pos.y + dy;

      if (nx === px && ny === py) {
        this.monsterAttacksPlayer(monster);
      } else if (
        ny >= 0 &&
        ny < this.level.height &&
        nx >= 0 &&
        nx < this.level.width &&
        this.level.tiles[ny][nx] === TileType.FLOOR &&
        !this.state.monsters.some(
          (m) => m.alive && m.pos.x === nx && m.pos.y === ny
        )
      ) {
        monster.pos.x = nx;
        monster.pos.y = ny;
      }
    }
  }

  private monsterAttacksPlayer(monster: Monster) {
    const damage = Math.max(
      1,
      monster.stats.attack -
        this.state.player.stats.defense +
        Math.floor(Math.random() * 2)
    );
    this.state.player.stats.hp -= damage;
    this.evolution.recordMonsterKill(monster.species);
    monster.killCount++;
    this.addMessage(
      `The ${monster.species} hits you for ${damage} damage!`,
      "#ff4444"
    );
    this.emitVisual({
      type: "playerHit",
      x: this.state.player.pos.x,
      y: this.state.player.pos.y,
      intensity: damage * 0.15,
    });
  }

  private tryUseAbility(monster: Monster, dist: number): boolean {
    if (!monster.ability || monster.abilityCooldown > 0) return false;

    const px = this.state.player.pos.x;
    const py = this.state.player.pos.y;

    switch (monster.ability) {
      case "ranged": {
        if (dist > 2 && dist <= 6) {
          const damage = Math.max(1, Math.floor(monster.stats.attack * 0.7) - this.state.player.stats.defense);
          this.state.player.stats.hp -= damage;
          monster.abilityCooldown = 3;
          this.addMessage(`The ${monster.species} hurls fire at you! (-${damage} HP)`, "#ff6622");
          this.emitVisual({
            type: "projectile",
            x: monster.pos.x,
            y: monster.pos.y,
            targetX: px,
            targetY: py,
            palette: [{ r: 255, g: 100, b: 20 }],
            intensity: 1,
          });
          this.emitVisual({
            type: "playerHit",
            x: px,
            y: py,
            intensity: damage * 0.1,
          });
          return true;
        }
        break;
      }
      case "teleport": {
        if (dist > 3 && dist <= 8) {
          this.emitVisual({ type: "teleport", x: monster.pos.x, y: monster.pos.y, intensity: 1 });
          const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
          for (const [ddx, ddy] of dirs) {
            const tx = px + ddx;
            const ty = py + ddy;
            if (
              ty >= 0 && ty < this.level.height &&
              tx >= 0 && tx < this.level.width &&
              this.level.tiles[ty][tx] === TileType.FLOOR &&
              !this.state.monsters.some((m) => m.alive && m.pos.x === tx && m.pos.y === ty)
            ) {
              monster.pos.x = tx;
              monster.pos.y = ty;
              monster.abilityCooldown = 4;
              this.addMessage(`The ${monster.species} teleports behind you!`, "#aa66ff");
              this.emitVisual({ type: "teleport", x: tx, y: ty, intensity: 0.8 });
              return true;
            }
          }
        }
        break;
      }
      case "summon": {
        if (dist <= 5 && Math.random() < 0.15) {
          const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
          for (const [ddx, ddy] of dirs) {
            const sx = monster.pos.x + ddx;
            const sy = monster.pos.y + ddy;
            if (
              sy >= 0 && sy < this.level.height &&
              sx >= 0 && sx < this.level.width &&
              this.level.tiles[sy][sx] === TileType.FLOOR &&
              !this.state.monsters.some((m) => m.alive && m.pos.x === sx && m.pos.y === sy) &&
              !(sx === px && sy === py)
            ) {
              const minion = this.evolution.spawnMonster("slime", sx, sy, this.state.depth);
              minion.stats.hp = Math.floor(minion.stats.hp * 0.5);
              minion.stats.maxHp = minion.stats.hp;
              this.state.monsters.push(minion);
              monster.abilityCooldown = 6;
              this.addMessage(`The ${monster.species} spawns a slime!`, "#88ff88");
              this.emitVisual({ type: "summon", x: sx, y: sy, intensity: 1 });
              return true;
            }
          }
        }
        break;
      }
      case "poison": {
        if (dist <= 1) {
          const poisonDmg = 2 + Math.floor(this.state.depth * 0.5);
          this.state.player.stats.hp -= poisonDmg;
          monster.abilityCooldown = 3;
          this.addMessage(`The ${monster.species} poisons you! (-${poisonDmg} HP)`, "#44cc44");
          this.emitVisual({ type: "poison", x: px, y: py, intensity: 0.5 });
          return false;
        }
        break;
      }
      case "charge": {
        if (dist >= 3 && dist <= 6) {
          const ddx = Math.sign(px - monster.pos.x);
          const ddy = Math.sign(py - monster.pos.y);
          let cx = monster.pos.x;
          let cy = monster.pos.y;
          for (let step = 0; step < 3; step++) {
            const nx2 = cx + ddx;
            const ny2 = cy + ddy;
            if (nx2 === px && ny2 === py) {
              monster.pos.x = cx;
              monster.pos.y = cy;
              const damage = Math.max(1, Math.floor(monster.stats.attack * 1.5) - this.state.player.stats.defense);
              this.state.player.stats.hp -= damage;
              monster.abilityCooldown = 4;
              this.addMessage(`The ${monster.species} charges into you! (-${damage} HP)`, "#ffaa44");
              this.emitVisual({ type: "playerHit", x: px, y: py, intensity: damage * 0.2 });
              return true;
            }
            if (
              ny2 >= 0 && ny2 < this.level.height &&
              nx2 >= 0 && nx2 < this.level.width &&
              this.level.tiles[ny2][nx2] === TileType.FLOOR &&
              !this.state.monsters.some((m) => m.alive && m !== monster && m.pos.x === nx2 && m.pos.y === ny2)
            ) {
              cx = nx2;
              cy = ny2;
            } else {
              break;
            }
          }
          monster.pos.x = cx;
          monster.pos.y = cy;
          monster.abilityCooldown = 3;
          return true;
        }
        break;
      }
    }
    return false;
  }

  private pickupItem(item: Item) {
    if (item.type === "potion") {
      this.state.player.stats.hp = Math.min(
        this.state.player.stats.maxHp,
        this.state.player.stats.hp + item.power
      );
      this.addMessage(`You drink the ${item.name}. (+${item.power} HP)`, "#44ff88");
    } else if (item.type === "weapon") {
      this.state.player.stats.attack += item.power;
      this.addMessage(`You equip the ${item.name}. (+${item.power} ATK)`, "#ffaa00");
    } else if (item.type === "armor") {
      this.state.player.stats.defense += item.power;
      this.addMessage(`You equip the ${item.name}. (+${item.power} DEF)`, "#4488ff");
    }

    this.state.items = this.state.items.filter((i) => i.id !== item.id);
  }

  private checkLevelUp() {
    const xpNeeded = this.state.player.stats.level * 20;
    if (this.state.player.stats.xp >= xpNeeded) {
      this.state.player.stats.level++;
      this.state.player.stats.xp -= xpNeeded;
      this.state.player.stats.maxHp += 5;
      this.state.player.stats.hp = this.state.player.stats.maxHp;
      this.state.player.stats.attack += 1;
      this.state.player.stats.defense += 1;
      this.addMessage(
        `LEVEL UP! You are now level ${this.state.player.stats.level}!`,
        "#ffff00"
      );
      this.emitVisual({
        type: "levelUp",
        x: this.state.player.pos.x,
        y: this.state.player.pos.y,
        intensity: 2,
      });
    }
  }

  private checkEvolution() {
    if (this.state.turn % 25 === 0) {
      for (const species of SPECIES) {
        const event = this.evolution.evolveSpecies(
          species,
          this.state.turn,
          this.state.depth
        );
        if (event) {
          this.state.evolutionLog.push(event);
          const color = event.type === "extinction" ? "#ff4444" : "#ff88ff";
          this.addMessage(`[EVOLUTION] ${event.description}`, color);
        }
      }
      this.envColors = generateEnvironmentColors(this.state.depth, this.level.seed, this.evolution.getMostDangerousSpecies());
    }
  }

  private checkPlayerDeath() {
    if (this.state.player.stats.hp <= 0) {
      this.state.gameOver = true;
      const killer = this.evolution.getMostDangerousSpecies() || "the dungeon";
      this.addMessage(
        `You have been slain! The ${killer} species proved most deadly.`,
        "#ff0000"
      );
    }
  }

  descend() {
    if (this.state.gameOver) return;
    const tile =
      this.level.tiles[this.state.player.pos.y][this.state.player.pos.x];
    if (tile !== TileType.STAIRS_DOWN) return;

    this.state.depth++;
    this.state.player.deepestLevel = Math.max(
      this.state.player.deepestLevel,
      this.state.depth
    );
    this.level = generateDungeon(60, 40, this.state.depth, this.level.seed);
    this.envColors = generateEnvironmentColors(this.state.depth, this.level.seed, this.evolution.getMostDangerousSpecies());

    const startRoom = this.level.rooms[0];
    this.state.player.pos.x = Math.floor(startRoom.x + startRoom.width / 2);
    this.state.player.pos.y = Math.floor(startRoom.y + startRoom.height / 2);
    this.state.player.explored = new Set();

    this.state.monsters = this.state.monsters.filter(() => false);
    this.state.items = [];
    this.spawnMonstersForLevel();
    this.spawnItemsForLevel();
    this.updateFOV();
    this.addMessage(`You descend to depth ${this.state.depth}...`, "#aa88ff");
  }

  ascend() {
    if (this.state.gameOver || this.state.depth === 0) return;
    const tile =
      this.level.tiles[this.state.player.pos.y][this.state.player.pos.x];
    if (tile !== TileType.STAIRS_UP) return;

    this.state.depth--;
    this.level = generateDungeon(60, 40, this.state.depth, this.level.seed);
    this.envColors = generateEnvironmentColors(this.state.depth, this.level.seed, this.evolution.getMostDangerousSpecies());

    const lastRoom = this.level.rooms[this.level.rooms.length - 1];
    this.state.player.pos.x = Math.floor(lastRoom.x + lastRoom.width / 2);
    this.state.player.pos.y = Math.floor(lastRoom.y + lastRoom.height / 2);
    this.state.player.explored = new Set();

    this.state.monsters = [];
    this.state.items = [];
    this.spawnMonstersForLevel();
    this.spawnItemsForLevel();
    this.updateFOV();
    this.addMessage(`You ascend to depth ${this.state.depth}...`, "#88aaff");
  }

  getScore(): number {
    const depthScore = this.state.depth * 100;
    const killScore = this.state.player.killCount * 10;
    const levelBonus = this.state.player.stats.level * 25;
    const efficiencyPenalty = Math.floor(this.state.turn * 0.5);
    return Math.max(0, depthScore + killScore + levelBonus - efficiencyPenalty);
  }

  getRunSummary() {
    return {
      seed: this.seed,
      score: this.getScore(),
      depth: this.state.depth,
      turns: this.state.turn,
      kills: this.state.player.killCount,
      level: this.state.player.stats.level,
      evolutionEvents: this.state.evolutionLog.length,
    };
  }

  getSpeciesStats() {
    return this.evolution.getSpeciesStats();
  }

  restart() {
    const seed = Date.now();
    this.evolution = new EvolutionEngine(seed);
    this.level = generateDungeon(60, 40, 0, seed);
    this.envColors = generateEnvironmentColors(0, seed);

    const startRoom = this.level.rooms[0];
    this.state = {
      player: {
        pos: {
          x: Math.floor(startRoom.x + startRoom.width / 2),
          y: Math.floor(startRoom.y + startRoom.height / 2),
        },
        stats: { hp: 30, maxHp: 30, attack: 5, defense: 2, speed: 10, xp: 0, level: 1 },
        inventory: [],
        explored: new Set(),
        killCount: 0,
        deepestLevel: 0,
      },
      monsters: [],
      items: [],
      messages: [{ text: "A new adventure begins...", color: "#a0a0ff", turn: 0 }],
      turn: 0,
      depth: 0,
      gameOver: false,
      evolutionLog: [],
      visualEvents: [],
    };

    this.spawnMonstersForLevel();
    this.spawnItemsForLevel();
    this.updateFOV();
  }
}
