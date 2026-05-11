# Plan: Create `chrome-extension-mv2-to-mv3` skill

## Goal
Create a reusable skill that guides Craft Agent through converting a Chrome extension from Manifest V2 to Manifest V3 with strong emphasis on:
- official Chrome rules
- security restrictions
- service worker architecture
- permission changes
- declarativeNetRequest migration
- packaging and review-readiness

## Why this skill needs to exist
Manifest V2 → V3 migration is **not** a simple manifest version bump. The agent needs deep instructions for:
- replacing background pages with extension service workers
- avoiding DOM access in background logic
- moving host patterns into `host_permissions`
- converting `browser_action` / `page_action` to `action`
- replacing `tabs.executeScript` / `tabs.insertCSS` with `chrome.scripting`
- converting callback-heavy code to promises where supported
- removing `getBackgroundPage()` style assumptions
- replacing blocking `webRequest` listeners with `declarativeNetRequest` where applicable
- eliminating remote hosted code and unsafe string execution (`eval`, `new Function`, injected code strings)
- updating CSP to MV3 format
- recognizing when offscreen documents or sandboxed iframes are needed

## Proposed slug
`chrome-extension-mv2-to-mv3`

## Proposed files
- `/Users/mattias/Documents/GitHub/Systembolaget-plus/skills/chrome-extension-mv2-to-mv3/SKILL.md`
- `/Users/mattias/Documents/GitHub/Systembolaget-plus/skills/chrome-extension-mv2-to-mv3/icon.svg`

## Proposed icon
Use an SVG showing:
- a puzzle piece / browser extension motif
- two arrows or an upgrade badge
- optional small shield to imply security hardening

## Proposed SKILL.md

