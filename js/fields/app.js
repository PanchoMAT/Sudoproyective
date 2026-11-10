import { LEVELS as F7_LEVELS } from '../puzzles.js';
import {
  FIELD_CAMPAIGNS, FIELD_CONFIG, blankFieldProgress, readFieldProgress,
  writeFieldProgress, fieldRouteTrophy, fieldRouteStars, fieldPlatinum,
  fieldProgressSummary, fieldHardFinished, fieldUltraFinished,
  mod, routeCells,
} from './core.js';
import { createFieldGame } from './game.js';
import { fieldDirections, slopeName, circularFieldProjectiveSvg, ultraFieldRevealSvg } from './visuals.js';

const $ = (selector) => document.querySelector(selector);
const F7_KEY = 'sudoproyective-v02';
const DIFFICULTY = ['Fácil', 'Intermedio', 'Difícil'];
const TROPHY = { Oro: '🥇', Plata: '🥈', Bronce: '🥉', Pendiente: '○' };
let selectedField = 7, selectedRoute = 1, selectedTab = 'levels';
let lastItem = null, lastUltra = false, animationId = null, revealStep = 0;
let ultraTimers = [];

function readF7() {
  try { return JSON.parse(localStorage.getItem(F7_KEY)) || {}; }
  catch { return {}; }
}
function platinum7() {
  const best = readF7().bestStars || {};
  return F7_LEVELS.every((item) => Number(best[item.id] || 0) === 3);
}
function platinum(p) { return fieldPlatinum(p, readFieldProgress()[p]); }
function superPlatinum() { return platinum(3) && platinum(5) && platinum7() && platinum(9) && platinum(11); }
// Las distinciones ya ganadas no deben desaparecer al ampliarse la campaña.
// Se registra una sola vez el estado histórico de los mundos disponibles antes de F11.
function preservePreviousSuperPlatinum() {
  const all = readFieldProgress();
  if (all.achievements?.fiveWorldMigrationDone) return;
  const three = platinum(3) && platinum(5) && platinum7();
  const four = three && platinum(9);
  all.achievements = { ...(all.achievements || {}),
    fiveWorldMigrationDone: true,
    previousSuperPlatinumWorlds: four ? 4 : three ? 3 : 0,
  };
  writeFieldProgress(all);
}
function previousSuperPlatinumWorlds() {
  return Number(readFieldProgress().achievements?.previousSuperPlatinumWorlds || 0);
}
function getWorld(p) { return readFieldProgress()[p]; }
function fieldName(p) { return '𝔽' + p; }
function starsText(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
function badge(t) { return (TROPHY[t] || '◇') + ' ' + t; }
function summary(p) {
  if (p === 7) {
    const best = readF7().bestStars || {};
    const done = F7_LEVELS.filter((item) => Number(best[item.id] || 0) > 0).length;
    const stars = F7_LEVELS.reduce((n, item) => n + Number(best[item.id] || 0), 0);
    return { done, total: 180, stars, maxStars: 540 };
  }
  return fieldProgressSummary(p, getWorld(p));
}
function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), 2700);
}

