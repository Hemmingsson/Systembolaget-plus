import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from 'linkedom';
import { fetchRatingHtml, ratingSearchUrl } from '../src/js/background.js';
import { parseRating } from '../src/js/ratings.js';

globalThis.DOMParser = DOMParser;

test('only supported rating searches can be fetched', () => {
  assert.equal(ratingSearchUrl({ name: 'Wine & beer', type: 'wine' }), 'https://www.vivino.com/search/wines?q=Wine%20%26%20beer');
  assert.throws(() => ratingSearchUrl({ name: 'wine', type: 'unsupported' }));
  assert.throws(() => ratingSearchUrl({ name: '', type: 'wine' }));
});

test('network failures and HTTP errors reject instead of hanging', async () => {
  const query = { name: 'test', type: 'beer' };
  await assert.rejects(fetchRatingHtml(query, async () => { throw new Error('offline'); }), /offline/);
  await assert.rejects(fetchRatingHtml(query, async () => ({ ok: false, status: 429 })), /429/);
});

test('rating fetch is anonymous, bounded, and returns HTML to the content script', async () => {
  const html = await fetchRatingHtml({ name: 'test', type: 'liquor' }, async (url, options) => {
    assert.match(url, /^https:\/\/distiller.com\/search/);
    assert.equal(options.credentials, 'omit');
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, text: async () => '<html>test</html>' };
  });
  assert.equal(html, '<html>test</html>');
});

test('wine parser tolerates an absent image and parses decimal commas', () => {
  const data = parseRating('<div class="card"><div class="wine-card__name"><a class="link-color-alt-grey">Test Wine</a></div><div class="wine-card__image-wrapper"><a href="/w/123"></a></div><span class="average__number">4,2</span></div>', 'wine');
  assert.equal(data.rating, '4.2');
  assert.equal(data.url, 'https://www.vivino.com/w/123');
  assert.equal(data.image, undefined);
  assert.equal(data.reviews, undefined);
});

test('beer parser reads the label image src', () => {
  const data = parseRating('<div class="beer-item"><div class="name"><a href="/b/test/1">Test Beer</a></div><div class="brewery">Test Brewery</div><div class="num">(3.8)</div><div class="label"><img src="https://example.com/beer.png"></div></div>', 'beer');
  assert.equal(data.rating, '3.8');
  assert.equal(data.image, 'https://example.com/beer.png');
});

test('missing results and changed rating markup produce a controlled failure', () => {
  assert.throws(() => parseRating('<html></html>', 'wine'), /No rating found/);
  assert.throws(() => parseRating('<div class="card"></div>', 'wine'), /No rating found/);
});

test('the built manifest references existing MV3 extension files', async () => {
  const { readFile, access } = await import('node:fs/promises');
  const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  const files = [manifest.background.service_worker, ...Object.values(manifest.icons), ...manifest.content_scripts.flatMap(script => [...script.js, ...script.css]), '_locales/en/messages.json'];
  for (const file of files) await access(`dist/${file}`);
  const worker = await readFile(`dist/${manifest.background.service_worker}`, 'utf8');
  assert.doesNotMatch(worker, /DOMParser/);
});
