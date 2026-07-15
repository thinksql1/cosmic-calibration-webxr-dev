# Codex Project Starter Pack

This pack gives a brand-new Codex project a durable operating system before the repository becomes complicated.

It is designed to prevent the most common failure pattern:

> Important work becomes scattered across long threads, partially completed experiments, undocumented decisions, and unclear next steps.

The solution is not more effort. It is a small set of files that preserve intent, reduce re-orientation cost, and make Codex prove when work is complete.

## The only setup steps you need right now

1. Copy this entire folder into the root of the new project.
2. Open `PROJECT_CHARTER.md` and complete only the fields marked **REQUIRED**.
3. Make sure the folder is a Git repository before allowing substantial edits.
4. Start one Codex control thread in the project root.
5. Give it the **First project orientation prompt** from `docs/PROMPT_LIBRARY.md`.
6. Review the proposed first task before implementation begins.

Do not try to customize every file on the first day. The system is meant to become more specific as the project teaches you what it needs.

## Core files

| File | Purpose |
|---|---|
| `AGENTS.md` | Compact instructions Codex should follow every time |
| `PROJECT_CHARTER.md` | Why the project exists, what is in scope, and what success means |
| `PROJECT_STATE.md` | Current truth: working, in progress, blocked, unknown |
| `NEXT_TASK.md` | Exactly one bounded next task |
| `DECISIONS.md` | Durable decisions and their reasoning |
| `CHANGELOG.md` | Meaningful completed changes |
| `docs/CODEX_OPERATING_SYSTEM.md` | How control threads, workers, context, and task boundaries fit together |
| `docs/MODEL_SELECTION.md` | Current model and reasoning-effort policy |
| `docs/GOAL_MODE_PLAYBOOK.md` | How to use long-running goals without creating an uncontrolled loop |
| `docs/DELEGATION_AND_WORKTREES.md` | Safe parallel work and worker roles |
| `docs/VALIDATION_AND_REVIEW.md` | Evidence required before calling work complete |
| `docs/SAFETY_GUARDRAILS.md` | Git, permissions, destructive-action, credential, and deployment protections |
| `docs/SESSION_PROTOCOL.md` | Low-friction start and closeout routines |
| `docs/PROMPT_LIBRARY.md` | Reusable prompts for orientation, planning, building, validation, and closeout |
| `docs/OFFICIAL_SOURCES.md` | Official documentation used to ground this starter pack |

## The governing pattern

Use:

- One control thread to preserve the whole project
- Bounded worker threads for exploration, implementation, and validation
- Worktrees for independent write-heavy work
- A measurable definition of done
- One explicit `NEXT_TASK.md`
- State updates at the end of meaningful work
- Goal Mode only when the stopping condition can be verified

## First success milestone

The starter pack is active when:

- `PROJECT_CHARTER.md` has a real project definition
- Codex can accurately summarize the active instructions
- `NEXT_TASK.md` contains one bounded task
- The repository has a clean Git checkpoint
- Codex has proposed a plan without prematurely editing the project

That is enough to begin.
