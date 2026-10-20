import assert from 'node:assert/strict';
import { LEVELS } from '../js/puzzles.js';
import { makeConstraintSystem } from '../js/geometry.js';

const system = makeConstraintSystem([1]);
for (const level of LEVELS) {
  assert.equal(level.puzzle.length, 7);
  assert.equal(level.solution.length, 7);
  for (const row of level.puzzle) assert.equal(row.length, 7);
  for (const row of level.solution) assert.equal(row.length, 7);
  for (const unit of system.units) {
    const vals = unit.cells.map(({row, col}) => level.solution[row][col]);
    assert.deepEqual([...vals].sort(), [1,2,3,4,5,6,7], `${level.id}: unidad inválida`);
  }
  for (let r=0;r<7;r++) for (let c=0;c<7;c++) {
    if (level.puzzle[r][c]) assert.equal(level.puzzle[r][c], level.solution[r][c]);
  }
}
console.log('puzzles.test.mjs: OK');
