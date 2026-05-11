# Plan: migrate Systembolaget+ from Manifest V2 to Manifest V3 and replace Parcel with Vite

## Goal

Upgrade the extension to Manifest V3 and move the build pipeline from Parcel 1 to Vite, while preserving the current feature set:
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

## Why switch to Vite now

This repo is currently on:
- `parcel-bundler@1.12.5`
- `parcel-plugin-web-extension-2@2.0.3`

That stack is old and strongly tied to MV2-era extension workflows.

A Vite migration is a good fit because:
- Vite is current and well-supported
- MV3-friendly Chrome extension tooling exists on top of Vite
- it reduces the risk of fighting a legacy Parcel plugin while also doing an MV3 runtime migration
- it gives us a cleaner long-term base for service worker, content script, SCSS, and asset bundling

## Recommended Vite stack

### Preferred build tool choice
Use:
- `vite`
- `@crxjs/vite-plugin`

Why:
- CRXJS is designed specifically for Chrome/browser extensions on top of Vite
- it supports MV3 manifests and service workers cleanly
- it handles extension packaging concerns better than using raw Vite alone
- it fits the repo's scale better than building a custom Rollup/Vite extension pipeline from scratch

### What we should remove
- `parcel-bundler`
- `parcel-plugin-web-extension-2`
- any Parcel-only config or assumptions in scripts

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

## Phase 1 — replace Parcel with a Vite extension build foundation

### 1.1 Add Vite + CRXJS
Add a modern extension build setup based on:
- `vite`
- `@crxjs/vite-plugin`

Likely files to add:
- [vite.config.js](../../vite.config.js) or [vite.config.ts](../../vite.config.ts)
- possibly a root-level extension manifest module if CRXJS benefits from importing it directly

### 1.2 Decide manifest source-of-truth shape
We need to choose one of these patterns:

#### Option A — keep manifest as JSON
- keep a manifest JSON file in repo
- import it into Vite/CRXJS if supported cleanly

#### Option B — move manifest to JS/TS
- define the manifest in `manifest.config.js/ts`
- export the manifest object
- use that object directly in `vite.config`

### Recommendation
Prefer a JS/TS manifest source if it makes asset paths and MV3 fields easier to manage with Vite.
If the JSON import path is clean, keeping JSON is also fine.

### 1.3 Replace npm scripts
Update [package.json](../../package.json) scripts from Parcel to Vite.

Expected shape:
- `dev` or `start` → Vite watch/dev flow suitable for extension development
- `build` → Vite production build

We should keep script naming simple and standard.

### 1.4 Verify output layout
Confirm that the Vite build outputs a Chrome-loadable unpacked extension directory with:
- manifest
- service worker bundle
- content script bundle
- emitted CSS
- icons/locales/assets

### 1.5 Preserve SCSS and static asset behavior
Current extension depends on:
- SCSS stylesheet injection for content scripts
- icons in `src/assets`
- `_locales/en/messages.json`

We need to verify how these map into the Vite/CRXJS output and whether any files should move into a Vite `public/` directory or remain source-imported.

## Phase 2 — convert the manifest from MV2 to MV3

### 2.1 Update the manifest structure
Change [src/manifest.json](../../src/manifest.json) or its Vite-era replacement to:
- `manifest_version: 3`
- replace `background.scripts` with `background.service_worker`
- remove `background.persistent`
- move remote host access into `host_permissions`
- keep `storage` in `permissions`
- keep `content_scripts.matches` only for pages where the content script actually needs to run

### 2.2 Tighten content script matches
Today the content script is declared for:
- `https://www.systembolaget.se/*`
- `https://untappd.com/*`
- `https://distiller.com/*`

Based on current code, the script only injects UI on Systembolaget pages. We should verify whether the extra matches are actually needed. If not, remove them to:
- reduce attack surface
- reduce unnecessary script injection
- simplify review and permission posture

### 2.3 Ensure CRXJS/Vite entry references are correct
Manifest entry paths will need to reflect the Vite source layout, likely pointing at source files rather than Parcel-style output assumptions.

## Phase 3 — replace MV2 background parsing with an MV3-safe architecture

This is the real runtime migration work.

### 3.1 Keep network requests inside the extension
Preferred architecture:
- content script sends a typed message: `{ name, type }`
- service worker derives the target URL internally
- service worker performs `fetch()` with `host_permissions`
- service worker returns normalized rating data

This keeps the current trust boundary mostly intact and avoids adding a server.

### 3.2 Replace `DOMParser` usage in the background flow
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
It best matches the current implementation and the preference to keep logic in-extension.

## Phase 4 — harden message passing and async flow for MV3

### 4.1 Keep listener registration top-level
The current `chrome.runtime.onMessage.addListener(...)` in background is already top-level, which is good. Preserve that pattern in the service worker.

### 4.2 Make message contracts explicit
Replace the current loose `request.name` check with a stricter protocol, for example:
- `type: 'FETCH_RATING'`
- `productType: 'wine' | 'beer' | 'liquor'`
- `name: string`

This is not strictly required for MV3, but it is a good cleanup while touching the messaging layer.

### 4.3 Keep URL construction in the service worker
Do not let the content script send arbitrary URLs. The current code already mostly avoids this by sending `name` and `type`; keep that design.

### 4.4 Normalize Promise/error handling
The current code uses callback-style `sendResponse`. During migration we should decide whether to:
- keep the current pattern with `return true`, or
- move to a small wrapper that makes async request handling clearer