function addStyle() {
  if ($('#fieldWorldStyle')) return;
  const link = document.createElement('link');
  link.id = 'fieldWorldStyle';
  link.rel = 'stylesheet';
  link.href = 'field-worlds.css';
  document.head.appendChild(link);
}
function section(id, content) {
  const node = document.createElement('section');
  node.id = id;
  node.className = 'screen field-world-screen';
  node.innerHTML = content;
  $('.app-shell').insertBefore(node, $('#mainNav'));
  return node;
}
function createUI() {
  addStyle();
  const headingArea = $('.topbar > div:first-child');
  if (headingArea && !$('#fieldChooseWorldBtn')) {
    const btn = document.createElement('button');
    btn.id = 'fieldChooseWorldBtn';
    btn.className = 'field-switch-btn';
    btn.type = 'button';
    btn.textContent = '🌐 Mundos';
    btn.addEventListener('click', showHome);
    headingArea.appendChild(btn);
  }
  section('fieldWorldHome',
    '<div class="field-intro"><p class="hero-kicker">SudoProyectivo · mundos finitos</p>' +
    '<h2>Elige tu cuerpo basal</h2><p>La misma aventura geométrica, con distintos tamaños de tablero. ' +
    'Selecciona un cuerpo para descubrir sus rutas, puzzles y plano proyectivo.</p></div>' +
    '<div id="fieldWorldCards" class="field-world-cards"></div>' +
    '<div id="fieldSuperTrophy" class="field-super-trophy"></div>');
  section('fieldHubScreen', '<div id="fieldHubContent"></div>');
  section('fieldProjectiveScreen', '<div id="fieldProjectiveContent"></div>');
  section('fieldConstructionScreen', '<div id="fieldConstructionContent"></div>');
  section('fieldGameScreen',
    '<div class="field-game-head"><button id="fieldBack" class="icon-btn" type="button" aria-label="Volver">←</button>' +
    '<div class="field-game-name"><p id="fieldGameMeta" class="eyebrow"></p><h2 id="fieldGameTitle"></h2></div>' +
    '<span id="fieldTimer" class="timer">00:00</span></div>' +
    '<div class="field-board-help">Completa los números sin repetir en filas, columnas ni rutas.</div>' +
    '<div class="field-board-controls"><button id="fieldZoomBtn" class="mode-btn field-zoom-btn" type="button" data-field-action="zoom" aria-pressed="false" hidden>🔍 Ampliar tablero</button></div>' +
    '<div id="fieldBoardWrap" class="field-board-wrap"><div id="fieldBoard" class="field-board" role="grid"></div></div>' +
    '<div class="field-game-tools">' +
    '<button id="fieldNotes" class="mode-btn" type="button" aria-pressed="false">Notas ○</button>' +
    '<button id="fieldRoutes" class="mode-btn active" type="button" aria-pressed="true">Rutas ●</button>' +
    '<button id="fieldHint" class="mode-btn" type="button">Pista</button>' +
    '<button id="fieldReset" class="mode-btn field-reset" type="button">↺ Reiniciar nivel</button></div>' +
    '<div class="field-game-secondary">' +
    '<button id="fieldUndo" class="mode-btn" disabled type="button">↶ Deshacer</button>' +
    '<button id="fieldRedo" class="mode-btn" disabled type="button">↷ Rehacer</button>' +
    '<button id="fieldSolutionBtn" class="mode-btn" type="button" hidden>★★★ Ver solución</button></div>' +
    '<p id="fieldGameBalance" class="field-game-balance"></p>' +
    '<div class="field-keypad"><div id="fieldNumbers" class="field-number-buttons"></div>' +
    '<button id="fieldErase" class="field-digit field-erase" type="button" aria-label="Borrar">⌫</button></div>'
  );
  document.body.insertAdjacentHTML('beforeend',
    '<dialog id="fieldInvalid" class="modal field-modal"><h2>La solución todavía no es válida</h2>' +
    '<p id="fieldInvalidCount"></p><p>Revisa filas, columnas y rutas; no te diremos qué casillas son incorrectas.</p>' +
    '<button id="fieldInvalidClose" class="primary-btn">Seguir revisando</button></dialog>' +
    '<dialog id="fieldVictory" class="modal field-modal"><div class="field-celebrate">✦</div>' +
    '<h2 id="fieldVictoryTitle">¡Nivel completado!</h2><div id="fieldVictoryContent"></div>' +
    '<div class="field-modal-actions"><button id="fieldVictoryLevels" class="secondary-btn">Volver</button>' +
    '<button id="fieldVictoryNext" class="primary-btn">Siguiente</button></div></dialog>' +
    '<dialog id="fieldSolutionDialog" class="modal field-modal">' +
    '<p class="eyebrow">★★★ Solución desbloqueada</p><h2 id="fieldSolutionTitle">Solución</h2>' +
    '<p>Las pistas iniciales se distinguen de los números completados.</p>' +
    '<div id="fieldSolutionBoard" class="field-board field-solution-board"></div>' +
    '<button id="fieldSolutionClose" class="primary-btn" type="button">Cerrar</button></dialog>');
}

