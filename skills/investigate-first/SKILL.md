---
name: "Investigate First"
description: "Investigate before proposing fixes. Trace the real code path, gather evidence, and identify the smallest fact-based fix."
requiredSources:
  - context7
  - brave-search
---
# Investigate First

Use this skill when behavior is broken, unclear, regressed, or marked critical.

## Goal

Understand the real problem before proposing a fix.

## Rules

- do not guess
- do not suggest speculative fixes
- do not assume data structures or framework behavior
- prefer direct evidence over theory

## Process

1. Inspect the local code path
   - search for the relevant entry points
   - read the connected files
   - trace the actual flow
   - inspect logs, outputs, or failing behavior
2. Verify framework and platform behavior
   - use **Context7** for library and framework details
   - use current docs or web search for browser APIs, CSS, integrations, or platform behavior when needed
3. Identify the root cause
   - explain the exact failing condition
   - show where the wrong assumption or missing update lives
4. Propose the smallest fix
   - extend existing patterns where possible
   - prefer the smallest safe fix you can verify
5. Define verification
   - say what should be run or checked to prove the fix

## Output

Return:
- observed symptom
- root cause
- evidence
- smallest fix direction
- verification method
