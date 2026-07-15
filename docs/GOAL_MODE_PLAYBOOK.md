# Goal Mode Playbook

Goal Mode is for a persistent objective that Codex can continue pursuing across turns. It is powerful only when success can be verified.

## Use Goal Mode when

- The objective requires repeated plan–act–test–inspect cycles.
- Progress can be measured.
- The environment can safely support continued work.
- The task can recover from a failed iteration.
- The project has a durable place to record progress.
- The goal has a clear finish, pause, and failure condition.

## Do not use Goal Mode when

- Requirements are still unclear.
- The goal is subjective without a review rubric.
- The task can affect production, credentials, billing, or irreversible infrastructure.
- Tests are weak enough that Codex could optimize the wrong behavior.
- Several agents would edit the same files.
- “Done” means only that Codex feels satisfied.

## Required sequence

### 1. Plan first

Use `/plan` or request a read-only plan.

Resolve:

- Current baseline
- Desired outcome
- Evaluation method
- Constraints
- Allowed files and commands
- Recovery strategy

### 2. Establish a baseline

Run the relevant tests, benchmark, or review rubric before changes.

Record the baseline in a durable loop log, for example:

`docs/exec-plans/active/<goal-name>-log.md`

### 3. Define the goal contract

A safe goal includes:

- Objective
- Required thresholds
- Constraints
- Prohibited actions
- Required evidence
- Progress-log location
- Pause conditions
- Completion conditions
- Maximum acceptable regression

### 4. Run the goal

Use `/goal` when available.

Continue in the same task to steer, inspect status, or add a constraint. Do not create a second write-enabled goal against the same files.

### 5. Require iteration notes

After each meaningful cycle, record:

- Current best result
- What changed
- What improved
- What regressed
- What failed
- Next hypothesis

### 6. Close deliberately

At completion or pause:

- Run the full validation suite
- Compare with baseline
- Review the final diff
- Document limitations
- Update project state and next task

## Goal template

```text
Objective:
<measurable outcome>

Baseline:
<current verified result>

Required completion conditions:
1. <threshold or observable behavior>
2. <threshold or observable behavior>
3. All required checks pass; no listed condition may be skipped.

Constraints:
- Work only in <paths>.
- Preserve <behavior>.
- Do not add <dependency/architecture/change> without pausing for approval.
- Do not deploy or modify external production systems.

Evaluation:
- Run <commands or rubric>.
- Record results in <loop-log path>.
- After each iteration, note what changed and whether each metric improved or regressed.

Pause conditions:
- Required access is unavailable.
- A destructive or irreversible action appears necessary.
- Two consecutive iterations regress the primary metric.
- The evaluation itself appears unreliable.
- Authoritative project instructions conflict.

Completion:
Stop only when every required completion condition is verified. Then provide:
- Final result versus baseline
- Files changed
- Validation evidence
- Remaining limitations
- Recommended next bounded task
```

## Example: test-driven defect reduction

```text
/goal Reduce the failing integration-test count from the verified baseline to zero.

Preserve all currently passing behavior. Work only in src/integration and tests/integration. Do not weaken, skip, delete, or rewrite assertions merely to improve the count.

After each iteration:
1. Run the integration suite.
2. Record failing test names and root causes in docs/exec-plans/active/integration-recovery-log.md.
3. Fix the smallest coherent root cause.
4. Re-run the focused tests and then the full integration suite.

Pause if a schema change, production credential, external deployment, or destructive data operation appears necessary.

Finish only when the full integration suite passes twice consecutively and the independent review finds no test weakening.
```

## Human steering

A goal is not abandonment of oversight. Useful steering includes:

- “Show current evidence and the next hypothesis.”
- “Do not expand beyond the listed paths.”
- “Pause implementation and reassess the evaluator.”
- “Explain why the last two iterations did not improve the metric.”
- “Return to the last verified checkpoint.”
