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
