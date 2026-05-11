---
name: "Plan Validate"
description: "Review an implementation plan for simplicity, existing patterns, current best practices, and realistic verification before execution."
---
# Plan Validate

Use this skill to validate an implementation plan before coding starts.

## Goal

Make the plan simpler, more accurate, and easier to verify without changing product code.

## Required outcome

Keep the full implementation plan intact and append a **Plan validation (review)** section to the same document.

## Process

1. Find existing patterns
   - search the codebase for similar functionality
   - prefer reuse over invention
2. Verify framework and platform behavior
   - use **Context7** for relevant frameworks and libraries when available
   - use current docs or search for browser APIs, CSS, syntax, and integration details when relevant
3. Review simplicity
   - is this the simplest solution?
   - does it solve only the requested problem?
   - can we ship a smaller working version first?
4. Review plan-to-codebase fit
   - locate the likely code paths
   - challenge unsupported assumptions
   - note where the plan is missing connected areas
5. Validate dependency order
   - foundations before higher-level logic
   - explicit blockers before dependent work
6. Validate verification
   - confirm the proposed checks actually prove completion
   - tighten vague success criteria
7. Update the plan
   - remove scope creep, duplication, and avoidable abstraction
   - keep each chunk explicit about why / what / how / verification

## Output

Update the same plan file with an additive **Plan validation (review)** section. Do not replace the plan; refine it.
