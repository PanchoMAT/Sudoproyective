import { LEVELS } from '../puzzles.js';
import { ULTRA_LEVELS } from '../ultra.js';

export const STORAGE_KEY = 'sudoproyective-v02';
let allowProjectiveClear = false;
const nativeSetItem = Storage.prototype.setItem;
const nativeGetItem = Storage.prototype.getItem;

// Conserva los campos del modo Proyectivo cuando el motor principal persiste la clave histórica.
Storage.prototype.setItem = function(key, value) {
  if (key === STORAGE_KEY && !allowProjectiveClear) {
    try {
      const current = JSON.parse(nativeGetItem.call(this, key)) || {};
      const next = JSON.parse(value) || {};
      for (const field of ['ultraCompleted', 'ultraLevels', 'projectiveCredential', 'projectiveUnlockSeen', 'projectiveFinalRewardUnlocked']) {
        if (!(field in next) && field in current) next[field] = current[field];
      }
      value = JSON.stringify(next);
    } catch { /* usa el comportamiento nativo si no es JSON */ }
  }
  return nativeSetItem.call(this, key, value);
};

document.addEventListener('click', (event) => {
  if (!event.target.closest?.('#resetProgressBtn')) return;
  allowProjectiveClear = true;
  setTimeout(() => { allowProjectiveClear = false; }, 0);
}, true);

export function readSave() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

export function writeSave(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function patchSave(patch) {
  writeSave({ ...readSave(), ...patch });
}

export function difficultLevels() {
  return LEVELS.filter((item) => item.difficulty === 'Difícil');
}

export function projectUnlocked() {
  const best = readSave().bestStars || {};
  return difficultLevels().every((item) => Number(best[item.id] || 0) > 0);
}

export function difficultProgress() {
  const best = readSave().bestStars || {};
  const levels = difficultLevels();
  const done = levels.filter((item) => Number(best[item.id] || 0) > 0).length;
  return { done, total: levels.length };
}

export function ultraCompletedMap() {
  return { ...(readSave().ultraCompleted || {}) };
}

export function ultraComplete(item) {
  return Boolean(ultraCompletedMap()[item.id]);
}

export function allUltraComplete() {
  return ULTRA_LEVELS.every(ultraComplete);
}

export function credentialEarned() {
  return Boolean(readSave().projectiveCredential);
}

export function finalRewardUnlocked() {
  return Boolean(readSave().projectiveFinalRewardUnlocked);
}

export function loadUltraState(item) {
  if (ultraComplete(item)) return null;
  return readSave().ultraLevels?.[item.id] || null;
}

export function saveUltraState(item, data) {
  const save = readSave();
  const ultraLevels = { ...(save.ultraLevels || {}) };
  if (!ultraComplete(item)) ultraLevels[item.id] = data;
  writeSave({ ...save, ultraLevels });
}

export function markUltraComplete(item) {
  const save = readSave();
  const completed = { ...(save.ultraCompleted || {}), [item.id]: true };
  const ultraLevels = { ...(save.ultraLevels || {}) };
  delete ultraLevels[item.id];
  writeSave({ ...save, ultraCompleted: completed, ultraLevels });
}
