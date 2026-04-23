import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SCORES_FILE = path.join(process.cwd(), "scores.json");

interface ScoreEntry {
  name: string;
  score: number;
  depth: number;
  kills: number;
  level: number;
  turns: number;
  seed: number;
  date: string;
}

function readScores(): ScoreEntry[] {
  try {
    const data = fs.readFileSync(SCORES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeScores(scores: ScoreEntry[]) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
}

export async function GET() {
  const scores = readScores();
  return NextResponse.json(scores);
}

export async function POST(request: Request) {
  const entry: ScoreEntry = await request.json();
  const scores = readScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  const top20 = scores.slice(0, 20);
  writeScores(top20);
  return NextResponse.json({ rank: top20.findIndex((s) => s === entry) + 1, scores: top20 });
}
