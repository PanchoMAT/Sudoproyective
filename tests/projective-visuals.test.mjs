import assert from 'node:assert/strict';
import { ULTRA_LEVELS } from '../js/ultra.js';
import { DIRECTIONS, ultraRevealSvg, circularProjectiveSvg } from '../js/projective/visuals.js';

function count(text, token) {
  return (text.match(new RegExp(token, 'g')) || []).length;
}

for (const item of ULTRA_LEVELS) {
  const svg = ultraRevealSvg(item.solution, item.slope);
  assert.equal(count(svg, 'class="ultra-reveal-number"'), 49, `${item.id}: debe mostrar 49 números inicialmente`);
  assert.equal(count(svg, 'class="ultra-reveal-point"'), 49, `${item.id}: debe revelar 49 puntos`);
  assert.equal(count(svg, 'class="ultra-reveal-route"'), 7, `${item.id}: debe construir 7 rectas`);
  assert.equal(count(svg, 'class="ultra-reveal-extension"'), 7, `${item.id}: cada recta debe prolongarse al infinito`);
  assert.ok(svg.includes(`>P${item.slope}</text>`), `${item.id}: debe identificar P_${item.slope}`);
}

const circular = circularProjectiveSvg();
assert.equal(DIRECTIONS.length, 8, 'Deben existir ocho direcciones afines');
assert.equal(count(circular, 'class="circle-family circle-family-'), 8, 'La construcción circular debe tener 8 familias');
assert.equal(count(circular, 'class="circle-route"'), 56, 'Las ocho familias deben mostrar 56 rectas afines');
assert.equal(count(circular, 'class="circle-extension"'), 56, 'Las 56 rectas deben prolongarse hacia sus puntos del infinito');
assert.equal(count(circular, 'class="circle-infinity-point"'), 8, 'Deben aparecer 8 puntos del infinito');
assert.equal(count(circular, 'class="infinity-rope"'), 1, 'Debe existir una única representación de la recta del infinito');

console.log('projective-visuals.test.mjs: OK');
