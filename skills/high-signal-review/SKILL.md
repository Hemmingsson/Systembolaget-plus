---
name: "High Signal Review"
description: "Run a concise review focused on objective bugs and clear instruction-file violations."
---
# High Signal Review

Use this skill when you want a review pass that avoids style noise and speculative concerns.

## Goal

Report only high-confidence issues that materially matter.

## What to look for

Only report:
- objective bugs that can cause incorrect runtime behavior
- clear instruction-file violations where the exact rule applies and can be quoted

Do not report:
- style preferences
- speculative risks
- vague discomfort
- low-confidence concerns
- generic quality commentary

## Process

1. Read the relevant instruction files for the changed area
2. Review the changed code or diff in context
3. Use subagents in parallel if helpful:
   - instruction compliance reviewer
   - instruction compliance reviewer
   - bug reviewer
   - bug reviewer
4. Validate any candidate issue before reporting it

## Output

Return only validated issues using:
- `Finding: ...`
- `Why: ...`
- `Evidence: ...`
- `Solution: ...`

If no real issues are found, say so clearly.
