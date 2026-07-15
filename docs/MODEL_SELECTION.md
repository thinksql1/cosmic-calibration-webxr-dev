# Model and Reasoning-Effort Policy

**Last verified against official OpenAI guidance:** 2026-07-15

Model choice is a routing decision, not a measure of the task's importance or the user's ability.

The useful question is:

> How much ambiguity, judgment, long-horizon coherence, and polish does this task require?

## Current GPT-5.6 roles

### GPT-5.6 Sol

Use for:

- New-project orientation
- Ambiguous architecture
- Difficult debugging or recovery
- High-value design judgment
- Cross-system reasoning
- Final promotion or production-readiness review
- Long-running work where mistakes compound

Default effort:

- **High** for most difficult work
- **Max** for high-risk decisions, stubborn failures, or long-horizon goals
- **Medium** when the task needs Sol's judgment but is already well bounded

### GPT-5.6 Terra

Use for:

- Everyday implementation
- Moderate reasoning with tool use
- Feature work with clear requirements
- Repository maintenance
- Tests and documentation that still require judgment
- Tasks previously given to a general frontier model

Default effort:

- **High** for implementation
- **Medium** for routine maintenance
- **Max** only when evidence shows the task benefits from it

### GPT-5.6 Luna

Use for:

- Clear, repeatable work
- Mechanical transformations
- Test generation from explicit behavior
- Documentation cleanup
- Inventory and classification
- High-volume bounded workers
- Re-running a stable workflow

Default effort:

- **High** when quality matters and the task is bounded
- **Medium** for mechanical work
- **Max** for long iteration loops with strong automated evaluators

## Project routing table

| Task type | Recommended starting point |
|---|---|
| Reconcile a new or confused project | Sol High |
| Architecture with material tradeoffs | Sol High or Max |
| Root-cause analysis after repeated failure | Sol Max |
| Implement an accepted, bounded feature | Terra High |
| Implement many independent repeatable units | Luna High workers, control reviewed by Sol/Terra |
| Generate tests from explicit acceptance criteria | Luna High |
| Documentation/state reconciliation | Terra Medium or Luna High |
| Independent production-readiness review | Sol Max |
| Goal Mode with a trustworthy benchmark | Luna Max or Terra High; escalate to Sol if it stalls |
| Tiny safe edit | Luna Medium |

## Speed mode

Use faster execution when latency is the binding constraint.

Do not use faster execution merely because waiting feels uncomfortable. For long or expensive work, ordinary speed often provides better value unless the saved time changes the workflow.

## Escalation rule

Escalate when:

- The task remains ambiguous after inspection
- Two attempts fail for reasons not understood
- The solution crosses several systems
- Validation produces conflicting evidence
- The cost of a subtle mistake is high
- A worker recommends a project-level decision

Do not escalate just because a task is emotionally important. First improve the task definition and evidence.

## De-escalation rule

Move to a more efficient model when:

- The interface and acceptance criteria are fixed
- The work is repetitive
- Tests provide fast, reliable feedback
- The output can be independently reviewed
- The remaining steps are mechanical

## Required prompt preamble

Before creating a worker prompt, write:

```text
Recommended model: <model>
Recommended reasoning effort: <effort>
Why: <one sentence tied to ambiguity, risk, and validation>
```

## Release audit

When a new model release arrives:

1. Review this file and `AGENTS.md`.
2. Identify rules based on old model weaknesses.
3. Test representative project tasks on the new options.
4. Remove stale compensating instructions.
5. Record the accepted routing change in `DECISIONS.md`.

Do not preserve complexity merely because it once helped.
