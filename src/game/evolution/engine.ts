import {
  CreatureGenome,
  generateGenome,
  genomeToSprite,
  mutateGenome,
  crossGenomes,
} from "../../art/generator";
import { Monster, EvolutionEvent } from "../entities/types";

interface SpeciesRecord {
  species: string;
  totalKills: number;
  totalDeaths: number;
  currentGeneration: number;
  genomes: CreatureGenome[];
}

export class EvolutionEngine {
  private speciesRecords: Map<string, SpeciesRecord> = new Map();
  private playerDeathsBySpecies: Map<string, number> = new Map();
  private nextId = 0;
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  recordKill(species: string) {
    const record = this.speciesRecords.get(species);
    if (record) {
      record.totalDeaths++;
    }
  }

  recordPlayerDeath(species: string) {
    this.playerDeathsBySpecies.set(
      species,
      (this.playerDeathsBySpecies.get(species) || 0) + 1
    );
  }

  recordMonsterKill(species: string) {
    const record = this.speciesRecords.get(species);
    if (record) {
      record.totalKills++;
    }
  }

  spawnMonster(
    species: string,
    x: number,
    y: number,
    depth: number
  ): Monster {
    let record = this.speciesRecords.get(species);
    if (!record) {
      record = {
        species,
        totalKills: 0,
        totalDeaths: 0,
        currentGeneration: 0,
        genomes: [],
      };
      this.speciesRecords.set(species, record);
    }

    let genome: CreatureGenome;
    if (record.genomes.length >= 2 && Math.random() < 0.3) {
      const parentA = record.genomes[Math.floor(Math.random() * record.genomes.length)];
      const parentB = record.genomes[Math.floor(Math.random() * record.genomes.length)];
      genome = crossGenomes(parentA, parentB, this.seed + this.nextId);
    } else if (record.genomes.length > 0 && Math.random() < 0.6) {
      const parent = record.genomes[Math.floor(Math.random() * record.genomes.length)];
      genome = mutateGenome(parent, this.seed + this.nextId);
    } else {
      genome = generateGenome(species, this.seed + this.nextId + depth * 100, record.currentGeneration);
    }

    record.genomes.push(genome);
    if (record.genomes.length > 20) {
      record.genomes = record.genomes.slice(-15);
    }

    const basePower = 1 + depth * 0.5 + record.currentGeneration * 0.2;
    const fitness = record.totalKills / Math.max(1, record.totalDeaths);
    const scaledPower = basePower * (1 + Math.min(fitness, 3) * 0.2);

    return {
      id: `monster_${this.nextId++}`,
      pos: { x, y },
      stats: {
        hp: Math.floor(8 + scaledPower * 4),
        maxHp: Math.floor(8 + scaledPower * 4),
        attack: Math.floor(2 + scaledPower * 1.5),
        defense: Math.floor(1 + scaledPower),
        speed: Math.max(1, Math.floor(3 + scaledPower * 0.5)),
        xp: Math.floor(5 + scaledPower * 3),
        level: Math.floor(scaledPower),
      },
      species,
      genome,
      sprite: genomeToSprite(genome),
      behavior: this.pickBehavior(species, fitness),
      killCount: 0,
      alive: true,
    };
  }

  private pickBehavior(
    species: string,
    fitness: number
  ): Monster["behavior"] {
    if (fitness > 2) return "chase";
    if (fitness < 0.3) return "flee";

    const behaviors: Record<string, Monster["behavior"]> = {
      slime: "wander",
      demon: "chase",
      wraith: "ambush",
      golem: "wander",
      insect: "chase",
      fungal: "ambush",
    };
    return behaviors[species] || "wander";
  }

  evolveSpecies(species: string, turn: number, depth: number): EvolutionEvent | null {
    const record = this.speciesRecords.get(species);
    if (!record) return null;

    const fitness = record.totalKills / Math.max(1, record.totalDeaths);

    if (record.totalDeaths > 10 && fitness < 0.1) {
      record.currentGeneration++;
      return {
        turn,
        depth,
        type: "adaptation",
        description: `${species}s are adapting — growing stronger to survive`,
        species,
      };
    }

    if (fitness > 3 && record.totalKills > 5) {
      record.currentGeneration += 2;
      return {
        turn,
        depth,
        type: "speciation",
        description: `Dominant ${species}s are evolving into a deadlier variant`,
        species,
      };
    }

    if (turn % 50 === 0) {
      record.currentGeneration++;
      return {
        turn,
        depth,
        type: "mutation",
        description: `Background mutations ripple through the ${species} population`,
        species,
      };
    }

    return null;
  }

  getMostDangerousSpecies(): string | null {
    let best: string | null = null;
    let bestKills = 0;
    for (const [species, record] of this.speciesRecords) {
      if (record.totalKills > bestKills) {
        bestKills = record.totalKills;
        best = species;
      }
    }
    return best;
  }

  getSpeciesStats(): Map<string, SpeciesRecord> {
    return new Map(this.speciesRecords);
  }
}
