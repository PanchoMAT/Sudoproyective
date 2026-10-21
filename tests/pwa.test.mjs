import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
const pwaCode = fs.readFileSync(new URL('../js/pwa.js', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const puzzles = fs.readFileSync(new URL('../js/puzzles.js', import.meta.url), 'utf8');

assert.equal(manifest.name, 'SudoProyectivo');
assert.equal(manifest.short_name, 'SudoProyectivo');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');

const sizes = new Set(manifest.icons.map((icon) => icon.sizes));
assert.ok(sizes.has('192x192'), 'Falta icono 192x192');
assert.ok(sizes.has('512x512'), 'Falta icono 512x512');

for (const icon of manifest.icons) {
  assert.ok(fs.existsSync(new URL(`../${icon.src}`, import.meta.url)), `No existe ${icon.src}`);
}

assert.match(pwaCode, /beforeinstallprompt/);
assert.match(pwaCode, /appinstalled/);
assert.match(pwaCode, /serviceWorker\.register/);
assert.match(pwaCode, /Añadir a pantalla de inicio/);
assert.match(puzzles, /import '\.\/pwa\.js';/);
assert.match(serviceWorker, /CACHE_NAME/);
assert.match(serviceWorker, /manifest\.webmanifest/);
assert.match(serviceWorker, /js\/app\.js/);

console.log('pwa.test.mjs: OK');
