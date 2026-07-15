# AGENTS.md

## Purpose

This file defines the durable operating rules for Codex in this repository. Keep it compact. Put detailed procedures in `docs/` and link to them here.

## Authority and truth

Use this order when instructions or project facts conflict:

1. The user's current explicit instruction
2. This `AGENTS.md`
3. `PROJECT_CHARTER.md`
4. Accepted records in `DECISIONS.md`
5. Current facts in `PROJECT_STATE.md`
6. The active task in `NEXT_TASK.md`
7. Other repository documentation
8. Inferences from code or prior task context

Do not silently resolve contradictions. Report them and identify which source should be updated.

## Start-of-task protocol

Before substantial work:

1. Read `PROJECT_CHARTER.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, and relevant decisions.
2. Inspect the actual repository; do not assume documented paths or features exist.
3. Restate the bounded objective, constraints, acceptance criteria, and files likely to change.
4. For non-trivial work, plan before editing.
5. Identify uncertainties that can be resolved by inspection or testing rather than asking the user.

## Work boundaries

- Work on one coherent unit at a time.
- Do not expand scope merely because related improvements are visible.
- Record useful out-of-scope ideas in `PROJECT_STATE.md` under `Parking Lot`.
- Do not generate extra variants, features, abstractions, or dependencies unless they serve the active acceptance criteria.
- Prefer the smallest complete change over a broad partial change.
- Preserve existing behavior unless the task explicitly changes it.

## Control thread and delegation

Follow `docs/DELEGATION_AND_WORKTREES.md`.

- Treat the main task as the control thread.
- Use workers for bounded exploration, implementation, testing, review, or documentation.
- Never assume another thread automatically knows the current thread's decisions.
- Give each worker explicit context, scope, prohibited actions, expected outputs, and stopping conditions.
- Do not let two write-enabled workers change the same files.
- Use Git worktrees for independent write-heavy parallel work when available.

## Implementation

- Follow repository conventions already supported by evidence.
- Do not invent commands, APIs, schemas, or configuration.
- Avoid unrelated formatting churn.
- Add or update tests with behavioral changes.
- Explain any unavoidable compromise or incomplete coverage.

## Validation

Follow `docs/VALIDATION_AND_REVIEW.md`.

Work is not complete because code was written. Completion requires evidence appropriate to the task, such as:

- Build, lint, type-check, and test results
- Reproduction of the original defect
- Before/after behavior
- Runtime or browser verification
- Performance or security checks
- Documentation consistency
- Independent review for high-value or high-risk work

Never claim a check passed if it was not run. Distinguish `passed`, `failed`, `not run`, and `not applicable`.

## Safety

Follow `docs/SAFETY_GUARDRAILS.md`.

- Keep permissions and sandbox access narrow by default.
- Create a Git checkpoint before substantial or risky changes.
- Never expose, print, commit, or invent secrets.
- Do not delete broad directories, rewrite history, deploy, modify production data, rotate credentials, or change external infrastructure without explicit authorization.
- Stop before an irreversible or difficult-to-reverse action and present the exact action and recovery path.

## State preservation

At the end of meaningful work:

1. Update `PROJECT_STATE.md`.
2. Update `NEXT_TASK.md` so it contains exactly one next bounded task.
3. Add accepted decisions to `DECISIONS.md`.
4. Add meaningful completed changes to `CHANGELOG.md`.
5. Provide the closeout report defined in `docs/SESSION_PROTOCOL.md`.

Do not update documentation to imply unverified work is complete.

## Model and effort selection

Follow `docs/MODEL_SELECTION.md`.

Before proposing a new worker task or reusable Codex prompt, state the recommended model and reasoning effort. Use the strongest model for ambiguity, architecture, recovery, and final high-risk review; use efficient models for clear, repeatable, well-tested work.

## Communication

Use calm, direct status language:

- Objective
- What was inspected
- What changed
- Validation evidence
- Remaining uncertainty
- Exact next task

Do not flood the user with raw logs when a precise summary and file references are sufficient.

## Stop conditions

Pause and report rather than guessing when:

- Authoritative sources materially conflict
- The task would require an irreversible action not explicitly approved
- Required credentials, environments, or data are unavailable
- Validation shows the approach is unsound
- The requested acceptance criteria cannot all be met within the current scope
