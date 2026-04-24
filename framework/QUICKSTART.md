# Quick Start

## 1. New Project Setup

```bash
mkdir my-project && cd my-project
git init

# Copy framework files
cp -r /path/to/framework/templates/* .
cp -r /path/to/framework/prompts ./prompts

# Fill in your project brief
# Edit PROJECT.md with what you're building
```

## 2. Run Prep Phase

Run these sequentially — Researcher first, then Architect. Research informs architecture.

**Step 1 — Researcher** (run first):
```
claude
# Then paste or type:
# You are the Researcher. Read PROJECT.md. Investigate all APIs, libraries, and services.
# Produce RESEARCH.md with working code snippets, gotchas, and auth details.
# Write to COMMS.md when done.
```

Wait for Researcher to finish. Then:

**Step 2 — Architect** (run after Researcher completes):
```
claude
# Then paste or type:
# You are the Architect. Read PROJECT.md and RESEARCH.md.
# Use the research findings to inform your architecture decisions.
# Produce SPEC.md (architecture) and PLAN.md (phased implementation plan).
# Write to COMMS.md when done.
```

Review SPEC.md, PLAN.md, and RESEARCH.md. Edit if needed.

## 3. Run Build Phase

Open three terminals in the project directory:

**Terminal 1 — Builder (Ralph Loop):**
```
claude
# Then run:
/ralph-loop "You are the Builder. Read prompts/builder.md for your full instructions. Follow PLAN.md top-down. Read COMMS.md for feedback. Commit after each feature. Update COMMS.md with progress." --max-iterations 50 --completion-promise "BUILD COMPLETE"
```

**Terminal 2 — Reviewer (Loop):**
```
claude
# Then run:
/loop 3m You are the Reviewer. Read prompts/reviewer.md for your full instructions. Check git log, review latest changes, test the app, write feedback to COMMS.md.
```

**Terminal 3 — QA (Loop):**
```
claude
# Then run:
/loop 5m You are QA. Read prompts/qa.md for your full instructions. Run build, type checks, and tests. Write status to COMMS.md.
```

## 4. Monitor

- Watch COMMS.md for progress, issues, and inter-agent conversation
- Check git log for commits
- If you need to redirect, edit COMMS.md with a `### Human` entry — all agents will read it on their next cycle
- If something goes wrong, you can always stop a loop with `/cancel-ralph` or Ctrl+C

## 5. When It's Done

The Builder exits when the completion promise is true. The Reviewer and QA loops can be stopped manually (Ctrl+C) once the Builder completes.

Review the final state, test it yourself, then deploy.

## Tips

- **Token budget**: Builder consumes the most tokens. Reviewer and QA are lightweight.
- **Timing**: Reviewer at 3min and QA at 5min means feedback arrives frequently but not overwhelmingly.
- **Human override**: Writing to COMMS.md is the steering wheel. "### Human — Stop working on X, pivot to Y" will be picked up immediately.
- **Prep quality matters**: The better your PROJECT.md and the Architect's SPEC.md, the fewer iterations the Builder wastes.
