# Project Workflow

## Default operating model

Use **Craft Agents + DEX** with one **orchestrator session** and small, focused **subagents**.

The orchestrator owns the full loop:
1. research the task
2. create or refine the plan
3. validate the plan for simplicity and fit
4. turn the plan into DEX tasks
5. launch one focused implementation subagent at a time
6. validate the implementation result
7. send completed work to review
8. approve, request changes, or create follow-up work

## Core principles

- **Research first, then plan, then implement**
- **Keep it simple and straightforward**
- **Build the smallest version that works first**
- **Avoid overhead until there is a proven need**
- **Reuse existing patterns before introducing new abstractions**
- **Do not guess about APIs, data flow, browser behavior, or framework syntax**

## Investigation before implementation

Before implementing any non-trivial change:
1. inspect the existing code paths and data structures
2. find the right place for the change based on current repo patterns
3. check whether the solution already exists or can be extended
4. verify framework and library behavior with **Context7** when relevant
5. verify current platform, browser API, CSS, and integration details with docs or search when relevant
6. make the smallest safe change you can verify

If something is broken or unclear, act like a detective first:
- trace the actual path
- gather evidence
- identify the root cause
- only then propose or implement a fix

## Subagent model

Subagents should be narrow, explicit, and disposable. Give them only the context needed for one bounded job.

### Good subagent jobs
- research for one task or feature area
- plan validation
- backlog extraction from one validated plan
- implementation of one DEX task
- browser or UI verification
- review of one completed implementation session
- cleanup or follow-up for one concrete issue

### Launch mode

When the orchestrator spawns subagents, use:
- `permissionMode: allow-all`

This keeps the workflow moving without manual approval at every step.

### Source selection by job

Enable only the sources the subagent actually needs:
- **Research subagent**: `context7`, `brave-search`
- **Implementation subagent**: `dex`, plus `context7` and `brave-search` when current docs matter
- **Browser verification subagent**: `chrome-devtools`
- **Review subagent**: `dex`, and `chrome-devtools` when browser-visible behavior must be verified

## Labels

Keep labels semantic and lightweight:
- `automation`
- `review`
- `approved`
- `changes-requested`
- `feature`
- `bug`
- `refactor`
- `research`
- `priority::<n>`
- `project::<name>`
- `task::<dex-id>`

Use labels for routing and filtering, not for duplicating what DEX already stores.

## Default workflow

1. **Research** the task first
2. **Create the plan**
3. **Validate the plan** with `@plan-validate`
4. **Create DEX tasks** with `@dex-backlog`
5. **Select the next task** with `@dex-next-task`
6. **Spawn a focused implementation subagent**
7. Build and verify the simplest working version first
8. Record the result in DEX
9. Set the implementation session to **Needs Review**
10. Let automation create a review subagent
11. Have the orchestrator validate the review outcome and decide next action

## Skills in this workflow

Use these skills at the appropriate step:
- `@task-orchestrator` — choose and coordinate the full flow for one task
- `@investigate-first` — investigate and prove the root cause before proposing a fix
- `@plan-validate` — validate a plan before coding
- `@dex-backlog` — convert a validated plan into DEX tasks
- `@dex-next-task` — choose the next DEX task and prepare a focused execution handoff
- `@dex-review` — review one completed implementation session against its linked DEX task
- `@apply-findings` — turn validated findings into a small implementation loop
- `@implementation-review` — compare implementation to a plan and assess completeness
- `@high-signal-review` — run a bug-focused and instruction-focused review pass

## DEX task quality

Every DEX task should include:
- **Why** this task exists
- **What** should change
- **How** to approach it
- **Done when** / verification criteria

## DEX storage

This repository uses repo-local DEX storage in [`.dex/`](./.dex/).
Useful local commands:
- `npm run dex:list`
- `npm run dex -- create "Task name" --description "..."`
- `npm run dex:plan -- <path-to-plan.md>`

## Plan validation standard

When validating a plan:
- preserve the plan itself
- append a **Plan validation (review)** section
- confirm existing patterns, current docs, simplicity, dependency order, and realistic verification
- remove scope creep and unnecessary abstraction before implementation starts
