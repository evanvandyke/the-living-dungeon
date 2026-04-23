import { CreatureGenome } from "../../art/generator";

export interface Position {
  x: number;
  y: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  xp: number;
  level: number;
}

export interface Player {
  pos: Position;
  stats: Stats;
  inventory: Item[];
  explored: Set<string>;
  killCount: number;
  deepestLevel: number;
}

export interface Monster {
  id: string;
  pos: Position;
  stats: Stats;
  species: string;
  genome: CreatureGenome;
  sprite: number[][];
  behavior: "wander" | "chase" | "flee" | "ambush";
  killCount: number;
  alive: boolean;
}

export interface Item {
  id: string;
  name: string;
  type: "weapon" | "armor" | "potion" | "scroll";
  pos?: Position;
  power: number;
  glyph: string;
}

export type GameMessage = {
  text: string;
  color: string;
  turn: number;
};

export interface GameState {
  player: Player;
  monsters: Monster[];
  items: Item[];
  messages: GameMessage[];
  turn: number;
  depth: number;
  gameOver: boolean;
  evolutionLog: EvolutionEvent[];
  visualEvents: VisualEvent[];
}

export interface EvolutionEvent {
  turn: number;
  depth: number;
  type: "mutation" | "adaptation" | "extinction" | "speciation";
  description: string;
  species: string;
}

export interface VisualEvent {
  type: "death" | "hit" | "playerHit" | "levelUp" | "pickup";
  x: number;
  y: number;
  palette?: { r: number; g: number; b: number }[];
  intensity?: number;
}
