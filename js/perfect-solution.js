import { LEVELS } from './puzzles.js';

const STORAGE_KEY = 'sudoproyectivo-v02';

export function solutionUnlocked(bestStars = {}, levelId = '') {
  return Number(bestStars?.[levelId] || 0) >= 3;
}

function readBestStars() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return { ...(raw.bestStars || {}) };
  } catch {
    return {};
  }
}

function currentLevelFromScreen() {
  const gameScreen = document.querySelector('#gameScreen');
  if (!gameScreen?.classList.contains('active')) return null;

  const title = document.querySelector('#gameTitle')?.textContent || '';
  const meta = document.querySelector('#gameMeta')?.textContent || '';
  const levelMatch = title.match(/Nivel\s+(\d+)/i);
  const routeMatch = meta.match(/Ruta\s+(\d+)/i);
  if (!levelMatch || !routeMatch) return null;

  const localNumber = Number(levelMatch[1]);
  const world = Number(routeMatch[1]);
  return LEVELS.find((item) => item.world === world && item.localNumber === localNumber) || null;
}

function ensureStyles() {
  if (document.querySelector('#perfectSolutionStyles')) return;
  const style = document.createElement('style');
  style.id = 'perfectSolutionStyles';
  style.textContent = `
    .perfect-solution-bar {
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      margin:10px 0 14px; padding:11px 13px; border-radius:14px;
      border:1px solid rgba(243,200,106,.34); background:rgba(243,200,106,.08);
    }
    .perfect-solution-bar.hidden { display:none; }
    .perfect-solution-copy { min-width:0; }
    .perfect-solution-copy strong { display:block; color:#f7d77f; font-size:.88rem; }
    .perfect-solution-copy small { display:block; margin-top:2px; color:var(--muted); line-height:1.35; }
    .perfect-solution-open {
      flex:0 0 auto; min-height:40px; border-radius:11px; padding:8px 12px;
      border:1px solid rgba(243,200,106,.48); background:rgba(243,200,106,.13);
      color:#fff2c7; font:inherit; font-weight:800; cursor:pointer;
    }
    .perfect-solution-dialog { width:min(94vw,520px); }
    .perfect-solution-heading { margin-bottom:14px; }
    .perfect-solution-heading h2 { margin:.2rem 0 .35rem; }
    .perfect-solution-heading p { margin:0; color:var(--muted); line-height:1.45; }
    .perfect-solution-grid {
      display:grid; grid-template-columns:repeat(7,1fr); gap:4px;
      width:min(100%,420px); margin:16px auto 18px; aspect-ratio:1;
    }
    .perfect-solution-cell {
      display:grid; place-items:center; min-width:0; border-radius:8px;
      border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.055);
      color:#eef5ff; font-weight:850; font-size:clamp(.82rem,4vw,1.15rem);
    }
    .perfect-solution-cell.given {
      background:rgba(114,167,255,.14); border-color:rgba(114,167,255,.25); color:#dbe9ff;
    }
    .perfect-solution-cell.completed {
      background:rgba(243,200,106,.09); color:#fff0bd;
    }
    .perfect-solution-legend { display:flex; justify-content:center; gap:16px; flex-wrap:wrap; color:var(--muted); font-size:.76rem; }
    .perfect-solution-legend span::before { content:'■'; margin-right:5px; }
    .perfect-solution-legend .legend-given::before { color:#72a7ff; }
    .perfect-solution-legend .legend-filled::before { color:#f3c86a; }
    .perfect-solution-close { width:100%; margin-top:16px; }
    @media (max-width:420px) {
      .perfect-solution-bar { align-items:flex-start; }
      .perfect-solution-open { padding-inline:10px; font-size:.78rem; }
    }
  `;
  document.head.appendChild(style);
}

function ensureUI() {
  ensureStyles();
  const gameScreen = document.querySelector('#gameScreen');
  const gameHead = gameScreen?.querySelector('.game-head');
  if (!gameScreen || !gameHead) return;

  if (!document.querySelector('#perfectSolutionBar')) {
    const bar = document.createElement('div');
    bar.id = 'perfectSolutionBar';
    bar.className = 'perfect-solution-bar hidden';
    bar.innerHTML = `
      <div class="perfect-solution-copy">
        <strong>★★★ Solución desbloqueada</strong>
        <small>Tu recorrido perfecto te permite consultar el tablero resuelto.</small>
      </div>
      <button id="perfectSolutionOpenBtn" class="perfect-solution-open" type="button">Ver solución</button>`;
    gameHead.insertAdjacentElement('afterend', bar);
  }

  if (!document.querySelector('#perfectSolutionDialog')) {
    const dialog = document.createElement('dialog');
    dialog.id = 'perfectSolutionDialog';
    dialog.className = 'modal perfect-solution-dialog';
    dialog.innerHTML = `
      <form method="dialog"><button class="modal-close" aria-label="Cerrar solución">×</button></form>
      <div class="perfect-solution-heading">
        <p class="eyebrow">Recompensa por 3 estrellas</p>
        <h2 id="perfectSolutionTitle">Solución</h2>
        <p>Este tablero es sólo para consulta. No modifica tu nueva partida, tus pistas ni tu tiempo.</p>
      </div>
      <div id="perfectSolutionGrid" class="perfect-solution-grid" role="grid" aria-label="Solución completa"></div>
      <div class="perfect-solution-legend" aria-hidden="true">
        <span class="legend-given">Pistas originales</span>
        <span class="legend-filled">Casillas resueltas</span>
      </div>
      <button id="perfectSolutionCloseBtn" class="secondary-btn perfect-solution-close" type="button">Volver al puzzle</button>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#perfectSolutionCloseBtn')?.addEventListener('click', () => dialog.close());
  }

  document.querySelector('#perfectSolutionOpenBtn')?.addEventListener('click', openCurrentSolution);
}

function renderSolution(level) {
  const grid = document.querySelector('#perfectSolutionGrid');
  const title = document.querySelector('#perfectSolutionTitle');
  if (!grid || !title) return;

  title.textContent = `Ruta ${level.world} · Nivel ${level.localNumber}`;
  grid.innerHTML = '';
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = document.createElement('div');
      const wasGiven = level.puzzle[row][col] !== 0;
      cell.className = `perfect-solution-cell ${wasGiven ? 'given' : 'completed'}`;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Fila ${row + 1}, columna ${col + 1}: ${level.solution[row][col]}`);
      cell.textContent = String(level.solution[row][col]);
      grid.appendChild(cell);
    }
  }
}

function openCurrentSolution() {
  const level = currentLevelFromScreen();
  if (!level) return;
  const bestStars = readBestStars();
  if (!solutionUnlocked(bestStars, level.id)) return;

  renderSolution(level);
  const dialog = document.querySelector('#perfectSolutionDialog');
  if (dialog && !dialog.open) dialog.showModal();
}

function refreshAvailability() {
  const bar = document.querySelector('#perfectSolutionBar');
  if (!bar) return;

  const level = currentLevelFromScreen();
  const bestStars = readBestStars();
  const available = Boolean(level && solutionUnlocked(bestStars, level.id));
  bar.classList.toggle('hidden', !available);
}

function init() {
  ensureUI();
  refreshAvailability();

  document.addEventListener('click', () => {
    setTimeout(refreshAvailability, 0);
  });
  window.addEventListener('sudoproyectivo:progresschange', refreshAvailability);
}

if (typeof document !== 'undefined') init();