```markdown
---
name: "Chrome Extension MV2 to MV3 Migration"
description: "Audit and convert a Chrome extension from Manifest V2 to Manifest V3, covering manifest changes, service workers, API replacements, security rules, and Chrome Web Store compliance risks."
---

# Chrome Extension MV2 to MV3 Migration

You are migrating a Chrome extension from Manifest V2 to Manifest V3.

Your job is not only to change files, but to ensure the extension conforms to modern Chrome extension architecture, security restrictions, and review expectations.

## Primary objectives

1. Preserve current user-facing behavior unless the user explicitly requests redesign.
2. Migrate to Manifest V3 with minimal new permissions.
3. Replace deprecated or unsupported APIs.
4. Remove patterns that violate MV3 security rules.
5. Leave a clear migration summary and risk list.

## Operating principles

- Treat migration as an **audit + refactor**, not a search/replace.
- Prefer official Chrome extension architecture and current platform guidance.
- Do not add new product features during migration unless requested.
- Minimize permission prompts and review risk.
- When uncertain, preserve behavior with the least privilege possible.

## First-pass audit checklist

Before editing, inspect:
- `manifest.json`
- the build toolchain and generated manifest assumptions
- background scripts or event pages
- popup/options/devtools pages
- content scripts
- dynamic script/style injection code
- any `chrome.webRequest` listeners
- any use of remote JS/CSS/Wasm/CDN assets
- any use of `eval`, `new Function`, or injected code strings
- any references to:
  - `chrome.browserAction`
  - `chrome.pageAction`
  - `chrome.extension.*`
  - `chrome.tabs.executeScript`
  - `chrome.tabs.insertCSS`
  - `chrome.tabs.removeCSS`
  - `chrome.runtime.getBackgroundPage`
  - `chrome.extension.getBackgroundPage`
  - callback-only async flows that can become promise-based

## Required manifest migration rules

### 1) Set Manifest V3
Change:
- `"manifest_version": 2` → `"manifest_version": 3`

### 2) Split host permissions from API permissions
In MV3:
- keep API permissions in `permissions`
- move URL match patterns into `host_permissions`
- move optional host patterns into `optional_host_permissions`

Important:
- `content_scripts[].matches` stays under `content_scripts`
- do not leave hosts mixed into `permissions`

### 3) Replace action fields
Convert:
- `browser_action` → `action`
- `page_action` → `action`

Also replace code usage:
- `chrome.browserAction.*` / `chrome.pageAction.*` → `chrome.action.*`

If old behavior depended on page-action visibility:
- consider `chrome.action.enable()` / `disable()` per tab
- or emulate page-action behavior with declarative logic if needed

### 4) Update background definition
Manifest V3 uses:
- `background.service_worker`
- optionally `background.type: "module"` when ES modules are needed

Remove MV2-only concepts:
- persistent background pages
- event pages as HTML-backed background contexts

### 5) Update web accessible resources format
Convert from a flat array to MV3 objects:
- `resources`
- `matches` and/or `extension_ids`
- optionally `use_dynamic_url`

Do not overexpose resources. Restrict matches as tightly as possible.

### 6) Update CSP format
MV3 requires `content_security_policy` to be an object, typically with:
- `extension_pages`
- optional `sandbox`

Do not use insecure CSP values that allow remote code execution in extension pages.

## Background page → service worker migration

Manifest V3 background logic runs in an **extension service worker**.

### Service worker constraints
Assume all of the following:
- no DOM access
- no `window`
- no long-lived in-memory state guarantees
- worker can be suspended when idle
- event-driven architecture is required

### Migration rules

#### Move background code into event-driven handlers
Prefer listeners such as:
- `chrome.runtime.onInstalled`
- `chrome.runtime.onStartup`
- `chrome.action.onClicked`
- `chrome.tabs.*`
- `chrome.runtime.onMessage`
- alarms, notifications, commands, context menus, etc.

#### Persist important state
Do not rely on globals surviving forever.
Persist state using:
- `chrome.storage.local`
- `chrome.storage.sync` if appropriate
- IndexedDB if necessary

#### Register listeners at top level
Listeners should be declared at module top level so they exist when the worker starts.

#### Replace timers and background loops thoughtfully
Long-running polling/background loops often need redesign using:
- alarms
- storage-backed checkpoints
- explicit event triggers
- short-lived async work

### DOM-dependent background logic
If former background code used DOM APIs, canvas, audio, or document APIs:
- move that work to an extension page or offscreen document
- keep orchestration in the service worker

Use an **offscreen document** when you need hidden DOM access but not a visible UI.

If you use an offscreen document:
- add the `"offscreen"` permission
- create a bundled static HTML file for it
- communicate with it through `chrome.runtime` messaging
- remember that offscreen documents do not expose the full extension API surface

## API migration rules

### Script and CSS injection
Replace:
- `chrome.tabs.executeScript` → `chrome.scripting.executeScript`
- `chrome.tabs.insertCSS` → `chrome.scripting.insertCSS`
- `chrome.tabs.removeCSS` → `chrome.scripting.removeCSS`

Manifest requirements:
- add `"scripting"` permission
- also require host permissions or `activeTab`

Migration notes:
- `files` is an array in MV3
- target tab goes under `target: { tabId }`
- when old code injected string snippets, prefer `func` + `args` or bundled files

### Replace background-page assumptions
Replace or redesign calls such as:
- `chrome.runtime.getBackgroundPage()`
- `chrome.extension.getBackgroundPage()`
- `chrome.extension.getExtensionTabs()`

Use message passing instead:
- `chrome.runtime.sendMessage`
- `chrome.runtime.onMessage`
- long-lived ports only when truly needed

### Replace deprecated namespace usage
Prefer `chrome.runtime.*` over `chrome.extension.*`.

Examples:
- `chrome.extension.sendMessage` → `chrome.runtime.sendMessage`
- `chrome.extension.getURL` → `chrome.runtime.getURL`
- `chrome.extension.onRequest` → `chrome.runtime.onMessage`

### Promises
Where Chrome APIs support promises:
- remove callback arguments
- use `await` / promise chains
- do not mix callback and promise styles in the same call

## Network request migration rules

### If the extension uses blocking `webRequest`
MV3 generally requires replacing blocking interception/modification with `declarativeNetRequest` (DNR).

Audit for:
- `onBeforeRequest`
- `onBeforeSendHeaders`
- `onHeadersReceived`
- redirect/cancel/modify-header logic
- `webRequestBlocking`

### DNR conversion approach
Reframe behavior as declarative rules:
- `block`
- `redirect`
- `modifyHeaders`
- static rulesets
- dynamic/session rules where appropriate

Manifest changes commonly include:
- remove `webRequestBlocking`
- add `declarativeNetRequest` or `declarativeNetRequestWithHostAccess` as needed
- move hosts into `host_permissions` where required
- add `declarative_net_request.rule_resources`

Important nuance:
- if the extension is enterprise policy-installed, `webRequestBlocking` may still be allowed
- otherwise, assume DNR migration is required

Do not do a superficial API rename. Rewrite behavior around DNR capabilities and limitations.

## Security and store-compliance rules

### Remote hosted code is not allowed for extension logic
Remove or replace:
- remote JavaScript from your own server
- CDN-hosted executable libraries used by extension pages/worker
- remote Wasm used as extension logic
- libraries that fetch executable code dynamically

Allowed pattern:
- bundle executable code locally in the extension package
- fetch remote **data/configuration**, not remote executable logic

### Ban unsafe code execution
Eliminate or redesign uses of:
- `eval()`
- `new Function()`
- code strings passed for execution

Preferred replacements:
- bundled files
- `chrome.scripting.executeScript({ files: [...] })`
- `chrome.scripting.executeScript({ func, args })`
- sandboxed iframe only if truly necessary and appropriate

### CSP hardening
Ensure extension page CSP does not permit unsafe remote execution.
Use MV3-compatible values only.
Be especially careful with:
- `script-src`
- `object-src`
- `worker-src`

### Third-party libraries
If libraries were loaded from CDNs:
- vendor them locally
- verify licensing and build footprint
- import them from local extension files

## HTML and page migration rules

Check extension pages for:
- inline scripts
- inline event handlers (`onclick`, etc.)
- script tags referencing remote URLs
- assumptions about background page globals

Preferred fixes:
- move scripts into dedicated JS files
- attach events from JS, not inline HTML attributes
- use message passing to communicate with the service worker

## Permissions review guidance

After migration:
- compare old vs new permissions
- remove anything no longer necessary
- prefer `activeTab` over broad host access when feasible
- use optional permissions where a feature is user-triggered
- call out any permission warning changes explicitly

## Testing expectations

After edits, verify at minimum:
1. extension loads without manifest errors
2. service worker starts correctly
3. action/popup/options pages still work
4. content scripts still inject where expected
5. storage/state survives worker restarts when needed
6. request blocking/redirect/header logic still behaves correctly
7. there is no remote executable code left
8. there are no unsafe eval-like patterns left
9. Chrome Web Store review risk areas are documented

## Expected deliverables

When completing a migration, provide:
1. a summary of manifest changes
2. a list of API replacements
3. a list of architectural rewrites
4. a security/compliance summary
5. any remaining manual follow-ups or risks

## Preferred response structure

Use this structure when reporting work:

### MV2 → MV3 audit
- Findings by file/component

### Required manifest changes
- Exact fields added/removed/rewritten

### Code migration changes
- Background/service worker
- Action API
- Scripting API
- Messaging
- Storage/lifecycle

### Security and compliance
- Remote code removal
- CSP changes
- Unsafe execution removal

### Open risks / manual verification
- Anything that still needs browser validation or product decisions

## Red flags that require extra care

Escalate and explain carefully if you find:
- heavy reliance on persistent background state
- complex blocking `webRequest` logic that may not map perfectly to DNR
- dynamic code generation or plugin systems
- remote script/CDN architecture
- background DOM/audio/canvas workflows
- inline-script-heavy legacy UI pages
- mixed Chrome/Firefox extension code paths

## Non-goals

Do not:
- silently broaden permissions
- add unrelated features
- leave partially migrated MV2 APIs behind
- assume a service worker can behave like a persistent background page
- keep remote executable code just because it still works in development

## Quality bar

A successful migration means:
- the extension is structurally MV3-native
- major MV2 compatibility risks are eliminated
- the result is more likely to pass Chrome Web Store review
- the user receives a clear explanation of what changed and why
```

