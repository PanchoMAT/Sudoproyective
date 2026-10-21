import assert from 'node:assert/strict';
import { makeConstraintSystem, makeRoutes, routeId, SIZE } from '../js/geometry.js';

for (const slope of [1, 2, 3, 4, 5, 6]) {
  const system = makeConstraintSystem([slope]);
  assert.equal(system.units.length, 21, `Pendiente ${slope}: debe haber 21 unidades`);

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const key = `${row},${col}`;
      assert.equal(system.memberships.get(key).length, 3, `Pendiente ${slope}: 3 pertenencias`);
      assert.equal(system.peers.get(key).size, 18, `Pendiente ${slope}: 18 pares incompatibles`);
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

console.log('geometry.test.mjs: OK');
