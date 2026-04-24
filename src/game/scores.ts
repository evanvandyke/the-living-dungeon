export interface SavedScore {
  name: string;
  score: number;
  depth: number;
  kills: number;
  level: number;
  turns: number;
  attack: number;
  defense: number;
  seed: number;
  date: string;
  evolutionEvents: number;
  speciesEncountered: number;
  speciesStats: { species: string; kills: number; deaths: number; generation: number }[];
}
