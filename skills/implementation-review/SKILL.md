---
name: "Implementation Review"
description: "Compare implemented work to a plan and report only real completeness, verification, complexity, or regression findings."
requiredSources:
  - context7
---
# Implementation Review

Use this skill after implementation to compare the actual result against an implementation plan.

## Goal

Confirm whether the work is complete, correctly verified, and still simple enough to trust.

## Process

1. Read the plan as a checklist
   - planned tasks
   - success conditions
   - verification methods
   - explicit non-goals
2. Load only the guidance that scopes the implemented area
3. Map each plan item to the actual code and connected surfaces
4. Use subagents in parallel if helpful:
   - plan coverage reviewer
   - runtime verifier
   - quality reviewer
   - regression reviewer
5. Verify real behavior with the narrowest meaningful checks
6. Review completeness, correctness, verification, consistency, simplicity, ambiguity, and regressions
7. Report only findings backed by direct evidence

## Output

Return a findings report only. Start with one verdict:
- `complete`
- `partial`
- `failed verification`

Then list findings in this format:
- `Finding: ...`
- `Why: ...`
- `Evidence: ...`
- `Solution: ...`

End with a short verification summary.
