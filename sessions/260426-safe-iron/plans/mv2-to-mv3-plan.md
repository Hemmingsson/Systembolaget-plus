# Plan: migrate Systembolaget+ from Manifest V2 to Manifest V3

## Goal

Upgrade the extension to Manifest V3 while preserving the current feature set:
- inject ratings into Systembolaget product and search pages
- fetch rating/search data from Vivino, Untappd, and Distiller
- cache responses locally
- avoid introducing a server dependency unless MV3 or target-site behavior makes it unavoidable

## What the current codebase does

### Current architecture
- Manifest file: [src/manifest.json](../../src/manifest.json)
- Background script: [src/js/background.js](../../src/js/background.js)
- Content script bootstrap: [src/js/extension.js](../../src/js/extension.js)
- Content script logic: [src/js/main.js](../../src/js/main.js)
- Styles: [src/scss/styles.scss](../../src/scss/styles.scss)
- Build tooling: [package.json](../../package.json)

### Current MV2-specific setup
- `manifest_version: 2`
- background event page via:
  - `background.scripts`
  - `background.persistent: false`
- host access for Vivino is mixed into `permissions`
- build pipeline is based on Parcel 1 + `parcel-plugin-web-extension-2`

### Current runtime flow
1. Content script runs on Systembolaget pages.
2. It finds product cards / product detail pages and asks the background script for ratings data.
3. Background script builds a search URL for Vivino / Untappd / Distiller.
4. Background script performs cross-origin `fetch()`.
5. Background script parses returned HTML and replies with normalized data.
6. Content script caches results in `chrome.storage.local` and updates the page UI.

## Key MV3 constraints that affect this extension

### 1) Background page becomes a service worker
The current background script must move to `background.service_worker`.

### 2) Cross-origin requests should stay in the extension context
In MV3, content scripts are still subject to the page origin's same-origin policy. That means the current architecture of doing remote fetches from the extension background context is still the right direction.

### 3) Service workers cannot access the DOM
This is the biggest code-level blocker for this repo.
The current background script uses `DOMParser()` plus `querySelector()` against fetched HTML. That does **not** map directly to an MV3 service worker.

### 4) Service workers are ephemeral
Any logic that depends on in-memory state, delayed timers, or lazy listener registration would need changes. This repo is in decent shape here because:
- no important global mutable state is kept in background memory
- listener registration is already top-level
- no background `setInterval()` / `setTimeout()` is used for critical work

### 5) Host permissions must be explicit
Cross-origin hosts should move from `permissions` to `host_permissions`.

## Recommended migration strategy

## Phase 1 — move manifest and build pipeline to MV3-compatible foundations

### 1.1 Update the manifest structure
Change [src/manifest.json](../../src/manifest.json) to:
- `manifest_version: 3`
- replace `background.scripts` with `background.service_worker`
- remove `background.persistent`
- move remote host access into `host_permissions`
- keep `storage` in `permissions`
- keep `content_scripts.matches` only for pages where the content script actually needs to run

### 1.2 Tighten content script matches
Today the content script is declared for:
- `https://www.systembolaget.se/*`
- `https://untappd.com/*`
- `https://distiller.com/*`

Based on current code, the script only injects UI on Systembolaget pages. We should verify whether the extra matches are actually needed. If not, remove them to:
- reduce attack surface
- reduce unnecessary script injection
- simplify review and permission posture

### 1.3 Replace the legacy Parcel 1 extension build setup
Current stack:
- `parcel-bundler@1.12.5`
- `parcel-plugin-web-extension-2@2.0.3`

This is a migration risk. The plugin name and dependency tree indicate a Manifest V2-era setup. The safer plan is to migrate the build to a modern MV3-capable pipeline before or during the manifest migration.

Preferred path:
- move to Parcel 2 with `@parcel/config-webextension`
- add a `.parcelrc` extending `@parcel/config-webextension`
- update `start` / `build` scripts accordingly

Fallback if Parcel migration is messier than expected:
- switch to Vite or another modern extension-oriented bundler

But the default plan should stay with Parcel unless the repo proves that migration cost is too high.

