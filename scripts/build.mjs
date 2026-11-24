import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { compile } from 'sass';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/styles', { recursive: true });
await cp('src/assets', 'dist/assets', { recursive: true });
await cp('static/_locales', 'dist/_locales', { recursive: true });
await build({
  entryPoints: ['src/js/extension.js', 'src/js/background.js'],
  outdir: 'dist/scripts', bundle: true, format: 'iife', target: 'chrome109',
  minify: true,
});
await writeFile('dist/styles/styles.css', compile('src/scss/styles.scss', { style: 'compressed' }).css);
const manifest = JSON.parse(await readFile('src/manifest.json', 'utf8'));
await writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
