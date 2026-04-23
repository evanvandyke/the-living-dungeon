import { Color } from "../engine/renderer";

export interface CreatureGenome {
  bodyPlan: number[];
  symmetry: "bilateral" | "radial" | "asymmetric";
  palette: Color[];
  complexity: number;
  generation: number;
  ancestry: string[];
  mutationRate: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const SPECIES_PALETTES: Record<string, Color[]> = {
  slime: [
    { r: 0, g: 0, b: 0, a: 0 },
    { r: 80, g: 200, b: 80 },
    { r: 40, g: 140, b: 40 },
    { r: 120, g: 255, b: 120 },
    { r: 200, g: 255, b: 200 },
  ],
  demon: [
    { r: 0, g: 0, b: 0, a: 0 },
    { r: 200, g: 40, b: 40 },
    { r: 140, g: 20, b: 20 },
    { r: 255, g: 100, b: 30 },
    { r: 255, g: 200, b: 50 },
  ],
  wraith: [
    { r: 0, g: 0, b: 0, a: 0 },
    { r: 100, g: 80, b: 200 },
    { r: 60, g: 40, b: 140 },
    { r: 160, g: 120, b: 255 },
    { r: 220, g: 200, b: 255 },
  ],
  golem: [
    { r: 0, g: 0, b: 0, a: 0 },
    { r: 140, g: 120, b: 100 },
    { r: 100, g: 80, b: 60 },
    { r: 180, g: 160, b: 140 },
    { r: 220, g: 200, b: 180 },
  ],
  insect: [
    { r: 0, g: 0, b: 0, a: 0 },
    { r: 50, g: 50, b: 50 },
    { r: 180, g: 150, b: 20 },
    { r: 100, g: 200, b: 50 },
    { r: 220, g: 220, b: 0 },
  ],
  fungal: [
    { r: 0, g: 0, b: 0, a: 0 },
    { r: 160, g: 100, b: 160 },
    { r: 200, g: 140, b: 180 },
    { r: 120, g: 60, b: 120 },
    { r: 240, g: 200, b: 240 },
  ],
};

export function generateGenome(
  species: string,
  seed: number,
  generation = 0
): CreatureGenome {
  const rng = seededRandom(seed);
  const basePalette = SPECIES_PALETTES[species] || SPECIES_PALETTES.slime;

  const palette = basePalette.map((c, i) => {
    if (i === 0) return c;
    const genBoost = Math.min(generation * 3, 40);
    return {
      r: Math.min(255, c.r + Math.floor(rng() * genBoost)),
      g: Math.min(255, c.g + Math.floor(rng() * genBoost)),
      b: Math.min(255, c.b + Math.floor(rng() * genBoost)),
      a: c.a,
    };
  });

  const complexity = Math.min(1, 0.3 + generation * 0.08 + rng() * 0.2);

  const bodyPlan: number[] = [];
  const size = 8;
  const half = Math.ceil(size / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < half; x++) {
      const roll = rng();
      if (roll < complexity * 0.6) {
        bodyPlan.push(Math.floor(rng() * (palette.length - 1)) + 1);
      } else {
        bodyPlan.push(0);
      }
    }
  }

  if (generation >= 2) {
    const eyeY = Math.floor(size * 0.25);
    const eyeX = Math.floor(half * 0.6);
    const eyeIdx = eyeY * half + eyeX;
    if (eyeIdx < bodyPlan.length) {
      bodyPlan[eyeIdx] = palette.length - 1;
    }
  }

  if (generation >= 4) {
    for (let x = 0; x < half; x++) {
      if (rng() < 0.4) {
        bodyPlan[x] = Math.floor(rng() * (palette.length - 1)) + 1;
        bodyPlan[(size - 1) * half + x] = Math.floor(rng() * (palette.length - 1)) + 1;
      }
    }
  }

  return {
    bodyPlan,
    symmetry: rng() > 0.3 ? "bilateral" : rng() > 0.5 ? "radial" : "asymmetric",
    palette,
    complexity,
    generation,
    ancestry: [],
    mutationRate: 0.1 + rng() * 0.15 + generation * 0.02,
  };
}

export function genomeToSprite(genome: CreatureGenome): number[][] {
  const size = 8;
  const half = Math.ceil(size / 2);
  const sprite: number[][] = [];

  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < half; x++) {
      row.push(genome.bodyPlan[y * half + x] || 0);
    }
    if (genome.symmetry === "bilateral") {
      const mirror = [...row].reverse();
      sprite.push([...row, ...mirror]);
    } else if (genome.symmetry === "radial") {
      const mirror = [...row].reverse();
      sprite.push([...row, ...mirror]);
    } else {
      const rightHalf: number[] = [];
      for (let x = 0; x < half; x++) {
        rightHalf.push(genome.bodyPlan[((y + 3) % size) * half + x] || 0);
      }
      sprite.push([...row, ...rightHalf]);
    }
  }

  return sprite;
}

