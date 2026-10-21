import { ULTRA_LEVELS } from './ultra.js';
import { ensureProjectiveUI } from './projective/ui.js';
import { renderDirectionGallery, finalPlaneSvg } from './projective/visuals.js';
import {
  projectUnlocked,
  difficultProgress,
  ultraCompletedMap,
  allUltraComplete,
  credentialEarned,
  patchSave,
} from './projective/storage.js';

ensureProjectiveUI();
const { startUltra } = await import('./projective/ultra-game.js');

const $ = (selector) => document.querySelector(selector);
const projectPanel = $('#projectivePanel');
const projectNav = document.querySelector('.nav-btn[data-tab="projective"]');
const secretRewardSlot = $('#secretRewardSlot');
const credentialDialog = $('#credentialDialog');

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

function renderProjective() {
  if (!projectPanel || !projectNav) return;
  const unlocked = projectUnlocked();
  const progress = difficultProgress();
  projectNav.classList.toggle('project-locked', !unlocked);
  projectNav.setAttribute('aria-disabled', String(!unlocked));
  projectNav.querySelector('span').textContent = unlocked ? '◇' : '🔒';
  $('#projectLockCard')?.classList.toggle('hidden', unlocked);
  $('#projectUnlockedContent')?.classList.toggle('hidden', !unlocked);
  if ($('#projectLockProgress')) $('#projectLockProgress').textContent = `${progress.done}/${progress.total} desafíos difíciles completados`;
  if ($('#projectLockBar')) $('#projectLockBar').style.width = `${Math.round((progress.done / progress.total) * 100)}%`;
  if (unlocked) renderChallenges();
  renderSecretReward();
}

// La pestaña se inyecta después de que app.js registra su navegación, por eso gestiona su propio clic.
document.addEventListener('click', (event) => {
  const target = event.target.closest?.('.nav-btn[data-tab="projective"]');
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!projectUnlocked()) {
    const {done,total} = difficultProgress();
    showToast(`Proyecto bloqueado: completa los niveles Difíciles de las seis rutas (${done}/${total}).`);
    return;
  }
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === 'projective');
  });
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === 'projective');
  });
  renderProjective();
}, true);

function beginReveal() {
  if (!allUltraComplete()) return;
  renderDirectionGallery($('#directionGallery'));
  $('#finalPlaneGraphic').innerHTML = finalPlaneSvg();
  const construction = $('#projectiveConstruction');
  construction.classList.remove('hidden', 'running');
  void construction.offsetWidth;
  construction.classList.add('running');
  construction.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const button = $('#awardCredentialBtn');
  button.disabled = true;
  button.textContent = 'Construyendo PG(2,7)…';
  clearTimeout(beginReveal.timer);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  beginReveal.timer = setTimeout(() => {
    button.disabled = false;
    button.textContent = credentialEarned() ? 'Ver Trofeo Proyectivo' : 'Recibir distinción final';
  }, reduced ? 100 : 6100);
}

function awardCredential() {
  if (!allUltraComplete()) return;
  if (!credentialEarned()) patchSave({ projectiveCredential: true });
  renderSecretReward();
  $('#credentialStatus').textContent = 'DISTINCIÓN MATEMÁTICA DESBLOQUEADA';
  credentialDialog.showModal();
  renderProjective();
}

$('#projectiveRevealBtn')?.addEventListener('click', beginReveal);
$('#awardCredentialBtn')?.addEventListener('click', awardCredential);
$('#credentialCloseBtn')?.addEventListener('click', () => credentialDialog.close());

window.addEventListener('sudoproyective:projective-change', renderProjective);
window.addEventListener('sudoproyective:ultra-return', (event) => {
  renderProjective();
  if (event.detail?.allDone) showToast('Las ocho direcciones ya pueden reunirse. La construcción final está disponible.');
});

const progressObserver = new MutationObserver(renderProjective);
if ($('#totalStarsTop')) progressObserver.observe($('#totalStarsTop'), { childList: true, subtree: true, characterData: true });

renderProjective();
