# Chrome DevTools

Chrome DevTools MCP exposes a live Chrome browser for inspection, automation, debugging, screenshots, and performance analysis.

## Scope

Use this source when you need:
- browser automation against real web pages
- network, console, and performance debugging
- DOM inspection and screenshots
- a browser-backed MCP workflow instead of API-only access

## Guidelines

- Treat this source as high-trust: it can inspect and modify browser state
- Prefer it for debugging and browser-specific workflows rather than generic search
- Be careful around authenticated sessions and sensitive page content
- For simple UI navigation, compare with built-in browser tools and choose the lighter option

## Examples

- Inspect failed network requests in a web app
- Capture a screenshot or analyze console errors after a deploy
- Automate a browser flow that requires a real Chrome environment
