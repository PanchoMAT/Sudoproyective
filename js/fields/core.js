import { SMALL_FIELD_DATA } from './data.js';
import { FIELD9_DATA } from './data9.js';
import { FIELD11_DATA } from './data11.js';

export const FIELD_STORAGE_KEY = 'sudoproyectivo-fields-v1';
export const FIELD_DIFFICULTIES = ['Fácil', 'Intermedio', 'Difícil'];
export const FIELD_CONFIG = Object.freeze({
  3: Object.freeze({ p: 3, perDifficulty: 5, routeCount: 2, projectivePoints: 13 }),
  5: Object.freeze({ p: 5, perDifficulty: 7, routeCount: 4, projectivePoints: 31 }),
  9: Object.freeze({ p: 9, perDifficulty: 9, routeCount: 8, projectivePoints: 91 }),
  11: Object.freeze({ p: 11, perDifficulty: 5, routeCount: 10, projectivePoints: 133 }),
});

function gridOf(text, p) {
  if (text.length !== p * p) throw new Error('Longitud incorrecta del tablero');
  return Array.from({ length: p }, (_, row) =>
    Array.from({ length: p }, (_, col) => Number.parseInt(text[row * p + col], 12))
  );
}

export const FIELD_CAMPAIGNS = Object.fromEntries([3, 5, 9, 11].map((p) => {
  const raw = p === 9 ? FIELD9_DATA : p === 11 ? FIELD11_DATA : SMALL_FIELD_DATA[p];
  const config = FIELD_CONFIG[p];
  const levels = raw.levels.map(([id, slope, localNumber, group, puzzle, solution]) => ({
    id, p, slope, localNumber, group,
    difficulty: FIELD_DIFFICULTIES[group],
    puzzle: gridOf(puzzle, p),
    solution: gridOf(solution, p),
  }));
  const ultra = raw.ultras.map(([id, slope, puzzle, solution]) => ({
    id, p, slope, puzzle: gridOf(puzzle, p), solution: gridOf(solution, p), ultra: true,
  }));
  return [p, { ...config, levels, ultra }];
}));

export function mod(n, p) { return ((n % p) + p) % p; }

// F9 = F3[α], α² = 2. Los índices 0..8 codifican a + bα mediante a+3b.
// Para F3, F5 y F11 se preserva la aritmética modular de los cuerpos primos.
export function fieldAdd(a, b, p) {
  if (p !== 9) return mod(a + b, p);
  return mod(a % 3 + b % 3, 3) + 3 * mod(Math.floor(a / 3) + Math.floor(b / 3), 3);
}
export function fieldSub(a, b, p) {
  if (p !== 9) return mod(a - b, p);
  return mod(a % 3 - b % 3, 3) + 3 * mod(Math.floor(a / 3) - Math.floor(b / 3), 3);
}
export function fieldMul(a, b, p) {
  if (p !== 9) return mod(a * b, p);
  const x = a % 3, y = Math.floor(a / 3);
  const z = b % 3, w = Math.floor(b / 3);
  return mod(x * z + 2 * y * w, 3) + 3 * mod(x * w + y * z, 3);
}
export function routeId(row, col, m, p) {
  return fieldSub(row, fieldMul(m, col, p), p);
}
export function routeCells(p, m, row, col) {
  const b = routeId(row, col, m, p);
  return Array.from({ length: p }, (_, c) => ({
    row: fieldAdd(fieldMul(m, c, p), b, p), col: c,
  }));
}

export function constraintUnits(p, m) {
  const units = [];
  for (let row = 0; row < p; row++)
    units.push(Array.from({ length: p }, (_, col) => row * p + col));
  for (let col = 0; col < p; col++)
    units.push(Array.from({ length: p }, (_, row) => row * p + col));
  for (let b = 0; b < p; b++)
    units.push(Array.from({ length: p }, (_, col) => fieldAdd(fieldMul(m, col, p), b, p) * p + col));
  return units;
}

