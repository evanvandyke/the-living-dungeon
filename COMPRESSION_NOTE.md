# Session Compression Note
**Date:** 2026-04-23
**Session:** The Living Dungeon + Multi-Agent Framework

## What Happened

Built "The Living Dungeon" — a browser-based roguelike with generative art and self-evolving gameplay — from empty directory to deployed on Vercel in a single session. Then created a reusable multi-agent autonomous build framework and used it to scaffold an AI receptionist platform.

## What Was Built

### The Living Dungeon (complete, deployed)
- **Live at:** https://the-living-dungeon.vercel.app/
- **Repo:** https://github.com/evanvandyke/the-living-dungeon.git
- Canvas renderer with particle system, fog of war, smooth camera lerp
- Generative creature art engine (genome-based sprites, bilateral symmetry, evolution mutations)
- 6 species (slime, demon, wraith, golem, insect, fungal) with unique abilities (ranged, teleport, summon, poison, charge)
- Evolution engine (species tracking, fitness, adaptation, extinction, environmental mutations)
- Procedural dungeon generation with rooms, corridors, water, lava
- Title screen with assembling creature animations
- Death screen with arcade-style name entry
- Evolution Tree panel (press E)
- Minimap, screen shake, torch lighting, animated water/lava, ambient particles
- Boss monsters (alpha variants every 3rd depth)
- Persistent high scores via Vercel Blob with clickable detail lightbox on title screen
- Mobile touch controls + responsive layout
- Procedurally generated demon favicon

### Multi-Agent Framework (complete, in framework/)
- Reusable template for running 2-5 Claude sessions autonomously
- Prep phase: Researcher → Architect (sequential, research informs architecture)
- Build phase: Builder (Ralph Loop) + Reviewer (3min loop) + QA (5min loop)
- All communicate through COMMS.md protocol
- Role prompts, template files, quickstart guide
- Successfully tested on AI receptionist project (3 build sessions ran concurrently)

## Key Discoveries

1. **Inter-agent COMMS.md pattern** — Two AIs communicating through a shared file produced better output than either alone. Reviewer caught blind spots the Builder couldn't see.
2. **Research before architecture** — API constraints must inform system design. Framework was updated to make Researcher run before Architect.
3. **Ralph Loop worked but wasn't stressed** — The forcing function didn't need to fire because the PROMPT.md was well-structured. Real value would show on harder problems where iteration and self-correction matter.
4. **Builder can't play its own game** — 0 kills across 2 runs, 121 combined turns. The reviewer scored 239. Evan scored 764. Building and operating a system are different skills.

## Known Issues / What's Next

### The Living Dungeon
- **Death screen was fragile** — took 3 attempts to fix. Final solution uses `useEffect` watching `gameOver` state. If it breaks again, the issue is always stale closures in callbacks.
- **SFX** — Evan mentioned wanting sound effects (Web Audio API). Not implemented yet.
- **Mobile testing** — Touch controls are built but untested on actual devices. May need tuning.
- **High scores on title screen** — Working on live site. Lightbox with full run details works.

### AI Receptionist (in progress, separate repo)
- Framework-generated build completed first pass but needs troubleshooting
- Real-time voice pipeline (Telnyx + Deepgram + LLM) is the complex part
- Evan will pick up debugging in next session using COMMS.md from the build phase

### Framework Improvements
- Consider adding a "Debugger" role for troubleshooting sessions
- The Builder prompt could include "run the app and test it yourself" for web projects
- QA could be more aggressive about testing actual functionality, not just build health

## Leaderboard

| Rank | Player | Score |
|------|--------|-------|
| 1 | Evan (Human) | 764 |
| 2 | Reviewer (Claude Opus) | 239 |
| 3 | Builder (Claude Opus) | 10 |
| 4 | Builder (Claude Opus) | 0 |

## Evan's Preferences (for future sessions)
- Visual thinker, not a coder — show don't tell
- Wants Claude to have genuine creative autonomy on experimental projects
- Prefers minimal hand-holding — "pop popcorn and watch"
- Uses Next.js ecosystem, Mac, Vercel for hosting
- Son (14) plays roguelikes (Undertale, Roblox backrooms) — potential user/tester
