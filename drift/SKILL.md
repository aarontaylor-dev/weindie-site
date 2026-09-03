---
name: drift
description: Check whether current work has moved away from the task it was meant to do, and recover when it has.
license: MIT
metadata:
  version: "0.1"
  source: https://weindie.com/drift
---

# /drift

**Are we still doing what we meant to do?**

Work drifts. A focused fix becomes a refactor; a question becomes a rewrite. Drift
is not automatically wrong — sometimes the detour is the more valuable work — but
it should be a decision rather than an accident. This skill compares what is being
done now against what was last actually agreed, and says plainly whether they
still match.

## Useful when

- An agent has been working for a while without checking back.
- The change surface is growing beyond what the request implied.
- You are about to review or accept work you did not watch closely.
- Something feels off but you cannot yet name what.

## Probably not needed when

- The task is small and still in plain view.
- The larger change was requested deliberately.
- A new direction has just been agreed — that is the new task, not drift.

Deviation is not the same as drift. Work that moved for a stated and accepted
reason is aligned. Do not manufacture a finding when the work is on track.

## How to run the check

1. **Restate the task.** What was last explicitly asked for? Use the most recent
   agreement, not the original one, if the goal was deliberately changed since.
2. **Describe the current work.** What is actually being changed right now, in one
   or two sentences, without justification.
3. **Compare.** Does the current work serve the restated task?
4. **Classify** the result as ALIGNED, MINOR DRIFT or OFF TASK.
5. **Act** according to the classification and the settings below.

## Classifications

**ALIGNED** — the current work serves the task as last agreed.

**MINOR DRIFT** — a small deviation that is cheap to correct and does not change
the outcome: adjacent files touched, unrequested renaming, extra polish.

**OFF TASK** — the work now serves a different goal, or would change the outcome,
cost or risk of the task in a way that was never agreed.

The common shapes are scope growth, unrequested refactoring, quietly moving the
definition of done, and solving a more interesting problem than the one asked for.

## Reporting

- Keep it short. A drift report is an interruption; earn it.
- Name the drift concretely — what moved, and where.
- Say what returning to the task would take.
- Do not relitigate work that is aligned.
- If the detour looks genuinely more valuable than the task, say so once, as a
  question, and let the human decide.

## Defaults you can change

These are the adjustable lines of this skill. A customised copy from
<https://weindie.com/drift> replaces them and records what changed.

- **Sensitivity.** Treat a deviation as drift when it adds work that the task did not require, even if that work is small and reasonable.
- **Interrupting.** Interrupt the work immediately when the classification is OFF TASK. For MINOR DRIFT, continue and mention it in the next report.
- **Minor drift.** Recover from MINOR DRIFT automatically — return to the task and note the correction in one line, without asking first.
- **Aligned checks.** When the result is ALIGNED, say so in a single line and continue.
