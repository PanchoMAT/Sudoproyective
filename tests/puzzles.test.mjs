import assert from 'node:assert/strict';
import { LEVELS, WORLDS } from '../js/puzzles.js';
import { makeConstraintSystem, SIZE } from '../js/geometry.js';

const symbols = [1,2,3,4,5,6,7];

function countSolutions(grid, slopes, limit = 2) {
  const system = makeConstraintSystem(slopes);
  const values = grid.map((row) => [...row]);
  let count = 0;

  function candidates(row, col) {
    const used = new Set();
    for (const peer of system.peers.get(`${row},${col}`)) {
      const [r,c] = peer.split(',').map(Number);
      if (values[r][c]) used.add(values[r][c]);
    }
    return symbols.filter((v) => !used.has(v));
  }

  function dfs() {
    if (count >= limit) return;
    let best = null;
    let bestCandidates = null;
    for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
      if (values[row][col]) continue;
      const cands = candidates(row, col);
      if (!cands.length) return;
      if (!bestCandidates || cands.length < bestCandidates.length) {
        best = { row, col };
        bestCandidates = cands;
        if (cands.length === 1) break;
      }
    }
    if (!best) {
      count++;
      return;
    }
    for (const value of bestCandidates) {
      values[best.row][best.col] = value;
      dfs();
      values[best.row][best.col] = 0;
      if (count >= limit) return;
    }
  }

  dfs();
  return count;
}

assert.equal(LEVELS.length, 48, 'La v0.4 debe contener 48 niveles');
assert.equal(WORLDS.length, 6, 'La v0.4 debe contener las seis rutas no redundantes');
assert.equal(LEVELS.filter((l) => l.slope === 1).length, 18);
for (const slope of [2,3,4,5,6]) {
  assert.equal(LEVELS.filter((l) => l.slope === slope).length, 6, `Ruta ${slope}: seis niveles`);
}
assert.equal(new Set(LEVELS.map((level) => level.id)).size, LEVELS.length, 'Los ids deben ser únicos');
assert.equal(new Set(LEVELS.map((level) => level.number)).size, LEVELS.length, 'La numeración debe ser única');

for (const world of WORLDS) {
  assert.equal(world.id, world.slope);
  assert.ok([1,2,3,4,5,6].includes(world.slope));
}

for (const level of LEVELS) {
  const system = makeConstraintSystem(level.slopes);
  assert.equal(level.puzzle.length, 7);
  assert.equal(level.solution.length, 7);
  assert.deepEqual(level.slopes, [level.slope]);

  for (const row of level.puzzle) assert.equal(row.length, 7);
  for (const row of level.solution) assert.equal(row.length, 7);

  for (const unit of system.units) {
    const vals = unit.cells.map(({row, col}) => level.solution[row][col]);
    assert.deepEqual([...vals].sort((a,b) => a-b), symbols, `${level.id}: unidad inválida`);
  }

  for (let r=0; r<7; r++) for (let c=0; c<7; c++) {
    if (level.puzzle[r][c]) assert.equal(level.puzzle[r][c], level.solution[r][c]);
  }

  assert.equal(countSolutions(level.puzzle, level.slopes), 1, `${level.id}: debe tener solución única`);
}

console.log('puzzles.test.mjs: OK');