function showScreen(id) {
  if (animationId) { clearInterval(animationId); animationId = null; }
  document.querySelectorAll('main.app-shell > .screen').forEach((el) =>
    el.classList.toggle('active', el.id === id));
  $('#mainNav').classList.toggle('hidden', id !== 'hubScreen');
  document.body.classList.toggle('field-alt', id !== 'hubScreen');
  $('#fieldChooseWorldBtn')?.classList.toggle('hidden', id === 'fieldWorldHome');
}
function renderHome() {
  let html = '';
  for (const p of [3,5,7,9,11]) {
    const s = summary(p);
    const routes = p - 1;
    const perfect = p === 7 ? platinum7() : platinum(p);
    html += '<button type="button" class="field-world-card" data-field-action="enter" data-p="' + p + '">' +
      '<span class="field-world-crest">' + fieldName(p) + '</span>' +
      '<span class="field-world-copy"><strong>Mundo ' + fieldName(p) + '</strong>' +
      '<small>' + p + '×' + p + ' · ' + routes + ' rutas · ' + s.total + ' puzzles</small>' +
      '<small>' + s.done + '/' + s.total + ' completados · ' + s.stars + '/' + s.maxStars + '★</small>' +
      '<span class="field-progress-bar"><span style="width:' + Math.round(100*s.stars/s.maxStars) + '%"></span></span>' +
      '<span class="field-world-medal">' + (perfect ? '🏆 Platino conseguido' : 'Platino por conseguir') + '</span></span>' +
      '<span class="field-world-enter">Entrar</span></button>';
  }
  $('#fieldWorldCards').innerHTML = html;
  $('#fieldSuperTrophy').innerHTML = '<div class="field-super-icon">' +
    (superPlatinum() ? '🏆' : '◇') + '</div><div><strong>' +
    (superPlatinum() ? '¡Superplatino conseguido!' : 'Superplatino · el gran objetivo') +
    '</strong><p>Consigue el Platino de ' + fieldName(3) + ', ' +
    fieldName(5) + ', ' + fieldName(7) + ', ' + fieldName(9) + ' y ' + fieldName(11) + '. ' +
    (superPlatinum() ? '¡Has dominado los cinco mundos!' : 'Las cinco campañas deben tener todas sus rutas en Oro.') +
    '</p>' + (previousSuperPlatinumWorlds() ?
      '<p class="field-legacy-platinum">🏆 Súper Platino histórico conservado · ' +
      previousSuperPlatinumWorlds() + ' mundos.</p>' : '') + '</div>';
}
function leaveOtherScreens() {
  if ($('#gameScreen')?.classList.contains('active')) $('#backBtn')?.click();
  if ($('#ultraGameScreen')?.classList.contains('active')) $('#ultraBackBtn')?.click();
  clearUltraTimers();
  if ($('#fieldVictory')?.open) $('#fieldVictory').close();
  if ($('#fieldGameScreen')?.classList.contains('active')) fieldGame.close();
  if ($('#fieldSolutionDialog')?.open) $('#fieldSolutionDialog').close();
}
function showHome() {
  leaveOtherScreens();
  renderHome();
  showScreen('fieldWorldHome');
}
function enter(p) {
  leaveOtherScreens();
  if (p === 7) {
    selectedField = 7;
    showScreen('hubScreen');
    document.querySelector('.nav-btn[data-tab="levels"]')?.click();
    return;
  }
  selectedField = p;
  selectedRoute = Math.min(p - 1, Math.max(1, Number(getWorld(p).selectedRoute || 1)));
  selectedTab = 'levels';
  renderHub();
  showScreen('fieldHubScreen');
}
function pickRoute(slope) {
  selectedRoute = slope;
  const all = readFieldProgress();
  all[selectedField].selectedRoute = slope;
  writeFieldProgress(all);
  renderHub();
}
function renderHub() {
  const p = selectedField, cfg = FIELD_CAMPAIGNS[p];
  const world = getWorld(p), s = summary(p);
  const plat = fieldPlatinum(p, world);
  let content = '<div class="field-view-head"><button data-field-action="home" class="icon-btn" type="button">←</button>' +
    '<div><p class="eyebrow">Tablero ' + p + '×' + p + ' · ' + (p-1) + ' rutas</p>' +
    '<h2>Mundo ' + fieldName(p) + '</h2></div></div>' +
    '<div class="field-stats"><div><small>Completados</small><strong>' + s.done + '/' + s.total + '</strong></div>' +
    '<div><small>Estrellas</small><strong>' + s.stars + '/' + s.maxStars + '★</strong></div>' +
    '<div><small>Disponibles</small><strong>' + world.availableStars + '★</strong></div></div>' +
    '<div class="field-hub-tabs">';
  for (const [key, label] of [['levels','Niveles'],['trophies','Trofeos'],['rules','Reglas']]) {
    content += '<button data-field-action="tab" data-tab="' + key + '" class="' +
      (selectedTab === key ? 'active' : '') + '">' + label + '</button>';
  }
  content += '</div>';
  if (selectedTab === 'levels') {
    content += '<div class="field-route-tabs">';
    for (let m = 1; m < p; m++) {
      const medal = fieldRouteTrophy(p, m, world);
      content += '<button type="button" class="' + (m === selectedRoute ? 'active' : '') +
        '" data-field-action="route" data-route="' + m + '">Ruta ' + m +
        (p===9?'<span class="field-route-element">'+slopeName(p,m)+'</span>':'') +
        '<small>' + TROPHY[medal] + ' ' + fieldRouteStars(p,m,world) + '★</small></button>';
    }
    content += '</div><div class="field-levels">';
    for (let diff = 0; diff < 3; diff++) {
      content += '<h3>' + DIFFICULTY[diff] + ' <small>· ' + cfg.perDifficulty + ' puzzles</small></h3>';
      for (const item of cfg.levels.filter((it) => it.slope === selectedRoute && it.group === diff)) {
        const best = Number(world.bestStars[item.id] || 0);
        content += '<button class="field-level-row' + (best ? ' completed' : '') +
          '" data-field-action="level" data-id="' + item.id + '">' +
          '<span class="field-level-mark">' + (best ? '✓' : '○') + '</span>' +
          '<span><strong>Nivel ' + item.localNumber + '</strong>' +
          (best === 3 ? '<small>Solución desbloqueada</small>' : '') + '</span>' +
          '<span class="field-level-stars">' + starsText(best) + '</span></button>';
      }
    }
    content += '</div>';
    const hard = cfg.levels.filter((it) => it.group === 2);
    const doneHard = hard.filter((it) => Number(world.bestStars[it.id] || 0)>0).length;
    content += '<div class="field-project-gate"><strong>◇ Proyectivo de ' + fieldName(p) + '</strong>' +
      '<p>Completa los ' + hard.length + ' niveles Difíciles para desbloquear ' +
      (p-1) + ' desafíos Ultraexpertos y construir PG(2,' + p + ').</p>' +
      '<button data-field-action="projective" class="primary-btn" type="button">' +
      (doneHard === hard.length ? 'Entrar a Proyectivo' : '🔒 ' + doneHard + '/' + hard.length + ' difíciles') +
      '</button></div>';
    content += '<button class="text-btn danger-text field-clear-world" data-field-action="reset-world" type="button">Reiniciar progreso de ' + fieldName(p) + '</button>';
  } else if (selectedTab === 'trophies') {
    content += '<div class="field-trophies"><h3>Trofeos del mundo ' + fieldName(p) + '</h3>';
    for (let m=1;m<p;m++) {
      const stars = fieldRouteStars(p,m,world), per = cfg.perDifficulty * 3;
      const tier = fieldRouteTrophy(p,m,world);
      content += '<div class="field-trophy-line"><span>' + TROPHY[tier] +
        '</span><div><strong>Ruta ' + m + ' · ' + tier + '</strong><small>' +
        stars + '/' + (per*3) + '★ · Bronce ' + per +
        ' · Plata ' + 2*per + ' · Oro ' + 3*per + '</small></div></div>';
    }
    content += '<div class="field-trophy-line"><span>' + (plat?'🏆':'◇') +
      '</span><div><strong>Platino de ' + fieldName(p) + '</strong>' +
      '<small>' + (plat?'Conseguido': 'Consigue Oro en todas las rutas de este cuerpo.') +
      '</small></div></div>';
    if (world.finalSeen) content += '<div class="field-trophy-line"><span>✧</span><div><strong>Creador de PG(2,' +
      p + ')</strong><small>Construcción final descubierta</small></div></div>';
    content += '<p class="field-trophy-explain">Las copas de cada mundo son independientes. ' +
      'La Superplatino se obtiene al conseguir los tres Platinos.</p></div>';
  } else {
    content += '<div class="field-rules"><h3>Las tres reglas</h3><p>Completa cada tablero ' +
      p + '×' + p + ' con los símbolos del 1 al ' + p + '.</p>' +
      '<p><strong>1.</strong> No repitas números en ninguna fila.</p>' +
      '<p><strong>2.</strong> No repitas números en ninguna columna.</p>' +
      '<p><strong>3.</strong> Tampoco repitas números en las ' + p +
      ' casillas de cada ruta, que continúa por el borde opuesto.</p>' +
      (p===9
        ? '<p>Las rutas obedecen <strong>r − m·c = b</strong> en el cuerpo F₉. Los elementos son a+bα, con α²=2 y coeficientes módulo 3. Los símbolos 1–9 representan los nueve elementos; una ruta no siempre avanza con un salto constante de filas.</p>'
        : '<p>La pendiente m define rutas mediante <strong>r − m·c ≡ b (mod ' + p +
          ')</strong>. Las pendientes jugables son del 1 al ' + (p-1) + '.</p>') +
      '<p>Un nivel sin pistas usadas da 3★; con una, 2★; con dos o más, 1★. ' +
      'Las pistas cuestan 2★, 3★ o 4★ según la dificultad.</p>' +
      '<p>Al reunir las ' + (p+1) + ' direcciones (incluyendo filas y columnas) podrás ' +
      'construir <strong>PG(2,' + p + ')</strong> con ' +
      cfg.projectivePoints + ' puntos y ' + cfg.projectivePoints + ' rectas.</p></div>';
  }
  $('#fieldHubContent').innerHTML = content;
}
function startItem(item, ultra = false) {
  $('#fieldGameScreen').dataset.fieldSize = String(selectedField);
  $('#fieldBoardWrap').classList.remove('zoomed');
  $('#fieldZoomBtn').hidden = selectedField !== 11;
  $('#fieldZoomBtn').setAttribute('aria-pressed','false');
  $('#fieldZoomBtn').textContent = '🔍 Ampliar tablero';
  lastItem = item;
  lastUltra = ultra;
  fieldGame.open(selectedField, item, ultra);
  showScreen('fieldGameScreen');
}
function openProjective() {
  const p = selectedField, world = getWorld(p);
  if (!fieldHardFinished(p, world)) { toast('Completa antes todos los niveles Difíciles de este mundo.'); return; }
  renderProjective();
  showScreen('fieldProjectiveScreen');
}
function renderProjective() {
  const p = selectedField, cfg = FIELD_CAMPAIGNS[p], world = getWorld(p);
  let done = cfg.ultra.filter((it) => Boolean(world.ultraCompleted[it.id])).length;
  let html = '<div class="field-view-head"><button data-field-action="hub" class="icon-btn" type="button">←</button>' +
    '<div><p class="eyebrow">Desafío final · ' + done + '/' + cfg.ultra.length + '</p>' +
    '<h2>Proyectivo ' + fieldName(p) + '</h2></div></div>' +
    '<div class="field-project-intro"><strong>Descubre las direcciones ocultas</strong>' +
    '<p>Resuelve un Ultraexperto por pendiente. Al completar cada uno, los números se convierten en ' +
    'rectas que se reúnen en un nuevo punto del infinito.</p></div><div class="field-ultra-grid">';
  for (const item of cfg.ultra) {
    const finished = Boolean(world.ultraCompleted[item.id]);
    html += '<button data-field-action="ultra" data-id="' + item.id + '" type="button">' +
      '<span>' + (finished ? '✓' : '◇') + '</span><strong>Ruta ' + item.slope + '</strong>' +
      '<small>' + (finished ? 'Descubierta · Repetir' : 'Ultraexperto · Jugar') +
      '</small></button>';
  }
  html += '</div><div class="field-project-gate"><strong>Construcción de PG(2,' +
    p + ')</strong><p>Reúne las ' + (p-1) +
    ' pendientes con las filas, columnas y la recta del infinito.</p>';
  html += '<button data-field-action="construct" type="button" class="primary-btn"' +
    (!fieldUltraFinished(p,world) ? ' disabled' : '') + '>' +
    (fieldUltraFinished(p,world) ? 'Construir el plano proyectivo' :
      '🔒 Completa ' + (cfg.ultra.length - done) + ' desafíos restantes') +
    '</button></div>';
  $('#fieldProjectiveContent').innerHTML = html;
}

