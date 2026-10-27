import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync(new URL('../js/reset-controls.js', import.meta.url), 'utf8');

assert.match(code, /Reiniciar nivel/, 'Debe existir el botón de reinicio del nivel');
assert.match(code, /delete save\.levels\[target\.id\]/, 'El reinicio del nivel debe borrar sólo la partida parcial actual');
assert.match(code, /localStorage\.setItem\(RESUME_KEY/, 'El reinicio pendiente debe sobrevivir a la recarga de la PWA');
assert.match(code, /applyPendingResetsBeforeGameLoads/, 'Debe reaplicar el borrado antes de que app.js lea el progreso');
assert.match(code, /localStorage\.getItem\(RESUME_KEY\)/, 'La reanudación debe leer la marca persistente');
assert.doesNotMatch(code, /sessionStorage\.setItem\(RESUME_KEY/, 'El reinicio de nivel no debe depender de sessionStorage');
assert.match(code, /TOTAL_RESET_KEY/, 'El reinicio total debe sobrevivir al autosave de beforeunload');
assert.match(code, /Tu mejor marca, estrellas y trofeos no se perderán/, 'La confirmación debe aclarar qué progreso se conserva');
assert.match(code, /Las estrellas ya gastadas en pistas no se reembolsan/, 'El reinicio no debe reembolsar pistas compradas');

const confirms = [...code.matchAll(/window\.confirm\(/g)].length;
assert.ok(confirms >= 3, 'Debe haber una confirmación para el nivel y dos para el reinicio total');
assert.match(code, /¿Reiniciar TODO el progreso/, 'Debe existir la primera confirmación de reinicio total');
assert.match(code, /Última confirmación/, 'Debe existir una segunda confirmación explícita');
assert.match(code, /localStorage\.setItem\(TOTAL_RESET_KEY, '1'\)/, 'Debe marcar el reinicio total antes de recargar');
assert.match(code, /localStorage\.removeItem\(STORAGE_KEY\)/, 'Sólo tras las confirmaciones debe borrarse el progreso total');
assert.match(code, /__SUDOP_RESET_CONTROLS_READY__/, 'El módulo debe marcar su inicialización');

console.log('reset-controls.test.mjs: OK');
