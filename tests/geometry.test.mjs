import assert from 'node:assert/strict';
import { makeConstraintSystem, makeRoutes, routeId, SIZE } from '../js/geometry.js';

const system = makeConstraintSystem([1]);
assert.equal(system.units.length, 21, 'Debe haber 21 unidades en v0.2');

for (let row = 0; row < SIZE; row++) {
  for (let col = 0; col < SIZE; col++) {
    const key = `${row},${col}`;
    assert.equal(system.memberships.get(key).length, 3, 'Cada celda debe pertenecer a 3 unidades');
    assert.equal(system.peers.get(key).size, 18, 'Cada celda debe tener 18 pares incompatibles');
  }
}

const routes = makeRoutes(1);
assert.equal(routes.length, 7);
for (const route of routes) {
  assert.equal(route.length, 7);
  assert.equal(new Set(route.map(({ row, col }) => `${row},${col}`)).size, 7);
  const id = routeId(route[0].row, route[0].col, 1);
  assert.ok(route.every((cell) => routeId(cell.row, cell.col, 1) === id));
}

console.log('geometry.test.mjs: OK');