export function isValidSolution(grid, p, m) {
  const vals = grid.flat();
  const wanted = Array.from({ length: p }, (_, i) => i + 1);
  if (vals.length !== p * p || vals.some((x) => !wanted.includes(x))) return false;
  return constraintUnits(p, m).every((unit) =>
    unit.map((index) => vals[index]).sort((a, b) => a - b).every((x, i) => x === wanted[i])
  );
}

export function countFieldSolutions(grid, p, m, limit = 2) {
  const units = constraintUnits(p, m);
  const peers = Array.from({ length: p * p }, () => new Set());
  for (const unit of units) for (const i of unit) for (const j of unit)
    if (i !== j) peers[i].add(j);
  const related = peers.map((set) => [...set]);
  const values = grid.flat();
  const full = (1 << p) - 1;
  let count = 0;
  function visit() {
    let bestIndex = -1, bestMask = 0, bestCount = p + 1;
    for (let i = 0; i < values.length; i++) {
      if (values[i]) continue;
      let used = 0;
      for (const j of related[i]) if (values[j]) used |= 1 << (values[j] - 1);
      const mask = full & ~used;
      let choices = 0;
      for (let bits = mask; bits; bits &= bits - 1) choices++;
      if (!choices) return;
      if (choices < bestCount) {
        bestIndex = i;
        bestMask = mask;
        bestCount = choices;
        if (choices === 1) break;
      }
    }
    if (bestIndex < 0) { count++; return; }
    for (let digit = 1; digit <= p; digit++) {
      if (!(bestMask & (1 << (digit - 1)))) continue;
      values[bestIndex] = digit;
      visit();
      values[bestIndex] = 0;
      if (count >= limit) return;
    }
  }
  visit();
  return count;
}

export function blankFieldProgress() {
  return {
    levels: {}, bestStars: {}, availableStars: 0,
    ultraLevels: {}, ultraCompleted: {},
    selectedRoute: 1, finalSeen: false,
  };
}

export function readFieldProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(FIELD_STORAGE_KEY)) || {};
    return {
      3: { ...blankFieldProgress(), ...(raw[3] || {}) },
      5: { ...blankFieldProgress(), ...(raw[5] || {}) },
      9: { ...blankFieldProgress(), ...(raw[9] || {}) },
      11: { ...blankFieldProgress(), ...(raw[11] || {}) },
      achievements: { ...(raw.achievements || {}) },
    };
  } catch {
    return { 3: blankFieldProgress(), 5: blankFieldProgress(), 9: blankFieldProgress(),
      11: blankFieldProgress(), achievements: {} };
  }
}

export function writeFieldProgress(all) {
  localStorage.setItem(FIELD_STORAGE_KEY, JSON.stringify(all));
}

export function fieldBestStars(world, item) {
  return Number(world.bestStars?.[item.id] || 0);
}

export function fieldRouteStars(p, slope, world) {
  return FIELD_CAMPAIGNS[p].levels
    .filter((item) => item.slope === slope)
    .reduce((total, item) => total + fieldBestStars(world, item), 0);
}

export function fieldRouteTrophy(p, slope, world) {
  const total = fieldRouteStars(p, slope, world);
  const perRoute = FIELD_CONFIG[p].perDifficulty * 3;
  if (total >= perRoute * 3) return 'Oro';
  if (total >= perRoute * 2) return 'Plata';
  if (total >= perRoute) return 'Bronce';
  return 'Pendiente';
}

export function fieldPlatinum(p, world) {
  return FIELD_CAMPAIGNS[p].levels.every((item) => fieldBestStars(world, item) === 3);
}

export function fieldHardFinished(p, world) {
  return FIELD_CAMPAIGNS[p].levels
    .filter((item) => item.group === 2)
    .every((item) => fieldBestStars(world, item) > 0);
}

export function fieldUltraFinished(p, world) {
  return FIELD_CAMPAIGNS[p].ultra.every((item) => Boolean(world.ultraCompleted?.[item.id]));
}

export function fieldProgressSummary(p, world) {
  const items = FIELD_CAMPAIGNS[p].levels;
  const done = items.filter((item) => fieldBestStars(world, item) > 0).length;
  const stars = items.reduce((sum, item) => sum + fieldBestStars(world, item), 0);
  return { done, total: items.length, stars, maxStars: items.length * 3 };
}
