# Codex Prompt Library

Replace bracketed placeholders. Keep prompts bounded; do not paste every template into every task.

---

## 1. First project orientation prompt

**Recommended model:** GPT-5.6 Sol

**Recommended reasoning effort:** High
**Why:** A new project contains maximum ambiguity and benefits from strong synthesis before edits.

```text
Act as the control thread for this new project.

Read AGENTS.md, 00_START_HERE.md, PROJECT_CHARTER.md, PROJECT_STATE.md, NEXT_TASK.md, DECISIONS.md, CHANGELOG.md, and the relevant files under docs/. Inspect the actual repository and Git state.

Do not implement yet.

Produce an orientation report with:
1. Confirmed project purpose, users, deliverable, constraints, and non-negotiables
2. What currently exists in the repository
3. Contradictions, placeholders, missing facts, and unsupported assumptions
4. Environment and commands that are verified versus merely documented
5. The smallest useful end-to-end vertical slice
6. Measurable acceptance criteria for that slice
7. Likely files and interfaces affected
8. Risks and validation approach
9. The exact first bounded implementation task
10. Recommended model and reasoning effort for that task

Clearly separate confirmed facts, inferences, and recommendations. Stop before editing.
```

---

## 2. Plan a bounded implementation

**Recommended model:** GPT-5.6 Sol High for ambiguous/high-risk work; GPT-5.6 Terra High for ordinary feature work.

```text
Plan the active task in NEXT_TASK.md.

First inspect the current implementation, relevant tests, accepted decisions, and Git state. Do not edit yet.

Return:
- Current verified behavior
- Desired behavior
- Root cause or design gap, when applicable
- Proposed smallest complete change
- Files and interfaces affected
- Alternatives considered
- Risks
- Test and validation plan
- Rollback/recovery
- Any conflict with project guidance

The plan must satisfy every acceptance criterion without adding unrelated scope.
```

---

## 3. Read-only explorer worker

**Recommended model:** GPT-5.6 Luna High for clear tracing; Terra High for moderate ambiguity; Sol High for architecture recovery.

```text
Role: Read-only explorer

Objective:
[question to answer]

Project context:
[only the context needed]

Inspect:
- [paths, symbols, documents, commands]

Do not:
- Edit files
- Install dependencies
- Make project-level decisions
- Expand into unrelated improvements

Return:
1. Confirmed findings with file/symbol references
2. Contradictions or unknowns
3. Risks
4. Options with tradeoffs
5. A recommendation
6. The smallest next action that would verify the recommendation

Stop after the report.
```

---

## 4. Builder worker

**Recommended model:** GPT-5.6 Terra High for most bounded features; Luna High for repeatable units.

```text
Role: Builder

Objective:
[one bounded outcome]

Accepted approach:
[summary or decision reference]

Allowed paths:
- [paths]

Prohibited:
- Changes outside allowed paths unless required to keep the build coherent; pause first
- New production dependencies without approval
- Unrelated cleanup
- Weakening or deleting tests
- Deployment or external production changes

Acceptance criteria:
1. [observable criterion]
2. [observable criterion]

Required validation:
- [commands/checks]

Implement the smallest complete change. Report all changed files and exact validation results. Stop and return a partial/blocked report if the accepted approach proves unsound or scope must materially expand.
```

---

## 5. Independent validator

**Recommended model:** GPT-5.6 Sol Max for production/high-risk review; Terra High for ordinary independent validation.

```text
Role: Independent validator

Do not assume the builder's summary is correct.

Objective:
Verify whether [change/branch/commit] satisfies these acceptance criteria:
1. [criterion]
2. [criterion]

Inspect:
- Diff and affected code
- Existing and new tests
- Relevant project instructions and decisions
- Runtime behavior where available

Look specifically for:
- Incorrect behavior
- Regressions
- Missing edge cases
- Weakened tests
- Unsupported claims
- Security, performance, accessibility, or operational risks
- Documentation that no longer matches reality

Return:
- PASS, CONDITIONAL PASS, or FAIL
- Findings ordered by severity
- Exact evidence
- Checks run and results
- Unverified areas
- Required fixes, if any

Do not modify implementation unless explicitly assigned a separate remediation task.
```

---

## 6. Goal Mode preparation

**Recommended model:** GPT-5.6 Sol High for goal design.

```text
Prepare a Goal Mode contract for:
[desired outcome]

Do not start the goal yet.

Inspect the current baseline and propose:
- Measurable completion conditions
- Evaluation commands or rubric
- Allowed paths and actions
- Prohibited actions
- Progress-log path
- Pause conditions
- Regression limits
- Recovery/checkpoint approach
- Recommended execution model and reasoning effort

Reject Goal Mode and recommend a bounded task instead if the evaluator or stopping condition is not trustworthy.
```

---

## 7. Documentation and state reconciliation

**Recommended model:** GPT-5.6 Terra Medium or Luna High.

```text
Reconcile repository documentation with the actual accepted and validated state.

Inspect Git diff/history, validation evidence, PROJECT_STATE.md, NEXT_TASK.md, DECISIONS.md, and CHANGELOG.md.

Update documentation so that:
- Confirmed work is marked complete
- Implemented but unverified work remains distinct
- Failed or abandoned approaches are not presented as active
- Accepted decisions are recorded
- Contradictions are removed
- NEXT_TASK.md contains exactly one bounded task
- No claim exceeds the available evidence

Do not modify application code.
```

---

## 8. Audit AGENTS.md after a model or workflow change

**Recommended model:** GPT-5.6 Sol High.

```text
Review AGENTS.md and linked operating documents for stale, duplicated, contradictory, or overly compensating rules.

Use:
- Current official Codex capabilities
- Actual repeated project failures
- Current repository structure
- Recent review feedback

Classify each rule:
- Keep
- Clarify
- Move to a closer directory
- Move to a playbook
- Enforce with tooling instead
- Remove as stale

Do not change files until you provide the audit and proposed patch. Preserve important safety and quality constraints while reducing instruction noise.
```

---

## 9. Session closeout prompt

**Recommended model:** The same model that completed the task; use Luna High or Terra Medium for documentation-only closeout.

```text
Close out the current session using docs/SESSION_PROTOCOL.md.

Run or verify the required checks, inspect Git status and diff, and update:
- PROJECT_STATE.md
- NEXT_TASK.md
- DECISIONS.md when a decision was accepted
- CHANGELOG.md

Do not mark anything complete without evidence.

Then return the closeout report with:
- Completed work
- Validation states
- Files changed
- Accepted decisions
- Known limitations
- Uncommitted/external state
- Exact next task
- Recommended next model and effort
```

---

## 10. Project recovery prompt

**Recommended model:** GPT-5.6 Sol High; use Max when the repository is badly inconsistent.

```text
Recover the authoritative current state from the repository. Do not rely on conversational memory.

Read the root operating files, relevant nested AGENTS files, Git status, recent commits, active worktrees, tests, and the files named by NEXT_TASK.md.

Report:
1. Confirmed complete
2. Implemented but unverified
3. Uncommitted or conflicting changes
4. Active branch/worktree state
5. Failed or abandoned approaches
6. Contradictory documentation
7. Blockers and unknowns
8. The last verified checkpoint
9. The smallest safe task that restores forward progress

Do not edit until the recovery report is reviewed.
```
