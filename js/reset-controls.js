import route1 from './data/route1.js';
import route2 from './data/route2.js';
import route3 from './data/route3.js';
import route4 from './data/route4.js';
import route5 from './data/route5.js';
import route6 from './data/route6.js';

const STORAGE_KEY = 'sudoproyectivo-v02';
const RESUME_KEY = 'sudoproyectivo-reset-level-resume';
const TOTAL_RESET_KEY = 'sudoproyectivo-total-reset-pending';
const routeData = [route1, route2, route3, route4, route5, route6];

function levelIdFor(world, localNumber) {
  const row = routeData[Number(world) - 1]?.find((item) => Number(item[1]) === Number(localNumber));
  return row?.[0] || null;
}

function currentLevelTarget() {
  const gameScreen = document.querySelector('#gameScreen');
  if (!gameScreen?.classList.contains('active')) return null;

  const meta = document.querySelector('#gameMeta')?.textContent || '';
  const title = document.querySelector('#gameTitle')?.textContent || '';
  const routeMatch = meta.match(/Ruta\s+(\d+)/i);
  const levelMatch = title.match(/Nivel\s+(\d+)/i);
  if (!routeMatch || !levelMatch) return null;

  const world = Number(routeMatch[1]);
  const localNumber = Number(levelMatch[1]);
  const id = levelIdFor(world, localNumber);
  return id ? { id, world, localNumber } : null;
}

function readSave() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeSave(save) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

function readResumeTarget() {
  try {
    return JSON.parse(localStorage.getItem(RESUME_KEY));
  } catch {
    return null;
  }
}

function applyPendingResetsBeforeGameLoads() {
  // app.js guarda automáticamente al salir. Las marcas de reinicio viven en
  // localStorage (fuera del progreso) para sobrevivir de forma fiable a la
  // recarga de una PWA móvil. Se aplican antes de que app.js lea el progreso.
  if (localStorage.getItem(TOTAL_RESET_KEY) === '1') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOTAL_RESET_KEY);
    localStorage.removeItem(RESUME_KEY);
    return;
  }

  const target = readResumeTarget();
  if (!target?.world || !target?.localNumber) return;
  const id = levelIdFor(target.world, target.localNumber);
  if (!id) return;

  const save = readSave();
  save.levels = { ...(save.levels || {}) };
  delete save.levels[id];
  writeSave(save);
}

function ensureStyles() {
  if (document.querySelector('#resetControlsStyles')) return;
  const style = document.createElement('style');
  style.id = 'resetControlsStyles';
  style.textContent = `
    #resetLevelBtn {
      flex: 0 0 auto;
      min-height: 38px;
      padding: 7px 10px;
      border-color: rgba(255, 190, 105, .34);
      color: #ffe4bb;
      background: rgba(255, 166, 77, .07);
      white-space: nowrap;
    }
    #resetLevelBtn:hover {
      border-color: rgba(255, 190, 105, .60);
      background: rgba(255, 166, 77, .12);
    }
    #resetLevelBtn.hidden { display: none !important; }
    @media (max-width: 440px) {
      #resetLevelBtn { font-size: .72rem; padding-inline: 8px; }
    }
  `;
  document.head.appendChild(style);
}

function ensureLevelResetButton() {
  const tools = document.querySelector('#gameScreen .secondary-tools');
  if (!tools || document.querySelector('#resetLevelBtn')) return;

  const button = document.createElement('button');
  button.id = 'resetLevelBtn';
  button.className = 'mode-btn hidden';
  button.type = 'button';
  button.setAttribute('aria-label', 'Reiniciar este nivel');
  button.title = 'Borrar números y notas de este intento y volver al inicio del nivel';
  button.textContent = '↺ Reiniciar nivel';

  const balance = tools.querySelector('#gameStarsBalance');
  if (balance) tools.insertBefore(button, balance);
  else tools.appendChild(button);

  button.addEventListener('click', resetCurrentLevel);
}

