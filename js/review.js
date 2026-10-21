import { LEVELS } from './puzzles.js';
import { ULTRA_LEVELS } from './ultra.js';
import { DIRECTIONS, familySvg, circularProjectiveSvg } from './projective/visuals.js';

if (!window.__SUDOP_REVIEW__) throw new Error('review.js sólo debe cargarse con ?review=1');

const reviewStore = window.__SUDOP_REVIEW_STORAGE__;
const $ = (selector) => document.querySelector(selector);

function readSave() { return reviewStore.read(); }
function writeSave(next) {
  reviewStore.write(next);
  window.dispatchEvent(new CustomEvent('sudoproyective:projective-change'));
  refreshStatus();
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), 2600);
}

function injectUI() {
  if (!document.querySelector('link[href="review.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'review.css';
    document.head.appendChild(link);
  }

  const topbar = $('.topbar');
  if (topbar && !$('#reviewBanner')) {
    const banner = document.createElement('div');
    banner.id = 'reviewBanner';
    banner.className = 'review-banner';
    banner.textContent = '🛠 MODO REVISIÓN · el progreso real está protegido';
    topbar.insertAdjacentElement('afterend', banner);
  }

  if (!$('#reviewLauncher')) {
    document.body.insertAdjacentHTML('beforeend', `
      <button id="reviewLauncher" class="review-launcher">🛠 Revisión</button>
      <div class="review-floating-actions"><button id="reviewSolveVisible" class="review-mini">✓ Resolver pantalla</button><button id="reviewAlmostVisible" class="review-mini">1 casilla</button></div>
      <dialog id="reviewDialog" class="modal review-dialog">
        <div class="review-head"><div><p class="eyebrow">Herramientas de desarrollo</p><h2>Modo Revisión</h2><p id="reviewStatus" style="color:var(--muted);margin:0;font-size:.82rem;"></p></div><button id="reviewClose" class="icon-btn review-close" aria-label="Cerrar">×</button></div>
        <div class="review-map"><span>Campaña</span><span>60 difíciles</span><span>Proyectivo</span><span>6 Ultra</span><span>PG(2,7)</span><span>Credencial</span></div>

        <section class="review-section"><h3>1 · Campaña</h3><p>Abre cualquier nivel. Los atajos flotantes permiten disparar rápidamente victoria o dejar una sola casilla.</p><div class="review-controls"><select id="reviewRoute"></select><select id="reviewLevel"></select><button id="reviewOpenLevel" class="review-btn primary">Abrir nivel</button></div></section>

        <section class="review-section"><h3>2 · Entrada Proyectivo</h3><p>Comprueba el candado, el estado 59/60 y el aviso automático que aparece al completar el último difícil.</p><div class="review-grid three"><button class="review-btn" data-difficult="0">0/60 · bloqueado</button><button class="review-btn warn" data-difficult="59">59/60 · casi</button><button class="review-btn primary" data-difficult="60">60/60 · desbloquear</button></div><div class="review-grid" style="margin-top:8px;"><button id="reviewGateClick" class="review-btn">Tocar Proyectivo/candado</button><button id="reviewOpenProjective" class="review-btn primary">Abrir Proyectivo</button></div></section>

        <section class="review-section"><h3>3 · Ultraexperto</h3><p>Abre cualquiera de los seis desafíos o simula el conjunto completo.</p><div id="reviewUltraButtons" class="review-grid three"></div><div class="review-grid" style="margin-top:8px;"><button id="reviewUltraNone" class="review-btn">Marcar 0/6</button><button id="reviewUltraAll" class="review-btn primary">Marcar 6/6</button></div></section>

        <section class="review-section"><h3>4 · Familias de rectas</h3><p>Reproduce individualmente las ocho direcciones. Las siete rectas de cada familia se dibujan lentamente con colores distintos y convergen en su punto del infinito.</p><div id="reviewFamilyButtons" class="review-grid four"></div><div id="reviewStage" class="review-stage"><span style="color:var(--muted);font-size:.82rem;">Selecciona una familia o una etapa.</span></div></section>

        <section class="review-section"><h3>5 · Construcción circular</h3><p>Inspecciona la nueva visualización final o reproduce la secuencia completa con subtítulos.</p><div class="review-grid three"><button class="review-btn" data-circle="0">8 tableros</button><button class="review-btn" data-circle="4">4 direcciones</button><button class="review-btn" data-circle="8">8 direcciones</button><button class="review-btn warn" data-circle="rope">Recta del infinito</button><button class="review-btn primary" data-circle="complete">PG(2,7) completo</button><button id="reviewFullReveal" class="review-btn primary">▶ Secuencia completa</button></div></section>

        <section class="review-section"><h3>6 · Recompensa oculta</h3><p>Comprueba la versión ??? y la credencial final.</p><div class="review-grid"><button id="reviewCredentialLocked" class="review-btn">Ver como ???</button><button id="reviewCredentialEarned" class="review-btn primary">Mostrar credencial</button></div></section>

        <section class="review-section"><h3>Sesión de revisión</h3><p>Todo vive en una copia temporal del progreso.</p><div class="review-grid"><button id="reviewClean" class="review-btn">Estado limpio</button><button id="reviewResetReal" class="review-btn warn">Volver a copiar mi progreso real</button></div><p class="review-note">Salir de <code>?review=1</code> devuelve automáticamente el juego a tu progreso real.</p></section>
      </dialog>`);
  }

  $('#reviewRoute').innerHTML = Array.from({ length: 6 }, (_, i) => `<option value="${i + 1}">Ruta ${i + 1}</option>`).join('');
  $('#reviewLevel').innerHTML = Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}">Nivel ${i + 1}</option>`).join('');
  $('#reviewUltraButtons').innerHTML = ULTRA_LEVELS.map((item, i) => `<button class="review-btn" data-ultra="${i}">Ultra Ruta ${item.slope}</button>`).join('');
  $('#reviewFamilyButtons').innerHTML = DIRECTIONS.map((item) => `<button class="review-btn" data-family="${item.key}">${item.short}</button>`).join('');
}

