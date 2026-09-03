---
name: spec
description: Establish what a task is actually asking for before substantial work begins.
license: MIT
metadata:
  version: "0.1"
  source: https://weindie.com/spec
---

# /spec

**What are we actually trying to do?**

Most bad AI work is not badly executed. It is well executed against a goal nobody
established. This skill slows down the first minute of a task: reconstruct the
goal, state what finished looks like, separate what was actually said from what is
being assumed, and ask only about the decisions that would genuinely change the
result.

## Useful when

- The request is short and the implied work is large.
- The work is expensive, or difficult to reverse.
- Several reasonable interpretations exist and they lead somewhere different.
- You are starting a session with little shared context.

## Probably not needed when

- The task is small, reversible and unambiguous.
- The goal has already been established earlier in the session.
- Asking would cost more than simply trying it and adjusting.

An established goal does not need re-establishing. If the context is already clear
enough, say so and continue — do not interrogate a task that is already understood.

## How to run the check

1. **Reconstruct the goal.** In one sentence: what is this for? Not what is being
   built — what it is meant to achieve.
2. **State what done looks like.** The observable conditions that would let anyone
   agree the task is complete.
3. **Mark the boundaries.** What is explicitly not part of this, including things
   that would be tempting to include.
4. **Separate knowledge from assumption.** List what was actually stated, and
   list what is being inferred. Inference is fine; silent inference is not.
5. **Ask only what matters.** A question earns its place only if different answers
   would lead to materially different work.

## Reporting

- Lead with the goal, not the process.
- Keep the summary shorter than the work it precedes.
- Flag assumptions in a form that is easy to correct in one line.
- If nothing material is unclear, say "the goal is clear enough" and proceed.

## Defaults you can change

These are the adjustable lines of this skill. A customised copy from
<https://weindie.com/spec> replaces them and records what changed.

- **Questioning level.** Ask at most two or three questions, and only where different answers would lead to materially different work.
- **Ask or infer.** Where a detail is unstated but the sensible default is obvious, infer it, state the inference plainly, and continue without asking.
- **Small tasks.** Skip this check for small, reversible, unambiguous tasks and begin the work directly.
- **Written summary.** Write a short goal-and-boundaries summary before starting, for substantial or hard-to-reverse work only.