export function mutateGenome(
  parent: CreatureGenome,
  seed: number
): CreatureGenome {
  const rng = seededRandom(seed);
  const child: CreatureGenome = {
    ...parent,
    bodyPlan: [...parent.bodyPlan],
    palette: parent.palette.map((c) => ({ ...c })),
    generation: parent.generation + 1,
    ancestry: [...parent.ancestry, `gen${parent.generation}`],
    mutationRate: parent.mutationRate * (0.9 + rng() * 0.2),
  };

  for (let i = 0; i < child.bodyPlan.length; i++) {
    if (rng() < child.mutationRate) {
      if (rng() < 0.3) {
        child.bodyPlan[i] = 0;
      } else {
        child.bodyPlan[i] =
          Math.floor(rng() * (child.palette.length - 1)) + 1;
      }
    }
  }

  for (let i = 1; i < child.palette.length; i++) {
    if (rng() < child.mutationRate * 0.5) {
      child.palette[i] = {
        r: Math.max(0, Math.min(255, child.palette[i].r + Math.floor((rng() - 0.5) * 40))),
        g: Math.max(0, Math.min(255, child.palette[i].g + Math.floor((rng() - 0.5) * 40))),
        b: Math.max(0, Math.min(255, child.palette[i].b + Math.floor((rng() - 0.5) * 40))),
      };
    }
  }

  child.complexity = Math.min(
    1,
    child.complexity + (rng() - 0.4) * 0.1
  );

  return child;
}

export function crossGenomes(
  a: CreatureGenome,
  b: CreatureGenome,
  seed: number
): CreatureGenome {
  const rng = seededRandom(seed);
  const crossPoint = Math.floor(rng() * a.bodyPlan.length);

  const childPlan = [
    ...a.bodyPlan.slice(0, crossPoint),
    ...b.bodyPlan.slice(crossPoint),
  ];

  const palette = rng() > 0.5 ? a.palette : b.palette;

  return {
    bodyPlan: childPlan,
    symmetry: rng() > 0.5 ? a.symmetry : b.symmetry,
    palette: palette.map((c) => ({ ...c })),
    complexity: (a.complexity + b.complexity) / 2,
    generation: Math.max(a.generation, b.generation) + 1,
    ancestry: [...a.ancestry.slice(-3), ...b.ancestry.slice(-3)],
    mutationRate: (a.mutationRate + b.mutationRate) / 2,
  };
}

const SPECIES_ENV_TINTS: Record<string, { r: number; g: number; b: number }> = {
  slime: { r: 0, g: 15, b: 0 },
  demon: { r: 15, g: -5, b: -5 },
  wraith: { r: 5, g: -5, b: 15 },
  golem: { r: 8, g: 6, b: 0 },
  insect: { r: -5, g: 5, b: -5 },
  fungal: { r: 10, g: 0, b: 10 },
};

export function generateEnvironmentColors(
  depth: number,
  seed: number,
  dominantSpecies?: string | null
): { floor: Color; wall: Color; accent: Color } {
  const rng = seededRandom(seed + depth * 1000);
  const hueShift = depth * 30;
  const tint = dominantSpecies ? (SPECIES_ENV_TINTS[dominantSpecies.replace("alpha ", "")] || { r: 0, g: 0, b: 0 }) : { r: 0, g: 0, b: 0 };

  return {
    floor: {
      r: Math.max(8, Math.min(40, 20 - depth * 2 + Math.floor(rng() * 10) + tint.r)),
      g: Math.max(8, Math.min(40, 18 - depth * 2 + Math.floor(rng() * 10) + tint.g)),
      b: Math.max(10, Math.min(45, 25 - depth + Math.floor(rng() * 10 + hueShift * 0.1) + tint.b)),
    },
    wall: {
      r: Math.min(90, 40 + Math.floor(rng() * 20 + hueShift * 0.2) + tint.r * 2),
      g: Math.min(80, 35 + Math.floor(rng() * 15) + tint.g * 2),
      b: Math.min(100, 50 + Math.floor(rng() * 20 + hueShift * 0.3) + tint.b * 2),
    },
    accent: {
      r: Math.min(255, 100 + Math.floor(rng() * 80 + hueShift) + tint.r * 4),
      g: Math.min(255, 80 + Math.floor(rng() * 60) + tint.g * 4),
      b: Math.min(255, 120 + Math.floor(rng() * 100) + tint.b * 4),
    },
  };
}
