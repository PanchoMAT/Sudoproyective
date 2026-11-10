import route1 from './data/route1.js';
import route2 from './data/route2.js';
import route3 from './data/route3.js';
import route4 from './data/route4.js';
import route5 from './data/route5.js';
import route6 from './data/route6.js';
import { ULTRA_LEVELS } from './ultra.js';
import { FIELD_CAMPAIGNS, blankFieldProgress, FIELD_STORAGE_KEY } from './fields/core.js';

const routes = [route1, route2, route3, route4, route5, route6];

export function buildFullyUnlockedSmallFieldReviewSave(base = {}) {
  const next = { ...base };
  for (const p of [3, 5, 9]) {
    const campaign = FIELD_CAMPAIGNS[p];
    next[p] = {
      ...blankFieldProgress(),
      ...(base[p] || {}),
      levels: {},
      bestStars: Object.fromEntries(campaign.levels.map((level) => [level.id, 3])),
      availableStars: campaign.levels.length * 3,
      ultraLevels: {},
      ultraCompleted: Object.fromEntries(campaign.ultra.map((level) => [level.id, true])),
      selectedRoute: 1,
      finalSeen: true,
    };
  }
  next.reviewAllSmallSeeded = true;
  next.reviewAllFourSeeded = true;
  return next;
}

// Sólo modifica el progreso temporal de ?review=1; nunca la partida real.
export function buildFullyUnlockedReviewSave(base = {}) {
  const allIds = routes.flatMap((route) => route.map(([id]) => id));
  const bestStars = Object.fromEntries(allIds.map((id) => [id, 3]));
  const ultraCompleted = Object.fromEntries(ULTRA_LEVELS.map(({ id }) => [id, true]));
  return {
    ...base,
    campaignRevision: 2,
    levels: {},
    bestStars,
    availableStars: allIds.length * 3,
    trophies: {},
    seenDirections: {},
    selectedWorldId: 1,
    ultraCompleted,
    ultraLevels: {},
    projectiveUnlockSeen: true,
    projectiveFinalRewardUnlocked: true,
    projectiveCredential: true,
    reviewAllSeeded: true,
  };
}

if (typeof window !== 'undefined'
    && window.__SUDOP_REVIEW__
    && new URLSearchParams(window.location.search).get('all') === '1') {
  const reviewStore = window.__SUDOP_REVIEW_STORAGE__;
  if (reviewStore) {
    const shadow = reviewStore.read();
    if (!shadow.reviewAllSeeded) reviewStore.write(buildFullyUnlockedReviewSave(shadow));
    // review-bootstrap.js desvía esta clave hacia sessionStorage: jamás escribe
    // en el guardado real de los mundos F3, F5 y F9.
    let fieldShadow = {};
    try { fieldShadow = JSON.parse(localStorage.getItem(FIELD_STORAGE_KEY)) || {}; }
    catch { /* copia de revisión vacía */ }
    if (!fieldShadow.reviewAllFourSeeded)
      localStorage.setItem(FIELD_STORAGE_KEY, JSON.stringify(buildFullyUnlockedSmallFieldReviewSave(fieldShadow)));
    window.__SUDOP_REVIEW_FULL__ = true;
  }
}