function difficultLevels() { return LEVELS.filter((item) => item.difficulty === 'Difícil'); }

function setDifficultCount(count) {
  const save = readSave();
  const bestStars = { ...(save.bestStars || {}) };
  const difficult = difficultLevels();
  difficult.forEach((item) => { delete bestStars[item.id]; });
  difficult.slice(0, Math.max(0, Math.min(count, difficult.length))).forEach((item) => { bestStars[item.id] = 1; });
  const next = { ...save, bestStars };
  if (count < 60) {
    next.ultraCompleted = {};
    next.ultraLevels = {};
    next.projectiveCredential = false;
    delete next.projectiveUnlockSeen;
  } else {
    next.projectiveUnlockSeen = false;
    $('#reviewDialog')?.close();
  }
  writeSave(next);
  toast(`Estado de revisión: ${Math.min(count, 60)}/60 difíciles completados.`);
}

function ensureProjectUnlockedInShadow({ seen = true } = {}) {
  const save = readSave();
  const bestStars = { ...(save.bestStars || {}) };
  difficultLevels().forEach((item) => { if (!bestStars[item.id]) bestStars[item.id] = 1; });
  writeSave({ ...save, bestStars, projectiveUnlockSeen: seen });
}

function setUltraCount(all) {
  ensureProjectUnlockedInShadow({ seen: true });
  const save = readSave();
  const ultraCompleted = {};
  if (all) ULTRA_LEVELS.forEach((item) => { ultraCompleted[item.id] = true; });
  writeSave({ ...save, ultraCompleted, ultraLevels: {}, projectiveCredential: false });
  toast(all ? 'Revisión: 6/6 Ultraexpertos completados.' : 'Revisión: Ultraexpertos reiniciados.');
}