function syncLevelResetButton() {
  ensureLevelResetButton();
  const button = document.querySelector('#resetLevelBtn');
  if (!button) return;
  button.classList.toggle('hidden', !currentLevelTarget());
}

function resetCurrentLevel() {
  const target = currentLevelTarget();
  if (!target) return;

  const accepted = window.confirm(
    '¿Reiniciar este nivel?\n\nSe borrarán todos los números y notas que hayas puesto y el cronómetro volverá a cero. Tu mejor marca, estrellas y trofeos no se perderán. Las estrellas ya gastadas en pistas no se reembolsan.'
  );
  if (!accepted) return;

  // Marcamos primero el reinicio. Aunque beforeunload vuelva a guardar el tablero
  // antiguo, la siguiente carga borrará de nuevo esta partida antes de iniciar app.js.
  localStorage.setItem(RESUME_KEY, JSON.stringify({
    world: target.world,
    localNumber: target.localNumber,
  }));

  const save = readSave();
  save.levels = { ...(save.levels || {}) };
  delete save.levels[target.id];
  writeSave(save);
  window.location.reload();
}

function findRouteButton(world) {
  return [...document.querySelectorAll('.route-tab')].find((button) => {
    const text = button.querySelector('span')?.textContent || button.textContent || '';
    return new RegExp(`^Ruta\\s+${world}$`, 'i').test(text.trim());
  });
}

function findLevelRow(localNumber) {
  return [...document.querySelectorAll('.level-row')].find((row) => {
    const text = row.querySelector('.level-row-label')?.childNodes?.[0]?.textContent
      || row.querySelector('.level-row-label')?.textContent
      || '';
    const match = text.match(/Nivel\s+(\d+)/i);
    return match && Number(match[1]) === Number(localNumber);
  });
}

function resumeResetLevel() {
  const target = readResumeTarget();
  if (!target?.world || !target?.localNumber) return false;

  const routeButton = findRouteButton(target.world);
  if (!routeButton) return false;
  if (!routeButton.classList.contains('active')) routeButton.click();

  const levelRow = findLevelRow(target.localNumber);
  if (!levelRow) return false;

  // Se elimina sólo cuando ya encontramos el nivel y estamos a punto de abrirlo.
  localStorage.removeItem(RESUME_KEY);
  levelRow.click();
  return true;
}

function scheduleResume() {
  [0, 80, 250, 700].forEach((delay) => {
    window.setTimeout(() => {
      if (!localStorage.getItem(RESUME_KEY)) return;
      resumeResetLevel();
    }, delay);
  });
}

function protectTotalReset() {
  const button = document.querySelector('#resetProgressBtn');
  if (!button || button.dataset.doubleConfirmBound) return;
  button.dataset.doubleConfirmBound = '1';

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const first = window.confirm(
      '¿Reiniciar TODO el progreso de SudoProyectivo?\n\nEsto borrará niveles completados, estrellas, trofeos y progreso de los desafíos. Tu perfil no se borrará.'
    );
    if (!first) return;

    const second = window.confirm(
      'Última confirmación. Esta acción no se puede deshacer.\n\n¿Estás completamente seguro de que quieres borrar todo tu progreso?'
    );
    if (!second) return;

    localStorage.setItem(TOTAL_RESET_KEY, '1');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESUME_KEY);
    window.location.reload();
  }, true);
}

function observeGameState() {
  const gameScreen = document.querySelector('#gameScreen');
  const gameMeta = document.querySelector('#gameMeta');
  const gameTitle = document.querySelector('#gameTitle');

  if (gameScreen) {
    new MutationObserver(syncLevelResetButton).observe(gameScreen, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
  for (const element of [gameMeta, gameTitle]) {
    if (!element) continue;
    new MutationObserver(syncLevelResetButton).observe(element, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
}

function init() {
  applyPendingResetsBeforeGameLoads();
  ensureStyles();
  ensureLevelResetButton();
  protectTotalReset();
  observeGameState();
  syncLevelResetButton();
  scheduleResume();
  window.__SUDOP_RESET_CONTROLS_READY__ = true;
}

if (typeof document !== 'undefined') init();