function clearUltraTimers() {
  for (const timer of ultraTimers) clearTimeout(timer);
  ultraTimers = [];
}
function scheduleUltra(callback, milliseconds) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  ultraTimers.push(setTimeout(callback, reduced ? Math.max(60, milliseconds * .02) : milliseconds));
}
function startUltraNarration(item, p) {
  clearUltraTimers();
  const root = $('#fieldVictoryContent');
  const svg = root.querySelector('.ultra-reveal-svg');
  const message = root.querySelector('.field-ultra-narration');
  const button = $('#fieldVictoryLevels');
  button.disabled = true;
  button.textContent = 'Observa la construcción…';
  root.classList.add('field-ultra-victory-content');
  const narrate = (text) => { if (message) message.textContent = text; };
  narrate('Completaste el desafío de Ruta ' + item.slope + '.');
  scheduleUltra(() => narrate('Unamos las rutas que acabas de crear. Todas tienen la misma inclinación —o pendiente— ' + item.slope + '.'),5600);
  scheduleUltra(() => svg?.classList.add('phase-lines'),9000);
  scheduleUltra(() => narrate('En cada una de las ' + p + ' rutas, los valores son distintos. Ahora los números dejan de ser lo importante: conservamos solamente las posiciones del tablero.'),15800);
  scheduleUltra(() => svg?.classList.add('phase-points'),19000);
  scheduleUltra(() => narrate('Hagamos que todas estas rectas se junten en un nuevo punto. Lo llamamos P_' + item.slope + '.'),24000);
  scheduleUltra(() => svg?.classList.add('phase-infinity'),27600);
  scheduleUltra(() => {
    svg?.classList.add('phase-complete');
    button.disabled = false;
    button.textContent = 'Continuar';
  },35000);
}

