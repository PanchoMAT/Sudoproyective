import assert from 'node:assert/strict';
import { solutionUnlocked } from '../js/perfect-solution.js';

assert.equal(solutionUnlocked({ levelA: 3 }, 'levelA'), true, '3 estrellas desbloquean la solución');
assert.equal(solutionUnlocked({ levelA: 2 }, 'levelA'), false, '2 estrellas no desbloquean la solución');
assert.equal(solutionUnlocked({ levelA: 1 }, 'levelA'), false, '1 estrella no desbloquea la solución');
assert.equal(solutionUnlocked({}, 'levelA'), false, 'un nivel no completado no desbloquea la solución');
assert.equal(solutionUnlocked({ levelA: 4 }, 'levelA'), true, 'la condición tolera marcas futuras superiores a 3');

console.log('perfect-solution.test.mjs: OK');