function openHubTab(tab) {
  if ($('#gameScreen')?.classList.contains('active')) $('#backBtn')?.click();
  if ($('#ultraGameScreen')?.classList.contains('active')) $('#ultraBackBtn')?.click();
  if (tab === 'projective') {
    window.__SUDOP_PROJECTIVE__?.open();
    return;
  }
  document.querySelector(`.nav-btn[data-tab="${tab}"]`)?.click();
}

function openCampaignLevel(route, localNumber) {
  $('#reviewDialog')?.close();
  openHubTab('levels');
  setTimeout(() => {
    [...document.querySelectorAll('#routeTabs .route-tab')][route - 1]?.click();
    requestAnimationFrame(() => [...document.querySelectorAll('#difficultySections .level-row')][localNumber - 1]?.click());
  }, 0);
}

function openUltra(index) {
  ensureProjectUnlockedInShadow({ seen: true });
  $('#reviewDialog')?.close();
  openHubTab('projective');
  setTimeout(() => [...document.querySelectorAll('#ultraChallengeGrid .ultra-card')][index]?.click(), 40);
}

function identifyNormalLevel() {
  const meta = $('#gameMeta')?.textContent || '';
  const title = $('#gameTitle')?.textContent || '';
  const route = Number(meta.match(/Ruta\s+(\d+)/)?.[1]);
  const local = Number(title.match(/Nivel\s+(\d+)/)?.[1]);
  return LEVELS.find((item) => item.world === route && item.localNumber === local) || null;
}

function identifyUltraLevel() {
  const meta = $('#ultraMeta')?.textContent || '';
  const route = Number(meta.match(/Ruta\s+(\d+)/)?.[1]);
  return ULTRA_LEVELS.find((item) => item.slope === route) || null;
}

function fillBoard(boardSelector, numberSelector, item, leaveOne = false) {
  const board = $(boardSelector);
  if (!board || !item) return false;
  const targets = [...board.querySelectorAll('.cell:not(.given)')];
  const limit = leaveOne ? Math.max(0, targets.length - 1) : targets.length;
  for (let i = 0; i < limit; i++) {
    const cell = targets[i];
    const row = Number(cell.dataset.row), col = Number(cell.dataset.col);
    const value = item.solution[row][col];
    cell.click();
    const numberButton = [...document.querySelectorAll(numberSelector)].find((button) => Number(button.dataset.number || button.textContent.trim()) === value);
    numberButton?.click();
  }
  return true;
}

function solveVisible(leaveOne = false) {
  if ($('#gameScreen')?.classList.contains('active')) {
    if (!fillBoard('#board', '#numbers .num-btn', identifyNormalLevel(), leaveOne)) toast('No pude identificar el nivel normal abierto.');
    else if (leaveOne) toast('Quedó una casilla editable pendiente.');
    return;
  }
  if ($('#ultraGameScreen')?.classList.contains('active')) {
    if (!fillBoard('#ultraBoard', '#ultraNumbers .num-btn', identifyUltraLevel(), leaveOne)) toast('No pude identificar el Ultraexperto abierto.');
    else if (leaveOne) toast('Quedó una casilla editable pendiente.');
    return;
  }
  toast('Abre primero un nivel o un Ultraexperto.');
}

function showFamily(direction) {
  const meta = DIRECTIONS.find((item) => String(item.key) === String(direction));
  $('#reviewStage').innerHTML = `<div style="text-align:center;width:100%;"><p class="eyebrow">${meta.label}</p><strong>7 rectas · 7 colores · 1 punto del infinito</strong>${familySvg(meta.key, { compact: false, animated: true, extendToInfinity: true })}</div>`;
}

