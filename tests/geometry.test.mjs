import assert from 'node:assert/strict';
import { makeConstraintSystem, makeRoutes, routeId, SIZE } from '../js/geometry.js';

for (const slope of [1, 2]) {
  const system = makeConstraintSystem([slope]);
  assert.equal(system.units.length, 21, `Debe haber 21 unidades con pendiente ${slope}`);

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const key = `${row},${col}`;
      assert.equal(system.memberships.get(key).length, 3, 'Cada celda debe pertenecer a 3 unidades');
      assert.equal(system.peers.get(key).size, 18, 'Cada celda debe tener 18 pares incompatibles');
    }
  }

  const routes = makeRoutes(slope);
  assert.equal(routes.length, 7);
  for (const route of routes) {
    assert.equal(route.length, 7);
    assert.equal(new Set(route.map(({ row, col }) => `${row},${col}`)).size, 7);
    const id = routeId(route[0].row, route[0].col, slope);
    assert.ok(route.every((cell) => routeId(cell.row, cell.col, slope) === id));
  }
}

const combined = makeConstraintSystem([1, 2]);
assert.equal(combined.units.length, 28, 'Dos direcciones deben producir 28 unidades');
for (let row = 0; row < SIZE; row++) {
  for (let col = 0; col < SIZE; col++) {
    const key = `${row},${col}`;
    assert.equal(combined.memberships.get(key).length, 4, 'Con dos direcciones cada celda pertenece a 4 unidades');
    assert.equal(combined.peers.get(key).size, 24, 'Con dos direcciones cada celda tiene 24 pares incompatibles');
  }
}

console.log('geometry.test.mjs: OK');
