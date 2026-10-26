import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
const pwaCode = fs.readFileSync(new URL('../js/pwa.js', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const puzzles = fs.readFileSync(new URL('../js/puzzles.js', import.meta.url), 'utf8');
const perfectSolution = fs.readFileSync(new URL('../js/perfect-solution.js', import.meta.url), 'utf8');
const brand = fs.readFileSync(new URL('../js/brand.js', import.meta.url), 'utf8');

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
assert.match(pwaCode, /updateViaCache:\s*'none'/, 'El service worker debe comprobarse sin reutilizar una copia HTTP antigua');
assert.match(pwaCode, /registration\.update\(\)/, 'Debe existir comprobación explícita de actualizaciones');
assert.match(pwaCode, /controllerchange/, 'Debe recargar cuando cambia el controlador');
assert.match(pwaCode, /Actualizar ahora/, 'Debe existir una acción visible para actualizar');
assert.match(pwaCode, /Buscar actualización/, 'Debe existir comprobación manual desde la app');
assert.match(pwaCode, /SKIP_WAITING/, 'El botón debe poder activar el worker en espera');
assert.match(pwaCode, /Añadir a pantalla de inicio/);
assert.match(pwaCode, /import '\.\/perfect-solution\.js';/, 'El visor de solución debe formar parte del arranque principal');
assert.doesNotMatch(perfectSolution, /from '\.\/puzzles\.js'/, 'El visor no debe depender circularmente de puzzles.js');
assert.match(perfectSolution, /__SUDOP_SOLUTION_VIEWER_READY__/, 'El visor debe marcar su inicialización');
assert.match(brand, /import '\.\/reset-controls\.js';/, 'Los controles seguros de reinicio deben cargarse con el núcleo');
assert.match(puzzles, /import '\.\/pwa\.js';/);
assert.match(serviceWorker, /CACHE_NAME/);
assert.match(serviceWorker, /sudoproyectivo-1\.1\.6/);
assert.match(serviceWorker, /SKIP_WAITING/);
assert.match(serviceWorker, /clients\.claim/);
assert.match(serviceWorker, /manifest\.webmanifest/);
assert.match(serviceWorker, /js\/app\.js/);
assert.match(serviceWorker, /js\/perfect-solution\.js/);
assert.match(serviceWorker, /js\/reset-controls\.js/);

console.log('pwa.test.mjs: OK');
