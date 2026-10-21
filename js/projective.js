import { ULTRA_LEVELS } from './ultra.js';
import { ensureProjectiveUI } from './projective/ui.js';
import { DIRECTIONS, circularProjectiveSvg } from './projective/visuals.js';
import {
  projectUnlocked,
  difficultProgress,
  ultraCompletedMap,
  allUltraComplete,
  credentialEarned,
  finalRewardUnlocked,
  patchSave,
  readSave,
} from './projective/storage.js';

ensureProjectiveUI();
const { startUltra } = await import('./projective/ultra-game.js');

const $ = (selector) => document.querySelector(selector);
const projectPanel = $('#projectivePanel');
const gateButton = $('#projectiveRouteGate');
const secretRewardSlot = $('#secretRewardSlot');
const credentialDialog = $('#credentialDialog');
const celebrationDialog = $('#projectiveCelebrationDialog');
const lockDialog = $('#projectiveLockDialog');
const unlockDialog = $('#projectiveUnlockDialog');

const FINAL_REVEAL_ORDER = [1, 2, 3, 4, 5, 6, 0, 'inf'];
const CONFETTI_COLORS = ['#ff6b6b','#ffd43b','#69db7c','#4dabf7','#9775fa','#f783ac','#ffa94d','#70d6ff'];

let projectiveNarrationTimer = null;
let celebrationTimer = null;

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2900);
}

function typeProjectiveNarration(text) {
  const target = $('#projectiveSubtitle');
  if (!target) return;
  if (projectiveNarrationTimer) clearInterval(projectiveNarrationTimer);
  projectiveNarrationTimer = null;
  target.classList.remove('typing');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    target.textContent = text;
    return;
  }
  const words = text.split(/\s+/);
  let index = 0;
  target.textContent = '';
  target.classList.add('typing');
  projectiveNarrationTimer = setInterval(() => {
    target.textContent += `${index ? ' ' : ''}${words[index++]}`;
    if (index >= words.length) {
      clearInterval(projectiveNarrationTimer);
      projectiveNarrationTimer = null;
      target.classList.remove('typing');
    }
  }, 74);
}

function renderSecretReward() {
  if (!secretRewardSlot) return;
  const earned = credentialEarned();
  const revealed = earned || finalRewardUnlocked();
  secretRewardSlot.innerHTML = `
    <article class="secret-reward ${revealed ? 'earned' : 'locked'}">
      <div class="secret-emblem">${revealed ? '◇' : '?'}</div>
      <div>
        <p class="eyebrow">Distinción especial</p>
        <strong>${revealed ? 'Trofeo Proyectivo' : 'Recompensa oculta'}</strong>
        <p>${earned
          ? 'Has recibido una distinción que no pertenece al sistema normal de trofeos.'
          : revealed
            ? 'Completaste la construcción de PG(2,7). Tu certificado proyectivo está listo.'
            : 'Existe una recompensa más allá del camino habitual. Su naturaleza permanece oculta.'}</p>
      </div>
      ${earned
        ? '<button id="openCredentialFromRewards" class="small-btn secret-open">Ver credencial</button>'
        : revealed
          ? '<span class="secret-state">DESBLOQUEADO</span>'
          : '<span class="secret-state">???</span>'}
    </article>`;
  $('#openCredentialFromRewards')?.addEventListener('click', () => credentialDialog?.showModal());
}

function renderGate() {
  if (!gateButton) return;
  const unlocked = projectUnlocked();
  const progress = difficultProgress();
  gateButton.classList.toggle('locked', !unlocked);
  gateButton.classList.toggle('unlocked', unlocked);
  gateButton.setAttribute('aria-disabled', String(!unlocked));
  gateButton.querySelector('.projective-route-icon').textContent = unlocked ? '◇' : '🔒';
  $('#projectiveRouteStatus').textContent = unlocked ? 'Desafío final desbloqueado' : 'Completa todos los niveles Difíciles';
  $('#projectiveRouteProgress').textContent = unlocked ? 'Entrar' : `${progress.done}/${progress.total}`;
  $('#projectiveLockDialogText').textContent = `${progress.done}/${progress.total} niveles difíciles completados`;
  $('#projectiveLockDialogBar').style.width = `${Math.round((progress.done / progress.total) * 100)}%`;
}

