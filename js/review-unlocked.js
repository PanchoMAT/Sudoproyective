import route1 from './data/route1.js';
import route2 from './data/route2.js';
import route3 from './data/route3.js';
import route4 from './data/route4.js';
import route5 from './data/route5.js';
import route6 from './data/route6.js';
import { ULTRA_LEVELS } from './ultra.js';

const routes = [route1, route2, route3, route4, route5, route6];

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
    window.__SUDOP_REVIEW_FULL__ = true;
  }
}