## Implementation steps when edit mode is enabled
1. Create the folder at `/Users/mattias/Documents/GitHub/Systembolaget-plus/skills/chrome-extension-mv2-to-mv3/`
2. Write the proposed `SKILL.md`
3. Add `icon.svg`
4. Run skill validation for slug `chrome-extension-mv2-to-mv3`
5. If validation passes, report the created skill and any wording tweaks worth considering

## Reference basis used for this draft
- Chrome official migration overview
- Chrome official manifest migration guidance
- Chrome official service worker guidance
- Chrome official API migration guidance
- Chrome official blocking web request → DNR guidance
- Chrome official MV3 security guidance

## Plan validation (review)

### Review scope
This review validated the plan against the current repository, official Chrome MV3 guidance, and the existing extension build setup. No implementation code was changed.

### Existing patterns found in this codebase

#### Repository patterns
- There are currently no existing workspace skills to reuse or mirror under `/Users/mattias/Documents/GitHub/Systembolaget-plus/skills/`.
- The project is a small Parcel-based browser extension with a direct source layout under `/Users/mattias/Documents/GitHub/Systembolaget-plus/src/`.

#### Current extension architecture
Files reviewed:
- `/Users/mattias/Documents/GitHub/Systembolaget-plus/src/manifest.json`
- `/Users/mattias/Documents/GitHub/Systembolaget-plus/src/js/background.js`
- `/Users/mattias/Documents/GitHub/Systembolaget-plus/src/js/extension.js`
- `/Users/mattias/Documents/GitHub/Systembolaget-plus/src/js/main.js`
- `/Users/mattias/Documents/GitHub/Systembolaget-plus/package.json`