function renderChallenges() {
  const grid = $('#ultraChallengeGrid');
  if (!grid) return;
  const completed = ultraCompletedMap();
  grid.innerHTML = '';
  ULTRA_LEVELS.forEach((item, index) => {
    const done = Boolean(completed[item.id]);
    const button = document.createElement('button');
    button.className = `ultra-card ${done ? 'completed' : ''}`;
    button.innerHTML = `
      <span class="ultra-status">${done ? '✓' : '◇'}</span>
      <span><strong>Ruta ${item.slope}</strong><small>Pendiente ${item.slope} · Ultraexperto</small></span>
      <span class="ultra-action">${done ? 'Repetir' : 'Jugar'}</span>`;
    button.addEventListener('click', () => startUltra(index));
    grid.appendChild(button);
  });

  const doneCount = ULTRA_LEVELS.filter((item) => completed[item.id]).length;
  $('#ultraProgressText').textContent = `${doneCount}/6 direcciones descubiertas`;
  $('#ultraProgressBar').style.width = `${Math.round(doneCount / 6 * 100)}%`;
  $('#projectiveFinalGate').classList.toggle('ready', doneCount === 6);
  $('#projectiveRevealBtn').disabled = doneCount !== 6;
  $('#projectiveRevealBtn').textContent = doneCount === 6
    ? 'Mira el plano proyectivo que construiste'
    : `Completa las ${6 - doneCount} rutas restantes`;
}

let unlockScheduled = false;
function scheduleUnlockDialog() {
  if (unlockScheduled || !unlockDialog) return;
  unlockScheduled = true;
  const show = () => {
    unlockScheduled = false;
    if (!unlockDialog.open) unlockDialog.showModal();
  };
  const victory = $('#victoryDialog');
  if (victory?.open) victory.addEventListener('close', () => setTimeout(show, 120), { once: true });
  else setTimeout(show, 100);
}

function maybeAnnounceUnlock() {
  if (!projectUnlocked()) return;
  const save = readSave();
  if (save.projectiveUnlockSeen) return;
  patchSave({ projectiveUnlockSeen: true });
  scheduleUnlockDialog();
}

function renderProjective() {
  renderGate();
  if (projectUnlocked()) renderChallenges();
  renderSecretReward();
  maybeAnnounceUnlock();
}