Either is fine as long as the worker stays event-safe and all async paths resolve exactly once.

## Phase 5 — modernize storage and caching while touching the code

### 5.1 Keep cache in `chrome.storage.local`
This already fits MV3 well and does not need server help.

### 5.2 Review cache keys and TTL
Current cache key is the raw product name string.
Current TTL logic is effectively about one month despite variables mentioning a week.

During migration we should:
- make TTL naming accurate
- confirm whether cache should be by normalized product name + type
- handle stale / malformed cache entries defensively

### 5.3 Decide whether caching belongs in the content script or service worker
Current cache is in the content script logic. That works, but while migrating we should evaluate whether the cache should move behind the service worker boundary so:
- fetching + parsing + caching all live in one place
- content script becomes thinner
- duplicated requests across tabs are easier to control

Recommended default:
- move cache ownership to the service worker if it stays small and straightforward
- otherwise leave it where it is for the first MV3 pass to minimize scope

## Phase 6 — align source layout with Vite expectations

### 6.1 Review file organization
Current files are under `src/` with JS and SCSS separated. That is workable, but we may want to restructure slightly for clarity under Vite, for example:
- `src/background/`
- `src/content/`
- `src/offscreen/`
- `src/assets/`

This is optional, but likely worthwhile while touching the build system.

### 6.2 Decide how content script CSS is attached
Current manifest declares `scss/styles.scss` directly as content script CSS.
Under Vite/CRXJS we should choose the cleanest supported pattern, either:
- keep CSS declared through the manifest content script entry, or
- import CSS from the content script entry if that produces the expected injected stylesheet output

We should choose the pattern that is simplest and most reliable with CRXJS.

### 6.3 Verify locales and icons
Confirm `_locales` and icon paths survive the new build without manual copying hacks.

## Phase 7 — test behavior site-by-site

### 7.1 Core smoke tests
- install unpacked MV3 Vite build in Chrome
- confirm service worker starts and receives messages
- confirm content script injects on Systembolaget search results
- confirm content script injects on Systembolaget product pages
- confirm cached results are reused

### 7.2 Source-specific parser tests
For each provider:
- Vivino search returns first valid match
- Untappd search returns first valid match
- Distiller search returns first valid match
- parser tolerates no-result pages
- parser tolerates layout drift without crashing the extension

### 7.3 Vite-specific packaging checks
- content script JS is emitted correctly
- content script CSS is emitted and loaded correctly
- service worker is bundled as MV3-compatible module
- icons and locales are present in the output
- unpacked extension reload flow is reasonable for development

### 7.4 Error-state tests
- rate-limited response from Vivino
- remote site returns unexpected HTML
- network failure / timeout
- storage entry is stale or incomplete

### 7.5 Permission and review checks
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

1. Remove Parcel-specific build dependencies and scripts.
2. Add Vite + `@crxjs/vite-plugin` and create the Vite config.
3. Decide the new manifest source-of-truth format and wire it into CRXJS.
4. Convert the manifest to MV3 format.
5. Introduce a background service worker entry point.
6. Implement an offscreen parsing document and message bridge for HTML parsing.
7. Refactor [src/js/background.js](../../src/js/background.js) into:
   - fetch/orchestration layer in the service worker
   - parser execution in the offscreen document
8. Tighten message protocol between content script and service worker.
9. Decide whether cache remains in [src/js/main.js](../../src/js/main.js) or moves into the service worker.
10. Remove unnecessary host/page matches and minimize permissions.
11. Verify bundling of SCSS, icons, and locales under the new Vite build.
12. Run end-to-end manual testing for wine, beer, and liquor flows.
13. Package and validate the final MV3 extension for Chrome loading/publishing.

## Suggested implementation order

1. Vite/CRXJS build setup
2. Manifest migration
3. Service worker entry setup
4. Offscreen parser document
5. Background fetch/parsing refactor
6. Message protocol cleanup
7. Cache cleanup
8. Permission tightening
9. Manual testing and packaging

## Done when

- Parcel is fully removed from the build path
- extension builds with Vite + CRXJS
- manifest is valid MV3
- background logic runs as a service worker
- cross-origin fetches still work from extension context using `host_permissions`
- HTML parsing works without relying on DOM access inside the service worker
- search page and product page injections both work
- caching still works
- no Netlify/server dependency is required for the normal path
- permissions are no broader than necessary

## Plan validation (review)

### Why Vite is the better move here
- It avoids spending time modernizing an already-outdated Parcel extension stack.
- It gives us an actively-used MV3-friendly toolchain.
- It lowers long-term maintenance risk compared with staying on old Parcel extension plugins.

### Biggest risk
- The runtime MV3 parsing change is still the hardest part.
- CSS/content-script wiring may need small adjustments when moving from Parcel conventions to Vite/CRXJS conventions.

### Best architectural choice for this repo
- **Use Vite + CRXJS for the build pipeline.**
- **Keep requests in the extension.**
- **Use an MV3 service worker for fetch/orchestration.**
- **Use an offscreen document for DOM-based HTML parsing.**
- **Only consider Netlify if extension-origin requests or offscreen parsing fail in practice.**

### Scope control recommendation
Do not add new features during migration. Get a feature-parity MV3 + Vite build working first, then do cleanup/refinement as a second pass.