Confirmed current patterns:
- The extension is currently MV2: `manifest_version: 2`.
- It uses a non-persistent background script via `background.scripts` + `persistent: false`.
- It already uses `chrome.runtime.onMessage` and `chrome.runtime.sendMessage` for communication.
- It uses callback-based `chrome.storage.local` access.
- It performs DOM-dependent parsing in `background.js` using `DOMParser`, which is important because MV3 service workers do not have DOM access.
- The build toolchain uses Parcel plus `parcel-plugin-web-extension-2`.

Confirmed patterns **not** currently present in this codebase:
- No `browser_action` or `page_action`
- No `chrome.tabs.executeScript`, `insertCSS`, or `removeCSS`
- No `chrome.webRequest` / `webRequestBlocking`
- No `eval()` / `new Function()`
- No remote hosted script tags or CDN-loaded extension logic in reviewed files
- No `web_accessible_resources`
- No explicit `content_security_policy`

### Best-practice validation

#### Official Chrome guidance confirmed
The core plan aligns with official Chrome documentation on:
- splitting API permissions from `host_permissions`
- replacing background pages with extension service workers
- migrating injection code to `chrome.scripting`
- using DNR only when blocking `webRequest` behavior actually exists
- removing remote hosted code and unsafe string execution
- using MV3 CSP object syntax

#### Offscreen-document guidance confirmed
Official Chrome documentation confirms that offscreen documents are the right fallback when former background logic needs DOM APIs. It also confirms important constraints that the plan now captures explicitly:
- `"offscreen"` permission is required
- the offscreen page must be a bundled static HTML file
- communication is done through `chrome.runtime`
- offscreen documents do not provide the normal full extension API surface

