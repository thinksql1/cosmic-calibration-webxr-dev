# Session Protocol

The purpose of this protocol is to make stopping and resuming inexpensive.

## Session start

The control thread should inspect:

1. `AGENTS.md`
2. `PROJECT_CHARTER.md`
3. `PROJECT_STATE.md`
4. `NEXT_TASK.md`
5. Relevant accepted decisions
6. Git status and recent commits
7. The actual files involved in the task

Then report:

```text
Current objective:
Verified starting state:
Active constraints:
Primary uncertainty:
Planned bounded action:
Validation:
Recommended model and effort:
```

## During work

Keep the user oriented when a task is long:

- Report meaningful findings, not every command.
- Surface a blocking defect as soon as it is confirmed.
- State when the plan changes and why.
- Do not conceal failed approaches.
- Preserve partial evidence in the repository when it will help resumption.

## Session closeout

Before ending meaningful work:

1. Run the agreed validation.
2. Review Git diff and status.
3. Update `PROJECT_STATE.md`.
4. Add accepted decisions.
5. Update `CHANGELOG.md`.
6. Replace `NEXT_TASK.md` with one next bounded task.
7. Record unresolved risks and exact evidence locations.
8. Commit or clearly identify uncommitted work.

## Closeout report template

```text
Session result:
<one paragraph>

Completed:
- <verified completed item>

Validation:
- PASS: <check>
- FAIL: <check>
- NOT RUN: <check and reason>

Files changed:
- <path>: <purpose>

Decisions accepted:
- <decision ID or none>

Known limitations:
- <item>

Uncommitted or external state:
- <item or none>

Exact next task:
<title from NEXT_TASK.md>

Recommended next model and effort:
<model / effort and reason>
```

## Recovery after interruption

Use this prompt:

```text
Recover the current project state from the repository rather than relying on prior conversation memory.

Read AGENTS.md, PROJECT_CHARTER.md, PROJECT_STATE.md, NEXT_TASK.md, DECISIONS.md, CHANGELOG.md, Git status, recent commits, and files relevant to the active task.

Report:
1. What is confirmed complete
2. What is implemented but unverified
3. What is currently changed or uncommitted
4. What is blocked or unknown
5. Whether NEXT_TASK.md still matches reality
6. The smallest safe action that restores a verified forward path

Do not edit until the recovery report is complete.
```

## When a thread becomes too long

Before compacting, forking, or starting a new control thread:

- Write durable facts to project files.
- Record accepted decisions.
- Save active test results.
- Identify the current branch/worktree.
- Set one next task.
- Ask the new thread to reconstruct state from the repository.

The transcript is helpful history. It is not the authoritative project database.