## Phase 2 — replace MV2 background parsing with an MV3-safe architecture

This is the real implementation work.

### 2.1 Keep network requests inside the extension
Preferred architecture:
- content script sends a typed message: `{ name, type }`
- service worker derives the target URL internally
- service worker performs `fetch()` with `host_permissions`
- service worker returns normalized rating data

This keeps the current trust boundary mostly intact and avoids adding a server.

### 2.2 Replace `DOMParser` usage in the background flow
Current blocker in [src/js/background.js](../../src/js/background.js):
- fetch HTML
- `new DOMParser()`
- `querySelector()` parsing

We need one of these approaches:

#### Preferred option A — offscreen document for DOM parsing
Use an MV3 offscreen document dedicated to HTML parsing.

How it would work:
1. service worker fetches raw HTML from Vivino / Untappd / Distiller
2. service worker sends `{ html, parserType }` to an offscreen document
3. offscreen document uses `DOMParser` and the existing selector logic
4. offscreen document returns normalized data back to the service worker
5. service worker replies to the content script

Why this is preferred:
- keeps everything inside the extension
- preserves the current parsing model with minimal selector rewrites
- aligns with MV3 platform capabilities instead of introducing infrastructure

Tradeoffs:
- more moving parts than the current background page
- requires careful lifecycle and message handling

#### Option B — replace DOM parsing with a pure JS HTML parser library
Possible if we want to avoid offscreen documents.

Pros:
- everything stays in the service worker
- potentially simpler runtime model

Cons:
- likely requires rewriting selectors/parsers
- increases bundle size and dependency surface
- may be less robust than browser-native DOM parsing for these sites

### Recommendation
Start with **offscreen document parsing**, not Netlify functions.
It best matches the current implementation and the user's preference to keep logic in-extension.

## Phase 3 — harden message passing and async flow for MV3

### 3.1 Keep listener registration top-level
The current `chrome.runtime.onMessage.addListener(...)` in background is already top-level, which is good. Preserve that pattern in the service worker.

### 3.2 Make message contracts explicit
Replace the current loose `request.name` check with a stricter protocol, for example:
- `type: 'FETCH_RATING'`
- `productType: 'wine' | 'beer' | 'liquor'`
- `name: string`

This is not strictly required for MV3, but it is a good cleanup while touching the messaging layer.

### 3.3 Keep URL construction in the service worker
Do not let the content script send arbitrary URLs. The current code already mostly avoids this by sending `name` and `type`; keep that design.

### 3.4 Normalize Promise/error handling
The current code uses callback-style `sendResponse`. During migration we should decide whether to:
- keep the current pattern with `return true`, or
- move to a small wrapper that makes async request handling clearer

Either is fine as long as the worker stays event-safe and all async paths resolve exactly once.

## Phase 4 — modernize storage and caching while touching the code

### 4.1 Keep cache in `chrome.storage.local`
This already fits MV3 well and does not need server help.

### 4.2 Review cache keys and TTL
Current cache key is the raw product name string.
Current TTL logic is effectively about one month despite variables mentioning a week.

During migration we should:
- make TTL naming accurate
- confirm whether cache should be by normalized product name + type
- handle stale / malformed cache entries defensively

### 4.3 Decide whether caching belongs in the content script or service worker
Current cache is in the content script logic. That works, but while migrating we should evaluate whether the cache should move behind the service worker boundary so:
- fetching + parsing + caching all live in one place
- content script becomes thinner
- duplicated requests across tabs are easier to control

Recommended default:
- move cache ownership to the service worker if it stays small and straightforward
- otherwise leave it where it is for the first MV3 pass to minimize scope

## Phase 5 — verify assets, styles, and packaging under MV3

### 5.1 Confirm CSS/content script bundling still works
Current manifest references:
- `scss/styles.scss`
- `js/extension.js`

This relies on bundler behavior. After moving to a modern MV3 build, verify that:
- content script JS is emitted correctly
- SCSS is emitted and referenced correctly
- icons and other static assets still land in the output package

### 5.2 Verify no extra `web_accessible_resources` are needed
The current code appears to use inline SVG and remote images from fetched data. It may not need explicit `web_accessible_resources`, but we should confirm after the bundler change.

