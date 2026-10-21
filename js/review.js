import { LEVELS } from './puzzles.js';
import { ULTRA_LEVELS } from './ultra.js';
import { familySvg, finalPlaneSvg } from './projective/visuals.js';

if (!window.__SUDOP_REVIEW__) {
  throw new Error('review.js sólo debe cargarse con ?review=1');
}

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
      <div class="review-floating-actions">
        <button id="reviewSolveVisible" class="review-mini">✓ Resolver pantalla</button>
        <button id="reviewAlmostVisible" class="review-mini">1 casilla</button>
      </div>
      <dialog id="reviewDialog" class="modal review-dialog">
        <div class="review-head">
          <div><p class="eyebrow">Herramientas de desarrollo</p><h2>Modo Revisión</h2><p id="reviewStatus" style="color:var(--muted);margin:0;font-size:.82rem;"></p></div>
          <button id="reviewClose" class="icon-btn review-close" aria-label="Cerrar">×</button>
        </div>
        <div class="review-map" aria-label="Mapa del recorrido final">
          <span>Campaña</span><span>60 difíciles</span><span>6 Ultra</span><span>AG(2,7)</span><span>PG(2,7)</span><span>Credencial</span>
        </div>

        <section class="review-section">
          <h3>1 · Campaña</h3><p>Abre directamente cualquier nivel de las seis rutas. Puedes resolverlo automáticamente o dejar sólo una casilla pendiente.</p>
          <div class="review-controls"><select id="reviewRoute"></select><select id="reviewLevel"></select><button id="reviewOpenLevel" class="review-btn primary">Abrir nivel</button></div>
        </section>

        <section class="review-section">
          <h3>2 · Desbloqueo del Proyecto</h3><p>Simula la progresión que controla la pestaña Proyecto. Sólo cambia la copia temporal de esta sesión.</p>
          <div class="review-grid three">
            <button class="review-btn" data-difficult="0">0/60 · bloqueado</button>
            <button class="review-btn warn" data-difficult="59">59/60 · casi</button>
            <button class="review-btn primary" data-difficult="60">60/60 · desbloquear</button>
          </div>
        </section>

        <section class="review-section">
          <h3>3 · Ultraexperto</h3><p>Abre cualquiera de los seis desafíos finales o simula el conjunto completo para comprobar la revelación final.</p>
          <div id="reviewUltraButtons" class="review-grid three"></div>
          <div class="review-grid" style="margin-top:8px;">
            <button id="reviewUltraNone" class="review-btn">Marcar 0/6</button>
            <button id="reviewUltraAll" class="review-btn primary">Marcar 6/6</button>
          </div>
        </section>

        <section class="review-section">
          <h3>4 · Animaciones geométricas</h3><p>Reproduce cada familia por separado o inspecciona manualmente las etapas de la construcción.</p>
          <div id="reviewFamilyButtons" class="review-grid three"></div>
          <div class="review-grid three" style="margin-top:8px;">
            <button class="review-btn" data-stage="points">49 puntos</button>
            <button class="review-btn" data-stage="routes">42 rectas</button>
            <button class="review-btn" data-stage="rows">+ filas</button>
            <button class="review-btn" data-stage="affine">+ columnas · AG</button>
            <button class="review-btn" data-stage="infinity">8 puntos ∞</button>
            <button class="review-btn primary" data-stage="projective">recta ∞ · PG</button>
          </div>
          <div id="reviewStage" class="review-stage"><span style="color:var(--muted);font-size:.82rem;">Selecciona una animación o etapa.</span></div>
          <button id="reviewFullReveal" class="review-btn warn" style="width:100%;margin-top:8px;">▶ Reproducir secuencia completa en Proyecto</button>
        </section>

        <section class="review-section">
          <h3>5 · Recompensa oculta</h3><p>Comprueba la versión bloqueada y la credencial final sin alterar el premio real del jugador.</p>
          <div class="review-grid">
            <button id="reviewCredentialLocked" class="review-btn">Ver como ???</button>
            <button id="reviewCredentialEarned" class="review-btn primary">Mostrar credencial</button>
          </div>
        </section>

        <section class="review-section">
          <h3>Sesión de revisión</h3><p>La copia temporal puede reiniciarse sin tocar el progreso almacenado fuera de <code>?review=1</code>.</p>
          <div class="review-grid">
            <button id="reviewClean" class="review-btn">Estado completamente limpio</button>
            <button id="reviewResetReal" class="review-btn warn">Volver a copiar mi progreso real</button>
          </div>
          <p class="review-note">Al salir de esta URL, Sudoproyective vuelve a usar automáticamente el progreso real. Ninguna simulación de este panel se guarda allí.</p>
        </section>
      </dialog>`);
  }

  const route = $('#reviewRoute');
  const level = $('#reviewLevel');
  route.innerHTML = Array.from({length:6}, (_,i) => `<option value="${i+1}">Ruta ${i+1}</option>`).join('');
  level.innerHTML = Array.from({length:30}, (_,i) => `<option value="${i+1}">Nivel ${i+1}</option>`).join('');

  $('#reviewUltraButtons').innerHTML = ULTRA_LEVELS.map((item,i) => `<button class="review-btn" data-ultra="${i}">Ultra Ruta ${item.slope}</button>`).join('');
  $('#reviewFamilyButtons').innerHTML = [1,2,3,4,5,6].map((s) => `<button class="review-btn" data-family="${s}">Animar Ruta ${s}</button>`).join('');
}

function difficultLevels() { return LEVELS.filter((item) => item.difficulty === 'Difícil'); }

function setDifficultCount(count) {
  const save = readSave();
  const bestStars = { ...(save.bestStars || {}) };
  const difficult = difficultLevels();
  difficult.forEach((item) => { delete bestStars[item.id]; });
  difficult.slice(0, Math.max(0, Math.min(count, difficult.length))).forEach((item) => { bestStars[item.id] = 1; });
  writeSave({ ...save, bestStars });
  toast(`Estado de revisión: ${Math.min(count,60)}/60 difíciles completados.`);
}

function ensureProjectUnlockedInShadow() {
  const save = readSave();
  const bestStars = { ...(save.bestStars || {}) };
  difficultLevels().forEach((item) => { if (!bestStars[item.id]) bestStars[item.id] = 1; });
  writeSave({ ...save, bestStars });
}

function setUltraCount(all) {
  ensureProjectUnlockedInShadow();
  const save = readSave();
  const ultraCompleted = {};
  if (all) ULTRA_LEVELS.forEach((item) => { ultraCompleted[item.id] = true; });
  writeSave({ ...save, ultraCompleted, ultraLevels: {}, projectiveCredential: false });
  toast(all ? 'Revisión: 6/6 Ultraexpertos completados.' : 'Revisión: Ultraexpertos reiniciados.');
}

function openHubTab(tab) {
  if ($('#gameScreen')?.classList.contains('active')) $('#backBtn')?.click();
  if ($('#ultraGameScreen')?.classList.contains('active')) $('#ultraBackBtn')?.click();
  const button = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
  button?.click();
}

function openCampaignLevel(route, localNumber) {
  $('#reviewDialog')?.close();
  openHubTab('levels');
  setTimeout(() => {
    const routeButtons = [...document.querySelectorAll('#routeTabs .route-tab')];
    routeButtons[route - 1]?.click();
    requestAnimationFrame(() => {
      const rows = [...document.querySelectorAll('#difficultySections .level-row')];
      rows[localNumber - 1]?.click();
    });
  }, 0);
}

function openUltra(index) {
  ensureProjectUnlockedInShadow();
  window.dispatchEvent(new CustomEvent('sudoproyective:projective-change'));
  $('#reviewDialog')?.close();
  openHubTab('projective');
  setTimeout(() => {
    const cards = [...document.querySelectorAll('#ultraChallengeGrid .ultra-card')];
    cards[index]?.click();
  }, 20);
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
  for (let i=0; i<limit; i++) {
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
    const item = identifyNormalLevel();
    if (!fillBoard('#board', '#numbers .num-btn', item, leaveOne)) toast('No pude identificar el nivel normal abierto.');
    else if (leaveOne) toast('Quedó una casilla editable pendiente.');
    return;
  }
  if ($('#ultraGameScreen')?.classList.contains('active')) {
    const item = identifyUltraLevel();
    if (!fillBoard('#ultraBoard', '#ultraNumbers .num-btn', item, leaveOne)) toast('No pude identificar el Ultraexperto abierto.');
    else if (leaveOne) toast('Quedó una casilla editable pendiente.');
    return;
  }
  toast('Abre primero un nivel o un Ultraexperto.');
}

function showFamily(slope) {
  const stage = $('#reviewStage');
  stage.innerHTML = `<div style="text-align:center;width:100%;"><p class="eyebrow">Ruta ${slope}</p><strong>7 rectas de pendiente ${slope}</strong>${familySvg(slope,{compact:false,animated:true})}</div>`;
}

function galleryFor(directions, title) {
  const stage = $('#reviewStage');
  stage.innerHTML = `<div style="width:100%;"><p class="eyebrow">${title}</p><div id="reviewDirectionGallery" class="direction-gallery"></div></div>`;
  const root = $('#reviewDirectionGallery');
  directions.forEach((direction,index) => {
    const card = document.createElement('article');
    card.className = 'direction-family-card';
    const label = direction === 'inf' ? '∞ · columnas' : direction === 0 ? '0 · filas' : `${direction} · Ruta ${direction}`;
    card.innerHTML = `${familySvg(direction)}<strong>${label}</strong><small>7 rectas</small>`;
    card.style.setProperty('--delay',`${index*.08}s`);
    root.appendChild(card);
  });
}

function showPlane({ infinityPoints = false, infinityLine = false } = {}) {
  const stage = $('#reviewStage');
  stage.innerHTML = `<div style="width:100%;text-align:center;"><p class="eyebrow">${infinityLine ? 'PG(2,7)' : infinityPoints ? 'Añadiendo el infinito' : '49 puntos afines'}</p>${finalPlaneSvg()}</div>`;
  stage.querySelectorAll('.plane-infinity-point,.plane-label').forEach((el) => {
    el.style.opacity = infinityPoints || infinityLine ? '1' : '0';
    if (el.classList.contains('plane-infinity-point')) el.style.transform = infinityPoints || infinityLine ? 'scale(1.12)' : 'scale(1)';
  });
  const line = stage.querySelector('.infinity-line');
  if (line) {
    line.style.opacity = infinityLine ? '1' : '0';
    line.style.strokeDashoffset = infinityLine ? '0' : '230';
  }
}

function showStage(name) {
  if (name === 'points') return showPlane();
  if (name === 'routes') return galleryFor([1,2,3,4,5,6],'42 rectas · seis pendientes');
  if (name === 'rows') return galleryFor([0,1,2,3,4,5,6],'49 rectas · añadimos las filas');
  if (name === 'affine') return galleryFor([0,1,2,3,4,5,6,'inf'],'56 rectas · AG(2,7) completo');
  if (name === 'infinity') return showPlane({infinityPoints:true});
  if (name === 'projective') return showPlane({infinityPoints:true,infinityLine:true});
}

function runFullReveal() {
  setUltraCount(true);
  $('#reviewDialog')?.close();
  openHubTab('projective');
  setTimeout(() => $('#projectiveRevealBtn')?.click(), 60);
}

function setCredential(earned, show = false) {
  const save = readSave();
  writeSave({ ...save, projectiveCredential: earned });
  if (show) {
    $('#credentialStatus').textContent = 'DISTINCIÓN MATEMÁTICA · MODO REVISIÓN';
    $('#credentialDialog')?.showModal();
  } else {
    openHubTab('rewards');
  }
}

function cleanState() {
  reviewStore.write({ levels:{}, bestStars:{}, availableStars:0, trophies:{}, seenDirections:{}, selectedWorldId:1, ultraCompleted:{}, ultraLevels:{}, projectiveCredential:false });
  location.reload();
}

function refreshStatus() {
  const save = readSave();
  const difficultDone = difficultLevels().filter((item) => Number(save.bestStars?.[item.id] || 0) > 0).length;
  const ultraDone = ULTRA_LEVELS.filter((item) => Boolean(save.ultraCompleted?.[item.id])).length;
  const reward = save.projectiveCredential ? 'credencial visible' : 'credencial oculta';
  if ($('#reviewStatus')) $('#reviewStatus').textContent = `${difficultDone}/60 difíciles · ${ultraDone}/6 Ultra · ${reward}`;
}

injectUI();
refreshStatus();

$('#reviewLauncher')?.addEventListener('click', () => { refreshStatus(); $('#reviewDialog')?.showModal(); });
$('#reviewClose')?.addEventListener('click', () => $('#reviewDialog')?.close());
$('#reviewOpenLevel')?.addEventListener('click', () => openCampaignLevel(Number($('#reviewRoute').value), Number($('#reviewLevel').value)));
$('#reviewSolveVisible')?.addEventListener('click', () => solveVisible(false));
$('#reviewAlmostVisible')?.addEventListener('click', () => solveVisible(true));

document.querySelectorAll('[data-difficult]').forEach((button) => button.addEventListener('click', () => setDifficultCount(Number(button.dataset.difficult))));
document.querySelectorAll('[data-ultra]').forEach((button) => button.addEventListener('click', () => openUltra(Number(button.dataset.ultra))));
document.querySelectorAll('[data-family]').forEach((button) => button.addEventListener('click', () => showFamily(Number(button.dataset.family))));
document.querySelectorAll('[data-stage]').forEach((button) => button.addEventListener('click', () => showStage(button.dataset.stage)));

$('#reviewUltraNone')?.addEventListener('click', () => setUltraCount(false));
$('#reviewUltraAll')?.addEventListener('click', () => setUltraCount(true));
$('#reviewFullReveal')?.addEventListener('click', runFullReveal);
$('#reviewCredentialLocked')?.addEventListener('click', () => setCredential(false,false));
$('#reviewCredentialEarned')?.addEventListener('click', () => { setUltraCount(true); setCredential(true,true); });
$('#reviewClean')?.addEventListener('click', cleanState);
$('#reviewResetReal')?.addEventListener('click', () => { reviewStore.resetFromReal(); location.reload(); });

window.addEventListener('sudoproyective:projective-change', refreshStatus);