function showCircularStage(stage) {
  const root = $('#reviewStage');
  root.innerHTML = `<div style="width:100%;"><p class="eyebrow">Construcción circular</p><div class="review-circle-preview">${circularProjectiveSvg()}</div></div>`;
  const svg = root.querySelector('.circular-projective-svg');
  let count = Number(stage);
  if (stage === 'rope' || stage === 'complete') count = 8;
  for (let i = 0; i < count; i++) svg.querySelector(`.circle-family-${i}`)?.classList.add('active');
  if (stage === 'rope' || stage === 'complete') svg.classList.add('show-rope');
  if (stage === 'complete') svg.classList.add('complete');
}

function runFullReveal() {
  setUltraCount(true);
  $('#reviewDialog')?.close();
  openHubTab('projective');
  setTimeout(() => window.__SUDOP_PROJECTIVE__?.beginReveal(), 80);
}

function setCredential(earned, show = false) {
  const save = readSave();
  writeSave({ ...save, projectiveCredential: earned });
  if (show) {
    $('#reviewDialog')?.close();
    $('#credentialStatus').textContent = 'DISTINCIÓN MATEMÁTICA · MODO REVISIÓN';
    $('#credentialDialog')?.showModal();
  }
}

function cleanState() {
  writeSave({ levels: {}, bestStars: {}, availableStars: 0, trophies: {}, seenDirections: {}, selectedWorldId: 1 });
  toast('Modo revisión: estado limpio.');
}

function refreshStatus() {
  const save = readSave();
  const difficultDone = difficultLevels().filter((item) => Number(save.bestStars?.[item.id] || 0) > 0).length;
  const ultraDone = ULTRA_LEVELS.filter((item) => save.ultraCompleted?.[item.id]).length;
  const status = $('#reviewStatus');
  if (status) status.textContent = `Temporal: ${difficultDone}/60 difíciles · ${ultraDone}/6 Ultra · credencial ${save.projectiveCredential ? 'sí' : 'no'}`;
}

function bind() {
  $('#reviewLauncher').addEventListener('click', () => { refreshStatus(); $('#reviewDialog').showModal(); });
  $('#reviewClose').addEventListener('click', () => $('#reviewDialog').close());
  $('#reviewOpenLevel').addEventListener('click', () => openCampaignLevel(Number($('#reviewRoute').value), Number($('#reviewLevel').value)));
  document.querySelectorAll('[data-difficult]').forEach((button) => button.addEventListener('click', () => setDifficultCount(Number(button.dataset.difficult))));
  $('#reviewGateClick').addEventListener('click', () => { $('#reviewDialog').close(); $('#projectiveRouteGate')?.click(); });
  $('#reviewOpenProjective').addEventListener('click', () => { ensureProjectUnlockedInShadow({ seen: true }); $('#reviewDialog').close(); openHubTab('projective'); });
  document.querySelectorAll('[data-ultra]').forEach((button) => button.addEventListener('click', () => openUltra(Number(button.dataset.ultra))));
  $('#reviewUltraNone').addEventListener('click', () => setUltraCount(false));
  $('#reviewUltraAll').addEventListener('click', () => setUltraCount(true));
  document.querySelectorAll('[data-family]').forEach((button) => button.addEventListener('click', () => showFamily(button.dataset.family === 'inf' ? 'inf' : Number(button.dataset.family))));
  document.querySelectorAll('[data-circle]').forEach((button) => button.addEventListener('click', () => showCircularStage(button.dataset.circle)));
  $('#reviewFullReveal').addEventListener('click', runFullReveal);
  $('#reviewCredentialLocked').addEventListener('click', () => setCredential(false, false));
  $('#reviewCredentialEarned').addEventListener('click', () => setCredential(true, true));
  $('#reviewClean').addEventListener('click', cleanState);
  $('#reviewResetReal').addEventListener('click', () => { reviewStore.resetFromReal(); window.dispatchEvent(new CustomEvent('sudoproyective:projective-change')); refreshStatus(); toast('Se volvió a copiar el progreso real.'); });
  $('#reviewSolveVisible').addEventListener('click', () => solveVisible(false));
  $('#reviewAlmostVisible').addEventListener('click', () => solveVisible(true));
}

injectUI();
bind();
refreshStatus();