#### Build-tooling validation
The current project depends on `parcel-plugin-web-extension-2`. Its published README documents MV2-era manifest keys such as:
- `background.scripts`
- `background.page`
- `browser_action`
- `page_action`

That does **not** automatically mean the toolchain blocks MV3, but it is a strong signal that migration work should audit the bundler and generated manifest assumptions before changing runtime code. This is why the plan now explicitly includes build-toolchain review in the first-pass audit.

### Simplicity review

#### What is appropriately simple
- The plan stays focused on a single skill.
- The skill content is audit-first, which is the correct simple shape for MV2 → MV3 work.
- Most migration sections are already conditional, which prevents unnecessary rewrites.
- The plan does not force DNR, action API, or scripting API changes unless the audited extension actually uses those features.

#### What was simplified during review
- Removed broad `globs` from the proposed skill. They were likely to over-trigger on unrelated JavaScript/HTML work and are not required for an explicitly invoked migration skill.
- Removed `alwaysAllow: ["Bash"]`. This was broader than necessary for a documentation-heavy skill and added permission surface without a clear need.
- Kept the rest of the skill content intact because the domain itself genuinely requires detailed guidance.

### Review against this codebase

#### Problems that clearly exist here
- MV2 manifest format
- background script architecture that will need service-worker treatment
- DOM-dependent background parsing that likely needs redesign for MV3
- callback-heavy Chrome API usage that may be modernized where promise support exists
- possible build-pipeline risk due to MV2-oriented extension tooling

#### Plan items that are valid but conditional here
These should remain in the skill because they are common MV2→MV3 concerns, but they are **not** triggered by the current codebase unless discovered during a future audit:
- `browser_action` / `page_action` → `action`
- `tabs.executeScript` / CSS injection → `chrome.scripting`
- blocking `webRequest` → DNR
- `web_accessible_resources` migration
- CSP migration work beyond adding it if needed

This is an important simplicity guardrail: the skill should instruct the agent to apply only the sections that the target extension actually uses.

### Dependency-order validation
The simplest correct execution order for the future migration work is:
1. Audit source files and build pipeline
2. Update manifest structure and permissions model
3. Decide background-service-worker architecture
4. Handle DOM-dependent background work via extension page or offscreen document only if needed
5. Apply API-specific migrations only where the old APIs are present
6. Perform security cleanup
7. Verify build output, extension load, and behavior

This order is simpler than jumping directly into API rewrites because it catches tooling and lifecycle constraints first.

### Verification-method validation
The verification guidance in the skill is directionally correct, but the most reliable checks should be interpreted as:
- confirm the built/generated manifest is MV3-valid, not only the source manifest
- confirm the extension loads unpacked without manifest errors
- confirm the service worker registers and responds to messaging
- confirm storage-backed behavior still works after worker restarts
- search the final codebase for forbidden/legacy patterns such as `background.scripts`, `webRequestBlocking`, `browser_action`, `page_action`, `eval(`, and remote executable URLs
- verify any offscreen-document flow by confirming document creation plus runtime messaging

These are testable and directly tied to the actual failure modes of MV3 migrations.

### Final validation summary

#### Green flags
- Strong official-doc basis
- Focused on real MV3 migration risks
- No unnecessary feature work
- Good emphasis on security and store compliance
- Now improved to account for build tooling and offscreen constraints

#### Red flags to keep watching during implementation
- Build tooling may be more MV2-oriented than the source code suggests
- DOM work inside `background.js` is a real migration hotspot
- The skill must remain audit-driven so it does not apply irrelevant migration steps

#### Verdict
The plan is valid and appropriately detailed for this domain. After simplification, it remains thorough without obvious scope creep. The main execution guardrail is: **audit first, then apply only the migration sections that the target extension actually needs.**
