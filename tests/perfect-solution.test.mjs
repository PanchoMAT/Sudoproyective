import assert from 'node:assert/strict';
import fs from 'node:fs';
import { solutionUnlocked } from '../js/perfect-solution.js';

assert.equal(solutionUnlocked({ levelA: 3 }, 'levelA'), true, '3 estrellas desbloquean la solución');
assert.equal(solutionUnlocked({ levelA: 2 }, 'levelA'), false, '2 estrellas no desbloquean la solución');
assert.equal(solutionUnlocked({ levelA: 1 }, 'levelA'), false, '1 estrella no desbloquea la solución');
assert.equal(solutionUnlocked({}, 'levelA'), false, 'un nivel no completado no desbloquea la solución');
assert.equal(solutionUnlocked({ levelA: 4 }, 'levelA'), true, 'la condición tolera marcas futuras superiores a 3');

const code = fs.readFileSync(new URL('../js/perfect-solution.js', import.meta.url), 'utf8');
assert.match(code, /levelFromRow/, 'el visor debe identificar directamente el nivel pulsado');
assert.match(code, /MutationObserver/, 'el visor debe reaccionar a cambios de pantalla');
assert.match(code, /Solución desbloqueada/, 'los niveles perfectos deben mostrar una señal visible');
assert.match(code, /Ver solución/, 'debe existir el botón de consulta');

console.log('perfect-solution.test.mjs: OK');