function onGameVictory({ item, p, ultra, runStars, delta, elapsed }) {
  const won = $('#fieldVictory'), title = $('#fieldVictoryTitle'),
        content = $('#fieldVictoryContent');
  clearUltraTimers();
  content.classList.remove('field-ultra-victory-content');
  $('#fieldVictory').classList.toggle('field-ultra-victory',ultra);
  $('#fieldVictoryLevels').disabled=false;
  if (ultra) {
    title.textContent = 'Ruta ' + item.slope + ' · de sudoku a geometría';
    content.innerHTML = '<div class="field-ultra-narration" aria-live="polite"></div>' +
      ultraFieldRevealSvg(item.solution,p,item.slope) +
      '<p class="field-geometry-note">Construcción de la dirección en ' + fieldName(p) +
      ': sus ' + p + ' rectas se reúnen en el punto P' + item.slope + '.</p>';
    $('#fieldVictoryNext').hidden = true;
    $('#fieldVictoryLevels').textContent = 'Observa la construcción…';
  } else {
    const best = Number(getWorld(p).bestStars[item.id] || 0);
    title.textContent = runStars === 3 ? '¡Recorrido impecable!' : '¡Nivel completado!';
    content.innerHTML = '<div class="field-win-stars">' + starsText(runStars) +
      '</div><p>' + Math.floor(elapsed/60) + ':' +
      String(elapsed%60).padStart(2,'0') + ' · ' +
      (runStars===3?'Sin pistas':runStars===2?'1 pista':'2 o más pistas') + '</p>' +
      '<p>' + (delta ? '+' + delta + '★ nuevas' : 'Tu mejor marca sigue en ' + best + '★') +
      ' · Mejor marca: ' + starsText(best) + '</p>' +
      (fieldPlatinum(p,getWorld(p)) ? '<p>🏆 ¡Platino del mundo ' +
        fieldName(p) + ' conseguido!</p>' : '') +
      (superPlatinum() ? '<p>🏆 ¡SÚPER PLATINO! Los cinco mundos están completos.</p>' : '');
    const cfg = FIELD_CAMPAIGNS[p];
    const next = cfg.levels.find((x)=>x.slope===item.slope && x.localNumber===item.localNumber+1);
    $('#fieldVictoryNext').hidden = !next;
    $('#fieldVictoryLevels').textContent = 'Ver niveles';
  }
  won.showModal();
  if (ultra) startUltraNarration(item,p);
}
function onGameExit(wasUltra, action) {
  clearUltraTimers();
  if (action === 'next' && !wasUltra && lastItem) {
    const next = FIELD_CAMPAIGNS[selectedField].levels.find((x)=>
      x.slope===lastItem.slope && x.localNumber===lastItem.localNumber+1);
    if (next) { startItem(next); return; }
  }
  if (wasUltra) { renderProjective(); showScreen('fieldProjectiveScreen'); }
  else { renderHub(); showScreen('fieldHubScreen'); }
}
function onWorldReset() {
  const p = selectedField;
  if (!confirm('¿Reiniciar el progreso de ' + fieldName(p) +
      '?\n\nSe perderán los niveles, estrellas y trofeos de este mundo. ' +
      'Los demás mundos y tu perfil no se alterarán.')) return;
  if (!confirm('Última confirmación: ¿borrar definitivamente el progreso de ' +
      fieldName(p) + '?')) return;
  const all = readFieldProgress();
  all[p] = blankFieldProgress();
  writeFieldProgress(all);
  selectedRoute = 1;
  selectedTab = 'levels';
  renderHub();
  toast('Progreso de ' + fieldName(p) + ' reiniciado.');
}
// Secuencia circular fiel al final de F7: familias, puntos del infinito y curva cerrada.
function revealStages(p) {
  return ['intro',...Array.from({length:p-1},(_,i)=>i+1),0,'inf','rope','complete'];
}
function renderConstruction() {
  const p=selectedField, stages=revealStages(p), step=revealStep, current=stages[step];
  const pointCount=p*p+p+1, root=$('#fieldConstructionContent');
  if (!root.querySelector('.field-circular-graphic') || root.dataset.field !== String(p)) {
    root.dataset.field=String(p);
    root.innerHTML =
      '<div class="field-view-head"><button data-field-action="projective-back" class="icon-btn" type="button" aria-label="Volver">←</button>' +
      '<div><p class="eyebrow" id="fieldConstructionStage"></p><h2>Construcción de PG(2,'+p+')</h2></div></div>' +
      '<div class="field-project-intro field-circular-narration"><p id="fieldConstructionNarration" aria-live="polite"></p></div>' +
      '<div class="field-circular-graphic circular-projective-graphic">'+circularFieldProjectiveSvg(p)+'</div>' +
      '<p class="projective-schematic-note">La disposición circular representa las incidencias. La curva cerrada final es una única recta: la recta del infinito.</p>' +
      '<div class="field-stats"><div><small>Puntos</small><strong>'+pointCount+'</strong></div>' +
      '<div><small>Rectas</small><strong>'+pointCount+'</strong></div>' +
      '<div><small>Por recta</small><strong>'+(p+1)+'</strong></div></div>' +
      '<div class="projective-animation-controls"><button id="fieldRevealNext" data-field-action="reveal-next" class="secondary-btn" type="button">Siguiente etapa</button>' +
      '<button data-field-action="reveal-replay" class="secondary-btn" type="button">↻ Repetir animación</button></div>' +
      '<div id="fieldFinalMessage" class="field-project-gate" hidden><strong>✧ ¡Plano proyectivo PG(2,'+p+') completado!</strong>' +
      '<p>La recta del infinito pasa por los '+(p+1)+' puntos del infinito. Dos rectas se cortan en un único punto.</p>' +
      '<button data-field-action="projective-back" class="primary-btn" type="button">Volver a Proyectivo</button></div>';
  }
  const svg=root.querySelector('.circular-projective-svg');
  const activeCount=Math.min(Math.max(0,step),p+1);
  for(let i=0;i<activeCount;i++) svg.querySelector('.circle-family-'+i)?.classList.add('active');
  if (current==='rope' || current==='complete') svg.classList.add('show-rope');
  if (current==='complete') svg.classList.add('complete');
  let narration;
  if (current==='intro') {
    narration='Ahora que completaste los desafíos, veamos nuevamente todas las construcciones.';
  } else if (typeof current==='number' && current>0) {
    narration=step===1
      ? 'Cada desafío reveló una familia de '+p+' rectas con una pendiente distinta. Reuniremos las '+(p-1)+' familias en una disposición circular.'
      : 'Incorporamos la familia de pendiente '+slopeName(p,current)+' y su punto del infinito P_'+current+'.';
  } else if (current===0) {
    narration='Además, para construir todas las direcciones del tablero, utilizamos durante todo el juego las rectas horizontales y verticales.';
  } else if (current==='inf') {
    narration='Agregaremos las horizontales como Ruta 0 y las verticales como Ruta infinito, cada una con su punto del infinito.';
  } else if (current==='rope') {
    narration='Ahora tenemos '+(p+1)+' puntos del infinito. Agregaremos una última recta que los reúne a todos: la recta del infinito.';
  } else {
    narration='¡Lo lograste! Acabas de construir el plano proyectivo PG(2,'+p+').';
  }
  $('#fieldConstructionStage').textContent='Etapa '+(step+1)+'/'+stages.length;
  $('#fieldConstructionNarration').textContent=narration;
  const finished=current==='complete';
  $('#fieldRevealNext').disabled=finished;
  $('#fieldRevealNext').textContent=finished?'Construcción completa':'Siguiente etapa';
  $('#fieldFinalMessage').hidden=!finished;
  root.querySelector('.field-circular-narration').classList.toggle('final-focus',finished);
  if (finished) {
    const all=readFieldProgress();
    if(!all[p].finalSeen) {all[p].finalSeen=true;writeFieldProgress(all);}
  }
}
function beginConstruction() {
  if (!fieldUltraFinished(selectedField,getWorld(selectedField))) {
    toast('Resuelve los desafíos Ultraexpertos para desbloquear la construcción.');
    return;
  }
  revealStep=0;
  $('#fieldConstructionContent').replaceChildren();
  showScreen('fieldConstructionScreen');
  renderConstruction();
  playConstruction();
}
function constructionDelay(p,step) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 180;
  if (step===0) return 5600;
  if (step===1) return 5200;
  if (step<=p-1) return 3900;
  if (step===p) return 6500;
  if (step===p+1) return 7000;
  if (step===p+2) return 7600;
  return 1600;
}
function playConstruction() {
  if (animationId) clearTimeout(animationId);
  if (revealStep>=revealStages(selectedField).length-1) return;
  animationId=setTimeout(()=>{
    animationId=null;
    if (!$('#fieldConstructionScreen').classList.contains('active')) return;
    revealStep++;
    renderConstruction();
    playConstruction();
  },constructionDelay(selectedField,revealStep));
}
function nextStage() {
  if (animationId) {clearTimeout(animationId);animationId=null;}
  if (revealStep<revealStages(selectedField).length-1) revealStep++;
  renderConstruction();
  playConstruction();
}
function routeClick(event) {
  const btn=event.target.closest('[data-field-action]');
  if(!btn)return;
  const action=btn.dataset.fieldAction;
  if(action==='enter') return enter(Number(btn.dataset.p));
  if(action==='home') return showHome();
  if(action==='hub') {renderHub();showScreen('fieldHubScreen');return;}
  if(action==='tab') {selectedTab=btn.dataset.tab;renderHub();return;}
  if(action==='route') return pickRoute(Number(btn.dataset.route));
  if(action==='level') {
    const it=FIELD_CAMPAIGNS[selectedField].levels.find((item)=>item.id===btn.dataset.id);
    if(it)startItem(it);
    return;
  }
  if(action==='projective') return openProjective();
  if(action==='ultra') {
    const it=FIELD_CAMPAIGNS[selectedField].ultra.find((item)=>item.id===btn.dataset.id);
    if(it)startItem(it,true);
    return;
  }
  if(action==='construct') return beginConstruction();
  if(action==='reveal-next') return nextStage();
  if(action==='reveal-replay') {revealStep=0;$('#fieldConstructionContent').replaceChildren();renderConstruction();playConstruction();return;}
  if(action==='projective-back') {renderProjective();showScreen('fieldProjectiveScreen');return;}
  if(action==='reset-world') return onWorldReset();
  if(action==='zoom') {
    const expanded=$('#fieldBoardWrap').classList.toggle('zoomed');
    $('#fieldZoomBtn').setAttribute('aria-pressed',String(expanded));
    $('#fieldZoomBtn').textContent=expanded?'🔍 Tamaño normal':'🔍 Ampliar tablero';
    if (expanded) $('#fieldBoardWrap').scrollLeft=0;
    return;
  }
}
preservePreviousSuperPlatinum();
createUI();
const fieldGame = createFieldGame({ onExit:onGameExit, onVictory:onGameVictory, onToast:toast });
document.addEventListener('click',routeClick);
const params = new URLSearchParams(window.location.search);
if (window.__SUDOP_REVIEW__) {
  // El modo revisión histórico continúa iniciando en F7 para no cambiar sus herramientas.
  selectedField=7;
  $('#fieldChooseWorldBtn')?.classList.remove('hidden');
} else if (['3','5','9','11'].includes(params.get('field'))) {
  enter(Number(params.get('field')));
} else {
  showHome();
}
window.__SUDOP_FIELDS__ = { showHome, enter, summary, superPlatinum };
