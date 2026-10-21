import assert from 'node:assert/strict';
import { LEVELS, WORLDS } from '../js/puzzles.js';
import { makeConstraintSystem, SIZE } from '../js/geometry.js';

const symbols = [1,2,3,4,5,6,7];
const difficulties = ['Fácil', 'Intermedio', 'Difícil'];

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

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (values[row][col]) continue;
        const cands = candidates(row, col);
        if (!cands.length) return;
        if (!bestCandidates || cands.length < bestCandidates.length) {
          best = { row, col };
          bestCandidates = cands;
        }
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

assert.equal(LEVELS.length, 180, 'La v0.5 debe contener 180 niveles');
assert.equal(WORLDS.length, 6, 'Debe haber seis rutas');
assert.equal(new Set(LEVELS.map((level) => level.id)).size, LEVELS.length, 'IDs únicos');
assert.equal(new Set(LEVELS.map((level) => level.number)).size, LEVELS.length, 'Números globales únicos');
assert.equal(
  new Set(LEVELS.map((level) => level.puzzle.flat().join(''))).size,
  LEVELS.length,
  'Los 180 puzzles deben ser distintos'
);

for (const world of WORLDS) {
  assert.equal(world.id, world.slope);
  assert.ok([1,2,3,4,5,6].includes(world.slope));
  assert.deepEqual(world.groups, difficulties);

  const levels = LEVELS.filter((level) => level.world === world.id);
  assert.equal(levels.length, 30, `${world.name}: 30 niveles`);
  assert.deepEqual(levels.map((level) => level.localNumber), Array.from({length:30}, (_,i) => i + 1));

  for (const difficulty of difficulties) {
    assert.equal(
      levels.filter((level) => level.difficulty === difficulty).length,
      10,
      `${world.name}: 10 niveles ${difficulty}`
    );
  }
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

  for (let r=0; r<7; r++) {
    for (let c=0; c<7; c++) {
      if (level.puzzle[r][c]) {
        assert.equal(level.puzzle[r][c], level.solution[r][c], `${level.id}: pista inconsistente`);
      }
    }
  }

  assert.equal(countSolutions(level.puzzle, level.slopes), 1, `${level.id}: debe tener solución única`);
}

console.log('puzzles.test.mjs: OK');
