import { ULTRA_LEVELS } from './ultra.js';
import { ensureProjectiveUI } from './projective/ui.js';
import { DIRECTIONS, circularProjectiveSvg } from './projective/visuals.js';
import {
  projectUnlocked,
  difficultProgress,
  ultraCompletedMap,
  allUltraComplete,
  credentialEarned,
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
const lockDialog = $('#projectiveLockDialog');
const unlockDialog = $('#projectiveUnlockDialog');

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2900);
}

function renderSecretReward() {
  if (!secretRewardSlot) return;
  const earned = credentialEarned();
  secretRewardSlot.innerHTML = `
    <article class="secret-reward ${earned ? 'earned' : 'locked'}">
      <div class="secret-emblem">${earned ? '◇' : '?'}</div>
      <div>
        <p class="eyebrow">Distinción especial</p>
        <strong>${earned ? 'Trofeo Proyectivo' : 'Recompensa oculta'}</strong>
        <p>${earned
          ? 'Has recibido una distinción que no pertenece al sistema normal de trofeos.'
          : 'Existe una recompensa más allá del camino habitual. Su naturaleza permanece oculta.'}</p>
      </div>
      ${earned
        ? '<button id="openCredentialFromRewards" class="small-btn secret-open">Ver credencial</button>'
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

const FAMILY_TEXT = DIRECTIONS.map((direction) => {
  if (direction.key === 0) return 'Comenzamos con las 7 filas: son la dirección m = 0. Sus siete rectas reciben el primer punto del infinito.';
  if (direction.key === 'inf') return 'Terminamos las direcciones afines con las 7 columnas: la dirección vertical m = ∞. Aparece el octavo punto del infinito.';
  return `Ahora se forma ${direction.short}: las 7 rectas de pendiente ${direction.key} se distinguen por color y se prolongan hacia un mismo punto del infinito.`;
});

let revealStage = -1;
let revealTimer = null;
let revealRunning = false;

function revealSvg() {
  return $('#circularProjectiveGraphic .circular-projective-svg');
}

function clearRevealTimer() {
  if (revealTimer) clearTimeout(revealTimer);
  revealTimer = null;
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
  $('#projectiveSubtitle').textContent = 'Los ocho dibujos representan las ocho direcciones del mismo plano afín de 49 puntos.';
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
  const award = $('#awardCredentialBtn');
  award.disabled = false;
  award.textContent = credentialEarned() ? 'Ver Trofeo Proyectivo' : 'Recibir distinción final';
  $('#projectiveSubtitle').innerHTML = '<strong>PG(2,7) está completo.</strong> Tenemos 57 puntos y 57 rectas. La geometría oculta de Sudoproyective queda revelada.';
}

function stageDuration(stage) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 80;
  if (stage === 0) return 2200;
  if (stage >= 1 && stage <= 8) return 3900;
  if (stage === 9) return 4800;
  return 1600;
}

function applyRevealStage(stage) {
  const svg = revealSvg();
  if (!svg) return;

  if (stage === 0) {
    $('#projectiveSubtitle').textContent = 'Cada mini-tablero representa la misma colección de 49 puntos, organizada según una de las ocho direcciones de AG(2,7).';
    return;
  }

  if (stage >= 1 && stage <= 8) {
    const index = stage - 1;
    svg.querySelector(`.circle-family-${index}`)?.classList.add('active');
    $('#projectiveSubtitle').textContent = FAMILY_TEXT[index];
    return;
  }

  if (stage === 9) {
    svg.classList.add('show-rope');
    $('#projectiveSubtitle').innerHTML = '<strong>Ya tenemos 8 puntos del infinito.</strong> Todos pertenecen a una misma recta. La cuerda que aparece es una representación esquemática de esa única recta: la recta del infinito.';
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
  if (!credentialEarned()) patchSave({ projectiveCredential: true });
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
  render: renderProjective,
};

renderProjective();
