# The Living Dungeon — Ralph Loop Prompt

You are building **The Living Dungeon**, a browser-based roguelike game with a generative art engine and self-evolving gameplay. The game runs at `http://localhost:4444`.

## Your Mission

Each iteration, you should:

1. **Read COMMS.md** — Check for feedback from the reviewer agent. Incorporate their suggestions.
2. **Assess the current state** — Run the dev server if it's not running (`npm run dev`). Check git log to see what's been done. Read the key source files.
3. **Pick the highest-impact improvement** — from the priority list below or from your own judgment.
4. **Implement it** — Write clean, working code. Test that it compiles.
5. **Commit your work** — One commit per improvement with a clear message.
6. **Update COMMS.md** — Write what you did and what you think should come next.

## Priority List (pick from here or invent your own)

### Tier 1 — Visual Impact (Evan is visual, prioritize these)
- [ ] Ambient particle effects (floating dust, glowing embers near lava, water ripples)
- [ ] Smooth camera transitions when moving between rooms
- [ ] Death animations for monsters (explosion particles using their palette colors)
- [ ] Torch/light flickering effect on walls near the player
- [ ] Animated water and lava tiles
- [ ] Screen shake on combat hits
- [ ] A title screen with generative art background
- [ ] Minimap in the corner showing explored areas
- [ ] Creature sprites that animate (idle bobbing, attack frames)

### Tier 2 — Evolution & Art Engine
- [ ] Visual evolution tree showing creature lineages
- [ ] Monsters visually change as they evolve (more complex sprites for higher generations)
- [ ] Environmental mutations — dungeon layout changes based on dominant species
- [ ] Evolution ticker/feed showing mutations in real-time
- [ ] Species extinction events when player dominates a type
- [ ] New species spawning from successful crossbreeding
- [ ] Boss monsters that are evolved super-variants

### Tier 3 — Gameplay Depth
- [ ] More item types (scrolls, rings, wands with unique effects)
- [ ] Monster special abilities (ranged attacks, teleportation, summoning)
- [ ] Treasure rooms with risk/reward
- [ ] Inventory screen (press 'i')
- [ ] Status effects (poison, confusion, haste, invisibility)
- [ ] Auto-explore command
- [ ] Sound effects using Web Audio API
- [ ] Procedural music that evolves with dungeon depth

### Tier 4 — Polish
- [ ] Tooltips on hover showing monster stats and species info
- [ ] Death screen with run statistics and evolution history
- [ ] Smooth scrolling / sub-tile movement
- [ ] Accessibility improvements
- [ ] Performance optimization for large levels

## Architecture

```
src/
  engine/renderer.ts     — Canvas rendering, particles, fog of war
  art/generator.ts       — Generative creature genomes, sprites, mutations, palettes
  game/
    gameLoop.ts          — Core game loop, state management, turn processing
    entities/types.ts    — Type definitions for all game objects
    generation/dungeon.ts — Procedural dungeon generation, FOV
    evolution/engine.ts  — Species tracking, fitness, evolution events
  components/
    GameCanvas.tsx       — React component, input handling, UI
  app/
    page.tsx             — Entry point
    layout.tsx           — Layout
    globals.css          — Styles
```

## Rules
- Port is **4444**, don't change it
- Keep it a single-page app, no routing needed
- Commit after each meaningful change
- Don't break existing functionality while adding new features
- Prioritize visual impact — this is for someone who experiences the world visually
- Have fun. This is an experiment in creative autonomy. Take risks. Try weird things.

## Completion

When you believe the game is in a polished, impressive state with all Tier 1 and Tier 2 items complete, output:

<promise>THE LIVING DUNGEON IS ALIVE</promise>
