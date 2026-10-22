import assert from 'node:assert/strict';
import { LEVELS } from '../js/puzzles.js';

function pointsForValue(solution, value) {
  const points = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (solution[row][col] === value) points.push({ row, col });
    }
  }
  return points;
}

function liesOnAffineLine(points) {
  // Direcciones finitas y = m x + b, m = 0,...,6.
  for (let slope = 0; slope < 7; slope++) {
    const intercepts = new Set(points.map(({ row, col }) => ((row - slope * col) % 7 + 7) % 7));
    if (intercepts.size === 1) return true;
  }
  // Dirección vertical x = constante.
  return new Set(points.map(({ col }) => col)).size === 1;
}

assert.equal(LEVELS.length, 180, 'La campaña auditada debe conservar 180 niveles');

for (const level of LEVELS) {
  for (let value = 1; value <= 7; value++) {
    const points = pointsForValue(level.solution, value);
    assert.equal(points.length, 7, `${level.id}: el símbolo ${value} debe aparecer siete veces`);
    assert.equal(
      liesOnAffineLine(points),
      false,
      `${level.id}: el símbolo ${value} no debe ocupar una recta afín completa`
    );
  }
}

const bands = [
  { name: 'Fácil', from: 1, to: 10, expectedAverage: 26.0 },
  { name: 'Intermedio', from: 11, to: 20, expectedAverage: 18.5 },
  { name: 'Difícil', from: 21, to: 30, expectedAverage: 13.5 },
];

for (const band of bands) {
  const levels = LEVELS.filter((level) => level.localNumber >= band.from && level.localNumber <= band.to);
  const average = levels.reduce(
    (sum, level) => sum + level.puzzle.flat().filter(Boolean).length,
    0
  ) / levels.length;
  assert.equal(average, band.expectedAverage, `${band.name}: promedio de pistas inesperado`);
}

console.log('nonlinear-campaign.test.mjs: OK');
