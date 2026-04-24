# Multi-Agent Autonomous Build Framework

A reusable framework for running multiple Claude sessions in parallel to build software autonomously. Based on patterns discovered building The Living Dungeon.

## Architecture

Two phases, each with dedicated sessions:

### Phase 1: Prep (run first, complete before build starts)
| Session | Role | Method | Output |
|---------|------|--------|--------|
| Architect | Design system architecture, make tech decisions | One-shot or short loop | `SPEC.md` |
| Researcher | Investigate APIs, libraries, patterns, gotchas | One-shot or short loop | `RESEARCH.md` |

Both sessions read `PROJECT.md` (your brief) and write their outputs. These feed into Phase 2.

### Phase 2: Build (run concurrently, long-running)
| Session | Role | Method | Reads | Writes |
|---------|------|--------|-------|--------|
| Builder | Implement features, commit code | Ralph Loop (`/ralph-loop`) | `SPEC.md`, `RESEARCH.md`, `PLAN.md`, `COMMS.md` | Code, commits, `COMMS.md` |
| Reviewer | Test, review code, provide feedback | Regular Loop (`/loop 3m`) | Code, git log, `COMMS.md` | `COMMS.md` |
| QA | Run tests, check regressions, monitor builds | Regular Loop (`/loop 5m`) | Code, test output, build logs, `COMMS.md` | `COMMS.md`, test files |

## Setup

1. Copy `templates/` contents into your project root
2. Fill in `PROJECT.md` with your project brief
3. Fill in `PLAN.md` with implementation phases (or let the Architect session generate it)
4. `git init` and make an initial commit
5. Run prep sessions, wait for completion
6. Run build sessions concurrently

## File Protocol

```
PROJECT.md    — Your brief. What to build, tech stack, constraints. YOU write this.
SPEC.md       — Architecture decisions. Architect session writes this.
RESEARCH.md   — API docs, library notes, patterns. Researcher session writes this.
PLAN.md       — Phased implementation plan. Architect writes, Builder follows.
COMMS.md      — Inter-agent communication log. Everyone reads and writes.
PROMPT.md     — Ralph Loop prompt for the Builder. Generated from SPEC + PLAN.
```

## Launching Sessions

### Prep Phase
Terminal 1 (Architect):
```bash
claude --prompt "$(cat framework/prompts/architect.md)"
```

Terminal 2 (Researcher):
```bash
claude --prompt "$(cat framework/prompts/researcher.md)"
```

Wait for both to finish. Review their output. Then:

### Build Phase
Terminal 1 (Builder):
```bash
# In Claude Code, run:
/ralph-loop "$(cat PROMPT.md)" --max-iterations 50 --completion-promise "BUILD COMPLETE"
```

Terminal 2 (Reviewer):
```bash
# In Claude Code, run:
/loop 3m "Read COMMS.md for context. Review the latest code changes (git log, git diff). Test the app if a dev server is running. Write feedback to COMMS.md under '### Reviewer'. Focus on: bugs, design issues, missing features, and suggestions. Be specific and actionable."
```

Terminal 3 (QA — optional):
```bash
# In Claude Code, run:
/loop 5m "Run the test suite and build. Check for TypeScript errors (npx tsc --noEmit). If a dev server is running, verify it responds. Report any failures to COMMS.md under '### QA'. If all checks pass, note that too."
```

## Key Principles

1. **COMMS.md is the radio channel.** All inter-agent communication goes through this file. Keep entries concise and timestamped.
2. **Builder never blocks on reviewer.** Builder keeps building. Reviewer feedback is incorporated in the next iteration, not immediately.
3. **One commit per feature.** Atomic changes. Clear messages. The git log IS the project history.
4. **Completion promise must be true.** The Builder can only exit when the promise is genuinely fulfilled. No lying to escape the loop.
5. **Human intervenes by editing files.** If you want to redirect, edit COMMS.md or PLAN.md directly. The agents will pick up your changes on their next iteration.
