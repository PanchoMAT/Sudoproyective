import assert from 'node:assert/strict';
import { ULTRA_LEVELS } from '../js/ultra.js';
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
    if (!best) { count++; return; }
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

assert.equal(ULTRA_LEVELS.length, 6);
assert.deepEqual(ULTRA_LEVELS.map((item) => item.slope), [1,2,3,4,5,6]);
assert.equal(new Set(ULTRA_LEVELS.map((item) => item.id)).size, 6);
assert.equal(new Set(ULTRA_LEVELS.map((item) => item.solution.flat().join(''))).size, 6);

for (const item of ULTRA_LEVELS) {
  const system = makeConstraintSystem(item.slopes);
  const clues = item.puzzle.flat().filter(Boolean).length;
  assert.equal(clues, 12, `${item.id}: debe tener 12 pistas`);
  for (const unit of system.units) {
    const vals = unit.cells.map(({row,col}) => item.solution[row][col]);
    assert.deepEqual([...vals].sort((a,b) => a-b), symbols, `${item.id}: solución inválida`);
  }
  for (let r=0; r<SIZE; r++) {
    for (let c=0; c<SIZE; c++) {
      if (item.puzzle[r][c]) assert.equal(item.puzzle[r][c], item.solution[r][c]);
    }
  }
  assert.equal(countSolutions(item.puzzle, item.slopes), 1, `${item.id}: solución única`);
}

console.log('ultra.test.mjs: OK');
