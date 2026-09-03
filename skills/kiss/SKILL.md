---
name: kiss
description: Review work for complexity that is not earning its place, and propose the smallest version that still works.
metadata:
  version: "0.1"
  source: https://weindie.com/kiss
---

# /kiss

**Is this the smallest version that still works?**

Complexity accumulates one reasonable decision at a time. Each abstraction was
defensible when it was added; together they cost more than the problem does. This
skill looks at the current work and asks which structure is carrying real weight,
which is carrying imagined weight, and what the smallest honest version would be.

## Useful when

- A small change has spread across many files.
- New abstractions appeared that the goal did not ask for.
- Something is hard to explain, or hard to change safely.
- You are about to build a general solution to a specific problem.

## Probably not needed when

- The complexity is load-bearing and you already know why.
- The work is genuinely intricate and the structure reflects that.
- Simplifying now would cost more than living with it.

Existing complexity is often justified. Saying so is a valid and useful result.
Do not simplify for its own sake, and do not trade real structure for a smaller
line count.

## How to run the check

1. **State the goal in one sentence.** Simplicity is only measurable against what
   the work is for.
2. **Inventory the structure.** List the abstractions, layers, indirections,
   options and process steps currently in play.
3. **Ask what each one is holding up.** For each: what breaks if it is removed?
   If the answer is "nothing yet", it is speculative.
4. **Separate justified from speculative.** Justified complexity answers to a real
   constraint that exists now — scale, a contract, a known requirement.
5. **Describe the smallest version that still meets the goal**, including what it
   gives up.

## Reporting

- Say what should stay, and why, before saying what should go.
- Attach each removal to a concrete cost it is currently imposing.
- Give the smaller version concretely, not as a principle.
- If the current shape is right, say so plainly and stop.

## Defaults you can change

These are the adjustable lines of this skill. A customised copy from
<https://weindie.com/kiss> replaces them and records what changed.

- **Simplification pressure.** Flag complexity that is not currently carrying weight, but leave anything with a plausible near-term justification in place.
- **Abstractions.** Treat an abstraction with a single caller as speculative unless a second use is already known and imminent.
- **Scope of review.** Review the work that has recently changed, and mention surrounding architecture only where it is the direct cause of the complexity.
- **Prose and responses.** Review code and structure only; leave the wording of explanations and responses alone.
