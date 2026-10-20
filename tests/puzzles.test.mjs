import assert from 'node:assert/strict';
import { LEVELS } from '../js/puzzles.js';
import { cellKey, makeConstraintSystem } from '../js/geometry.js';

const system = makeConstraintSystem([1]);
const symbols = [1, 2, 3, 4, 5, 6, 7];

function countSolutions(grid, limit = 2) {
  const work = grid.map((row) => [...row]);
  let count = 0;

  function candidates(row, col) {
    const used = new Set();
    for (const key of system.peers.get(cellKey(row, col))) {
      const [r, c] = key.split(',').map(Number);
      if (work[r][c]) used.add(work[r][c]);
    }
    return symbols.filter((value) => !used.has(value));
  }

  function search() {
    if (count >= limit) return;
    let best = null;
    let bestCandidates = null;

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (work[row][col] !== 0) continue;
        const options = candidates(row, col);
        if (options.length === 0) return;
        if (!bestCandidates || options.length < bestCandidates.length) {
          best = { row, col };
          bestCandidates = options;
        }
      }
    }

    if (!best) {
      count++;
      return;
    }

    for (const value of bestCandidates) {
      work[best.row][best.col] = value;
      search();
      work[best.row][best.col] = 0;
      if (count >= limit) return;
    }
  }

  search();
  return count;
}

for (const level of LEVELS) {
  assert.equal(level.puzzle.length, 7);
  assert.equal(level.solution.length, 7);
  for (const row of level.puzzle) assert.equal(row.length, 7);
  for (const row of level.solution) assert.equal(row.length, 7);

  for (const unit of system.units) {
    const vals = unit.cells.map(({ row, col }) => level.solution[row][col]);
    assert.deepEqual([...vals].sort(), symbols, `${level.id}: unidad inválida`);
  }

  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (level.puzzle[r][c]) assert.equal(level.puzzle[r][c], level.solution[r][c]);
    }
  }

  assert.equal(countSolutions(level.puzzle), 1, `${level.id}: el puzzle debe tener solución única`);
}

console.log('puzzles.test.mjs: OK');