### 5.3 Verify extension package layout for Chrome Web Store upload
The final build should produce a loadable unpacked extension and a zip-ready output directory without MV2-era artifacts.

## Phase 6 — test behavior site-by-site

### 6.1 Core smoke tests
- install unpacked MV3 build in Chrome
- confirm service worker starts and receives messages
- confirm content script injects on Systembolaget search results
- confirm content script injects on Systembolaget product pages
- confirm cached results are reused

### 6.2 Source-specific parser tests
For each provider:
- Vivino search returns first valid match
- Untappd search returns first valid match
- Distiller search returns first valid match
- parser tolerates no-result pages
- parser tolerates layout drift without crashing the extension

### 6.3 Error-state tests
- rate-limited response from Vivino
- remote site returns unexpected HTML
- network failure / timeout
- storage entry is stale or incomplete

### 6.4 Permission and review checks
- verify final permission prompts are minimal and understandable
- verify only required hosts are declared
- verify no remote code or MV3 CSP violations are introduced

## When Netlify functions would be justified

We should **not** start with Netlify functions.

Netlify becomes worth considering only if one of these happens:
1. target sites block extension-origin requests or aggressively challenge them in MV3
2. offscreen parsing proves too fragile or too complex for the needed HTML parsing
3. we want a central parser that can be updated server-side when page structures change
4. rate limiting is materially better from a server origin than from client extensions

If we ever need that fallback, the clean design would be:
- extension sends `{ name, type }` to one controlled endpoint
- Netlify function performs fetch + parse server-side
- extension receives normalized JSON only

But that should be treated as a **fallback architecture**, not the default migration target.

## Concrete task list

1. Audit the current extension for MV2-only manifest and build assumptions.
2. Upgrade the build pipeline from Parcel 1 + `parcel-plugin-web-extension-2` to a modern MV3-capable setup.
3. Convert [src/manifest.json](../../src/manifest.json) to MV3 format.
4. Introduce a background service worker entry point.
5. Implement an offscreen parsing document and message bridge for HTML parsing.
6. Refactor [src/js/background.js](../../src/js/background.js) into:
   - fetch/orchestration layer in the service worker
   - parser execution in the offscreen document
7. Tighten message protocol between content script and service worker.
8. Decide whether cache remains in [src/js/main.js](../../src/js/main.js) or moves into the service worker.
9. Remove unnecessary host/page matches and minimize permissions.
10. Verify bundling of SCSS, icons, and static locales under the new build.
11. Run end-to-end manual testing for wine, beer, and liquor flows.
12. Package and validate the final MV3 extension for Chrome loading/publishing.

## Suggested implementation order

1. Build tooling migration
2. Manifest migration
3. Service worker entry setup
4. Offscreen parser document
5. Background fetch/parsing refactor
6. Message protocol cleanup
7. Cache cleanup
8. Permission tightening
9. Manual testing and packaging

## Done when

- extension builds with an MV3-compatible toolchain
- manifest is valid MV3
- background logic runs as a service worker
- cross-origin fetches still work from extension context using `host_permissions`
- HTML parsing works without relying on DOM access inside the service worker
- search page and product page injections both work
- caching still works
- no Netlify/server dependency is required for the normal path
- permissions are no broader than necessary

## Plan validation (review)

### What looks simple and safe
- The extension is small, so the migration is very feasible.
- Messaging and storage patterns are already close to MV3-friendly.
- The biggest problem is isolated to one place: HTML parsing inside background logic.

### Biggest risk
- The outdated Parcel 1 extension toolchain may become the first blocker, even before MV3 runtime changes.
- Remote site markup drift may show up while touching the parser layer.

### Best architectural choice for this repo
- **Keep requests in the extension.**
- **Use an MV3 service worker for fetch/orchestration.**
- **Use an offscreen document for DOM-based HTML parsing.**
- **Only consider Netlify if extension-origin requests or offscreen parsing fail in practice.**

### Scope control recommendation
Do not add new features during migration. Get a feature-parity MV3 build working first, then do cleanup/refinement as a second pass.
