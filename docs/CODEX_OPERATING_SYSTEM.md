# Codex Operating System

## The central idea

Codex is most useful when it operates inside a visible system rather than carrying the whole project inside a single conversation.

The system has four layers:

1. **Intent** — `PROJECT_CHARTER.md`
2. **Current truth** — `PROJECT_STATE.md`, `DECISIONS.md`, and the repository
3. **Active execution** — `NEXT_TASK.md` and the current control thread
4. **Evidence** — tests, reviews, demos, benchmarks, and closeout records

A thread is a working context, not the project itself. The repository documentation is the durable memory.

## Control plane and workers

### Control thread

The control thread protects coherence. It should:

- Reconcile project state
- Select one bounded next task
- Preserve scope and quality constraints
- Delegate only when delegation lowers noise or increases confidence
- Review worker results
- Decide what is accepted
- Keep state files synchronized

The control thread should not absorb every exploratory log or test transcript.

### Worker threads

Workers receive bounded assignments.

Use these default roles:

| Role | Primary function | Write access |
|---|---|---|
| Explorer | Trace code, investigate options, locate evidence | Read-only |
| Builder | Implement one accepted unit | Limited to named files/worktree |
| Validator | Independently test behavior and claims | Prefer read-only except test artifacts |
| Curator | Update state, documentation, and handoff artifacts | Documentation only |
| Recovery analyst | Diagnose a broken or incoherent project state | Read-only first |

Workers do not make silent project-level decisions. They return evidence and recommendations to the control thread.

## One-task rule

`NEXT_TASK.md` contains one task because competing next steps create re-orientation cost.

A task is bounded when it has:

- A concrete outcome
- Inputs
- Allowed files or areas
- Prohibited scope
- Acceptance criteria
- Validation method
- A stopping condition

A task is not bounded when it says things like:

- Improve the app
- Finish the project
- Clean everything up
- Make it enterprise grade
- Research all possible approaches

Those can be goals only after they are converted into measurable sub-conditions.

## Task lifecycle

### 1. Orient

Read authoritative files and inspect reality.

### 2. Plan

For non-trivial work, define:

- Current behavior
- Desired behavior
- Proposed approach
- Files and interfaces affected
- Risks
- Validation
- Rollback or recovery

### 3. Implement

Make the smallest complete change that satisfies the accepted task.

### 4. Validate

Run appropriate checks and record exact results.

### 5. Review

For high-value or risky work, use an independent validator or `/review`.

### 6. Reconcile

Update state, decisions, changelog, and next task.

## Context control

Use the following practices to protect reasoning quality:

- Keep one thread per coherent unit of work.
- Continue the same thread when the task is genuinely the same problem.
- Fork when the work branches into an independent question.
- Delegate read-heavy exploration rather than filling the control thread with raw findings.
- Ask workers to return structured summaries and file references.
- Compact or close long threads after durable state is written to the repository.
- Never assume another thread knows decisions that were not written or explicitly supplied.

## Parallelism policy

Parallelism is useful when work is independent.

Good parallel tasks:

- Two read-only architectural investigations
- Test coverage analysis while another worker reviews documentation
- Independent validation of a finished implementation
- Researching separate external APIs

Risky parallel tasks:

- Two workers editing the same foundation files
- Simultaneous schema and application changes without an accepted contract
- Multiple agents deciding architecture independently
- Deployment while implementation is still changing

Default limit:

- One control thread
- Up to two active workers
- No more than one worker writing a given set of files

Increase concurrency only after the project demonstrates that its boundaries and tests can support it.

## Friction-reduction rules

When momentum is difficult, reduce the size of the active container rather than increasing pressure.

Use this sequence:

1. Open `NEXT_TASK.md`.
2. Read only the files listed as inputs.
3. Ask Codex for the smallest verifiable action.
4. Complete and validate that action.
5. Write the next action before ending.

Progress is the closure of one meaningful loop, not the number of ideas generated.

## Preventing attractive detours

Codex will often notice worthwhile adjacent improvements. Do not discard them, but do not automatically pursue them.

Classify each discovery as:

- Required for the active task
- Defect that blocks validation
- Risk requiring a decision
- Parking-lot idea

Only the first two may enter current scope without a deliberate decision.

## Periodic system review

Review this operating system when:

- A new Codex model family is released
- The same mistake appears more than once
- `AGENTS.md` becomes long or contradictory
- Validation repeatedly fails late
- Workers duplicate work
- Project resumption requires extensive reconstruction
- The repository gains a new major subsystem

Remove stale rules. Durable instructions should earn their place by preventing real recurring failure.
