import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { SavedScore } from "@/game/scores";

const BLOB_NAME = "scores.json";
const LOCAL_FILE = path.join(process.cwd(), "scores.json");

const isVercel = !!process.env.BLOB_READ_WRITE_TOKEN;

async function readScores(): Promise<SavedScore[]> {
  if (isVercel) {
    try {
      const blobs = await list({ prefix: BLOB_NAME });
      const match = blobs.blobs.find((b) => b.pathname === BLOB_NAME);
      if (!match) return [];
      const res = await fetch(match.url);
      return await res.json();
    } catch {
      return [];
    }
  }
  try {
    const data = fs.readFileSync(LOCAL_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeScores(scores: SavedScore[]) {
  const json = JSON.stringify(scores, null, 2);
  if (isVercel) {
    await put(BLOB_NAME, json, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });
  } else {
    fs.writeFileSync(LOCAL_FILE, json);
  }
}

export async function GET() {
  const scores = await readScores();
  return NextResponse.json(scores);
}

export async function POST(request: Request) {
  const entry: SavedScore = await request.json();
  const scores = await readScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  const top20 = scores.slice(0, 20);
  await writeScores(top20);
  const rank = top20.findIndex(
    (s) => s.name === entry.name && s.score === entry.score && s.date === entry.date
  ) + 1;
  return NextResponse.json({ rank, scores: top20 });
}
