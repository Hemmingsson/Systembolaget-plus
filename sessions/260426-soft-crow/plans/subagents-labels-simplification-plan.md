# Plan: Simplify labels and shift the DEX workflow toward orchestrator + subagents

## Goals

1. Make the workflow feel more native to Craft Agents
2. Reduce label clutter and remove unnecessary DEX-prefixed metadata where possible
3. Use one orchestrator session to manage the flow while delegating bounded work to subagents
4. Use automations and labels to inject the right prompts at the right moments
5. Keep context windows smaller by giving subagents narrow instructions and only the relevant context
6. Make research and planning first-class steps before implementation
7. Bias toward the simplest working solution before adding any complexity

## Core operating principles

- **Research first, then plan, then implement**
- **Keep it simple and straightforward**
- **Build the smallest version that works first**
- **Avoid overhead until a real need appears**
- **Prefer existing patterns over new abstractions**
- **Use modern best practices, but only when they reduce complexity or improve correctness**

## Recommended simplifications

### Labels

Simplify the label model to only what helps routing, filtering, and automation.

Keep:
- `automation` — automation-created sessions
- `review`
  - `approved`
  - `changes-requested`
- `feature`
- `bug`
- `refactor`
- `research`
- `priority` (valued)
- `project` (valued)
- `task` (valued string label, replacing `dex-task`)

Remove:
- `dex`
- `task-type` parent
- `research-task`
- `dex-task`
- label groups that exist only to mirror DEX branding rather than support filtering

Rationale:
- You only use DEX, so the label should describe the semantic role, not the backing system
- `task::<id>` is enough as a routing handle
- task type labels should be direct and filterable, not hidden behind an extra category unless you really need that hierarchy

## Workflow redesign

### Core model

Use an **orchestrator session** as the manager of the full task lifecycle.

The orchestrator:
- researches the idea first
- creates or refines the plan
- validates simplicity and existing patterns
- creates or updates DEX tasks
- spawns narrowly-scoped subagent sessions
- reviews/validates subagent output
- decides whether to mark work done, send back changes, or create follow-up tasks

Subagents should be used for bounded steps such as:
- research
- plan validation
- backlog extraction
- implementation of one task
- review of one completed task
- documentation or cleanup work

### Session roles via labels

Use labels to clarify role rather than system origin:
- `automation` for sessions created by automations
- `review` for review sessions
- `feature` / `bug` / `refactor` / `research` for work type
- `task::<id>` to link any session to the DEX task it belongs to

Optional later if useful:
- `orchestrator`
- `subagent`

But only add them if they prove operationally useful after testing.

## Research-first flow

Before implementation, the orchestrator should run this sequence:

### Step 1: Research the idea

For any non-trivial task, research before planning.

The orchestrator should:
- inspect the local codebase for existing patterns
- use **Context7** when available for framework and library best practices
- use **web search** for current documentation, examples, APIs, syntax, and latest best practices
- check official docs for browser APIs, CSS, framework syntax, and integration details
- look for the simplest proven implementation pattern already in use elsewhere

Research should answer:
- is there already a similar implementation in this repo?
- is there a built-in API or framework feature we should use instead of custom code?
- what is the simplest modern approach that is correct today?
- what syntax or browser API details may have changed recently?

### Step 2: Create the plan

After research, create a plan that is:
- simple
- direct
- minimal in scope
- ordered into testable chunks
- explicit about verification

Each plan chunk should include:
- **Why**
- **What**
- **How**
- **Verification**

### Step 3: Validate the plan

Before implementation, validate the plan for:
- simplicity
- reuse of existing patterns
- latest syntax and API correctness
- realistic verification methods
- correct dependency order
- absence of scope creep

### Step 4: Create DEX tasks

Only after validation should the orchestrator convert the plan into DEX tasks/subtasks.

## Automation redesign

### Keep one important status-based automation

When a session moves to `needs-review` and has `task::<id>`:
- create a review session
- inject a prompt that tells the review session to:
  - inspect the linked implementation session
  - inspect the linked DEX task
  - validate claimed work against scope and evidence
  - update the original session to `done` or back to `todo`

### Add label-driven prompt injection

Use `LabelAdd` automations for lightweight workflow nudges.

Recommended automations:

1. `LabelAdd` on `review`
   - prompt session with the review checklist and scope guardrails

2. `LabelAdd` on `feature|bug|refactor|research`
   - prompt session to classify the task and confirm the correct DEX context/result structure

3. `LabelAdd` on `automation`
   - prompt the spawned session to behave as a narrow-purpose helper and avoid taking on orchestration responsibilities

4. `LabelAdd` on `task`
   - if the platform reliably exposes valued labels in matchers/workflows, inject a “read linked task first” prompt

## Skill updates

Revise the skills so they explicitly support orchestrator/subagent behavior.

### `plan-validate`
- should be a narrow review skill
- output only the validated plan section updates
- avoid implementation work
- explicitly require checking Context7 and current web docs when relevant

### `dex-backlog`
- reposition as “extract validated plan into DEX tasks”
- remind the caller to delegate one executable chunk at a time
- require testable, minimal subtasks

### `dex-next-task`
- should recommend spawning a subagent for actual implementation once the next task is selected
- should set up the expected labels/status for the implementation session
- should remind the subagent to build the simplest working version first

### `dex-review`
- should assume it is often run inside an automation-created review subagent
- should validate implementation against DEX context and session evidence
- should update the original session rather than continuing implementation itself

### AGENTS.md updates
- describe the research → plan → validate → backlog → implement → review sequence explicitly
- describe the orchestrator pattern explicitly
- explain when to spawn a subagent vs work inline
- document the clean label set and automation-driven flow
- reinforce: simple code first, no unnecessary overhead

## Validation and test plan

After implementation:
1. validate labels config
2. validate automations config
3. validate all updated skills
4. run a live end-to-end flow using `task::<id>` instead of `dex-task::<id>`
5. verify that review automation still spawns correctly
6. verify label-driven automations inject the expected prompts
7. verify the updated instructions push agents toward research-first and simplest-working-solution behavior

## Implementation order

1. simplify labels
2. update automations to use the simplified labels
3. update skills to instruct research-first and orchestrator/subagent behavior
4. update AGENTS.md
5. validate configs and skills
6. run end-to-end test

## Expected result

A cleaner Craft-native workflow where:
- DEX remains the task backbone
- labels stay semantic and minimal
- the orchestrator researches first, then plans, then delegates
- subagents handle narrow tasks with small context
- automations reinforce the workflow instead of relying on one large session to do everything
- plans and implementations stay simple, direct, and current with modern docs and APIs