function openProjectivePanel() {
  if (!projectUnlocked()) {
    renderGate();
    lockDialog?.showModal();
    return;
  }
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((button) => button.classList.remove('active'));
  projectPanel?.classList.add('active');
  renderProjective();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeProjectivePanel() {
  projectPanel?.classList.remove('active');
  const levelsPanel = $('#levelsPanel');
  levelsPanel?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach((button) => button.classList.toggle('active', button.dataset.tab === 'levels'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let revealStage = -1;
let revealTimer = null;
let revealRunning = false;

function revealSvg() {
  return $('#circularProjectiveGraphic .circular-projective-svg');
}

function clearRevealTimer() {
  if (revealTimer) clearTimeout(revealTimer);
  revealTimer = null;
  if (celebrationTimer) clearTimeout(celebrationTimer);
  celebrationTimer = null;
}

function familyIndexFor(direction) {
  return DIRECTIONS.findIndex((item) => String(item.key) === String(direction));
}

function activateDirection(direction) {
  const index = familyIndexFor(direction);
  if (index < 0) return;
  revealSvg()?.querySelector(`.circle-family-${index}`)?.classList.add('active');
}

function prepareReveal() {
  const graphic = $('#circularProjectiveGraphic');
  graphic.innerHTML = circularProjectiveSvg();
  revealStage = -1;
  revealRunning = true;
  clearRevealTimer();
  $('#projectiveSummary').classList.add('hidden');
  $('#spotItCard').classList.add('hidden');
  $('#awardCredentialBtn').disabled = true;
  $('#awardCredentialBtn').textContent = 'Completa la construcción';
  $('#projectiveNextStageBtn').disabled = false;
  $('#projectiveNextStageBtn').textContent = 'Siguiente etapa';
  typeProjectiveNarration('Preparando nuevamente las construcciones que descubriste en los seis desafíos.');
}

function populateCelebration() {
  const container = $('#celebrationConfetti');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 76; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--x', `${Math.round(Math.random() * 100)}%`);
    piece.style.setProperty('--delay', `${(-Math.random() * 3.8).toFixed(2)}s`);
    piece.style.setProperty('--duration', `${(3.7 + Math.random() * 2.8).toFixed(2)}s`);
    piece.style.setProperty('--rot', `${Math.round(Math.random() * 180)}deg`);
    piece.style.setProperty('--drift', `${Math.round(-70 + Math.random() * 140)}px`);
    piece.style.setProperty('--color', CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
    container.appendChild(piece);
  }
}

function showFinalCelebration() {
  if (!celebrationDialog) return;
  populateCelebration();
  if (!celebrationDialog.open) celebrationDialog.showModal();
}

function finishReveal() {
  revealRunning = false;
  clearRevealTimer();
  const svg = revealSvg();
  svg?.classList.add('complete');
  $('#projectiveSummary').classList.remove('hidden');
  $('#spotItCard').classList.remove('hidden');
  $('#projectiveNextStageBtn').disabled = true;
  $('#projectiveNextStageBtn').textContent = 'Construcción completa';
  patchSave({ projectiveFinalRewardUnlocked: true });
  renderSecretReward();
  const award = $('#awardCredentialBtn');
  award.disabled = false;
  award.textContent = credentialEarned() ? 'Ver certificado' : 'Obtener certificado';
  typeProjectiveNarration('Al añadir la recta del infinito, completaste el plano proyectivo PG(2,7). La geometría oculta de Sudoproyective queda revelada.');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  celebrationTimer = setTimeout(showFinalCelebration, reduced ? 80 : 3000);
}

function stageDuration(stage) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 80;
  if (stage === 0) return 5600;
  if (stage === 1) return 5200;
  if (stage >= 2 && stage <= 6) return 3600;
  if (stage === 7) return 6500;
  if (stage === 8) return 7000;
  if (stage === 9) return 7600;
  return 1600;
}

function applyRevealStage(stage) {
  const svg = revealSvg();
  if (!svg) return;

  if (stage === 0) {
    typeProjectiveNarration('Ahora que completaste los desafíos, veamos todas las construcciones nuevamente.');
    return;
  }

  if (stage >= 1 && stage <= 6) {
    activateDirection(FINAL_REVEAL_ORDER[stage - 1]);
    if (stage === 1) {
      typeProjectiveNarration('Cada desafío reveló una familia de siete rectas con una pendiente distinta. Vamos a reunir las seis familias en un mismo esquema.');
    }
    return;
  }

  if (stage === 7) {
    activateDirection(0);
    typeProjectiveNarration('Además, para construir todas las direcciones del tablero, durante todo el juego utilizamos también las rectas horizontales y verticales.');
    return;
  }

  if (stage === 8) {
    activateDirection('inf');
    typeProjectiveNarration('Así que agregaremos esas dos direcciones que ya utilizamos: a las horizontales les diremos Ruta 0 y a las verticales, Ruta infinito.');
    return;
  }

  if (stage === 9) {
    svg.classList.add('show-rope');
    typeProjectiveNarration('Ahora tenemos ocho puntos del infinito. Agregaremos una última recta que pasa por todos ellos: la recta del infinito.');
    return;
  }

  finishReveal();
}

function advanceRevealStage(automatic = false) {
  if (!revealRunning && revealStage >= 10) return;
  clearRevealTimer();
  revealStage += 1;
  applyRevealStage(revealStage);
  if (revealStage >= 10) return;
  if (automatic || revealRunning) revealTimer = setTimeout(() => advanceRevealStage(true), stageDuration(revealStage));
}

function beginReveal() {
  if (!allUltraComplete()) return;
  const construction = $('#projectiveConstruction');
  construction.classList.remove('hidden');
  prepareReveal();
  construction.scrollIntoView({ behavior: 'smooth', block: 'start' });
  requestAnimationFrame(() => advanceRevealStage(true));
}

function replayReveal() {
  if (!allUltraComplete()) return;
  prepareReveal();
  requestAnimationFrame(() => advanceRevealStage(true));
}

function nextRevealStage() {
  if (!revealRunning) return;
  advanceRevealStage(false);
}

function awardCredential() {
  if (!allUltraComplete()) return;
  if (!credentialEarned()) patchSave({ projectiveCredential: true, projectiveFinalRewardUnlocked: true });
  renderSecretReward();
  $('#credentialStatus').textContent = 'DISTINCIÓN MATEMÁTICA DESBLOQUEADA';
  credentialDialog.showModal();
  renderProjective();
}

gateButton?.addEventListener('click', openProjectivePanel);
$('#projectiveBackBtn')?.addEventListener('click', closeProjectivePanel);
$('#projectiveRevealBtn')?.addEventListener('click', beginReveal);
$('#projectiveReplayBtn')?.addEventListener('click', replayReveal);
$('#projectiveNextStageBtn')?.addEventListener('click', nextRevealStage);
$('#awardCredentialBtn')?.addEventListener('click', awardCredential);
$('#credentialCloseBtn')?.addEventListener('click', () => credentialDialog.close());
$('#projectiveCelebrationContinue')?.addEventListener('click', () => {
  celebrationDialog?.close();
  $('#projectiveSummary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#unlockLaterBtn')?.addEventListener('click', () => unlockDialog.close());
$('#unlockOpenBtn')?.addEventListener('click', () => { unlockDialog.close(); openProjectivePanel(); });

window.addEventListener('sudoproyective:projective-change', renderProjective);
window.addEventListener('sudoproyective:ultra-return', (event) => {
  renderProjective();
  if (event.detail?.allDone) showToast('Las ocho direcciones ya pueden reunirse. La construcción final está disponible.');
});

const progressObserver = new MutationObserver(renderProjective);
if ($('#totalStarsTop')) progressObserver.observe($('#totalStarsTop'), { childList: true, subtree: true, characterData: true });

window.__SUDOP_PROJECTIVE__ = {
  open: openProjectivePanel,
  close: closeProjectivePanel,
  beginReveal,
  replayReveal,
  nextRevealStage,
  showCelebration: showFinalCelebration,
  render: renderProjective,
};

renderProjective();
