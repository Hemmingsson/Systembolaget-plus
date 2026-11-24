![Systembolaget+](https://user-images.githubusercontent.com/1866963/153673968-5236f03e-5752-49ba-86f1-0a6046895614.jpg)

# Systembolaget+

Adds Vivino, Untappd, and Distiller ratings to Systembolaget product pages.

## Build

Use Node.js 22 or later:

```sh
npm ci
npm run build
npm test
```

Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose `dist/`. The source manifest is not a ready-to-load extension. The build targets Chrome 109 or later and uses Manifest V3.

The background worker fetches rating search pages without cookies. The content script parses the returned HTML and caches ratings locally for four weeks. Failed requests remove the pending rating instead of leaving it unresolved.

## Compatibility

Ratings depend on markup from Systembolaget and the three rating services. The automated tests cover request failures, representative parser fixtures, and the built extension. They do not prove that the current external sites still match those fixtures. Live site compatibility remains under investigation in [issue #1](https://github.com/Hemmingsson/Systembolaget-plus/issues/1).

[Agent workflow](docs/dex-craft-workflow.md)
