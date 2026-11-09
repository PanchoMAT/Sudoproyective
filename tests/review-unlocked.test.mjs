import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildFullyUnlockedReviewSave } from '../js/review-unlocked.js';
import { LEVELS } from '../js/puzzles.js';
import { ULTRA_LEVELS } from '../js/ultra.js';

const real = {
  bestStars: { [LEVELS[0].id]: 1 },
  levels: { [LEVELS[1].id]: { values: [[1,2,3]] } },
  availableStars: 7,
  ultraCompleted: {},
  projectiveCredential: false,
};
const original = JSON.stringify(real);
const unlocked = buildFullyUnlockedReviewSave(real);
assert.equal(JSON.stringify(real), original, 'La copia de revisión no debe mutar el progreso original');
assert.equal(LEVELS.length, 180);
assert.equal(Object.keys(unlocked.bestStars).length, 180);
for (const level of LEVELS) assert.equal(unlocked.bestStars[level.id], 3, level.id);
assert.equal(unlocked.availableStars, 540);
assert.deepEqual(unlocked.levels, {});
assert.equal(ULTRA_LEVELS.length, 6);
assert.equal(Object.keys(unlocked.ultraCompleted).length, 6);
for (const item of ULTRA_LEVELS) assert.equal(unlocked.ultraCompleted[item.id], true, item.id);
assert.deepEqual(unlocked.ultraLevels, {});
assert.equal(unlocked.projectiveUnlockSeen, true);
assert.equal(unlocked.projectiveCredential, true);
assert.equal(unlocked.projectiveFinalRewardUnlocked, true);
assert.equal(unlocked.reviewAllSeeded, true);

const puzzlesCode = fs.readFileSync(new URL('../js/puzzles.js', import.meta.url), 'utf8');
assert.match(puzzlesCode, /import '\.\/review-bootstrap\.js';\s*import '\.\/review-unlocked\.js';\s*import '\.\/campaign-migration\.js';/,
  'La copia de prueba debe crearse antes de leer los guardados del juego');
const unlockedCode = fs.readFileSync(new URL('../js/review-unlocked.js', import.meta.url), 'utf8');
assert.match(unlockedCode, /window\.__SUDOP_REVIEW__/, 'Nunca debe habilitarse el desbloqueo fuera de revisión');
assert.match(unlockedCode, /get\('all'\) === '1'/, 'El enlace especial debe ser explícito');

class FakeStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.has(String(key)) ? this.data.get(String(key)) : null; }
  setItem(key, value) { this.data.set(String(key), String(value)); }
  removeItem(key) { this.data.delete(String(key)); }
  clear() { this.data.clear(); }
}
const local = new FakeStorage();
const session = new FakeStorage();
local.setItem('sudoproyective-v02', original);
local.setItem('sudoproyectivo-profile-v1', '{"name":"Perfil real"}');
const sandbox = {
  window: {},
  URLSearchParams,
  location: { search: '?review=1&all=1' },
  Storage: FakeStorage,
  localStorage: local,
  sessionStorage: session,
  document: { documentElement: { classList: { add() {} } } },
};
vm.runInNewContext(
  fs.readFileSync(new URL('../js/review-bootstrap.js', import.meta.url), 'utf8'),
  sandbox
);
assert.equal(sandbox.window.__SUDOP_REVIEW__, true);
assert.equal(sandbox.localStorage.getItem('sudoproyective-v02'), original);
sandbox.localStorage.setItem('sudoproyective-v02', JSON.stringify(unlocked));
assert.equal(local.data.get('sudoproyective-v02'), original,
  'El progreso real no puede cambiar al abrir todo en modo revisión');
assert.equal(JSON.parse(sandbox.localStorage.getItem('sudoproyective-v02')).availableStars, 540);

sandbox.localStorage.setItem('sudoproyectivo-profile-v1', '{"name":"Prueba"}');
assert.equal(local.data.get('sudoproyectivo-profile-v1'), '{"name":"Perfil real"}',
  'El perfil real también debe quedar protegido');
sandbox.localStorage.setItem('sudoproyectivo-total-reset-pending', '1');
assert.equal(local.data.has('sudoproyectivo-total-reset-pending'), false,
  'Reiniciar progreso en revisión no debe crear una marca real de borrado');
sandbox.localStorage.removeItem('sudoproyective-v02');
assert.equal(local.data.get('sudoproyective-v02'), original);
sandbox.localStorage.clear();
assert.equal(local.data.get('sudoproyective-v02'), original);
assert.equal(local.data.get('sudoproyectivo-profile-v1'), '{"name":"Perfil real"}');

console.log('review-unlocked.test.mjs: OK');
