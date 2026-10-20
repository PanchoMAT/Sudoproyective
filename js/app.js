import { SIZE, SYMBOLS, cellKey, makeConstraintSystem, routeCellsFor } from './geometry.js';
import { LEVELS, WORLDS } from './puzzles.js';

const $ = (selector) => document.querySelector(selector);
const boardEl = $('#board');
const hubScreen = $('#hubScreen');
const gameScreen = $('#gameScreen');
const mainNav = $('#mainNav');
const difficultySections = $('#difficultySections');
const victoryDialog = $('#victoryDialog');
const invalidDialog = $('#invalidDialog');
const tutorialCallout = $('#tutorialCallout');
const directionCallout = $('#directionCallout');
const systemCache = new Map();

// Conservamos la clave v0.2 para no perder el progreso ya guardado.
const STORAGE_KEY = 'sudoproyective-v02';
const HINT_COST = 1;
const TROPHIES = [
  { id: 'bronze', icon: '🥉', name: 'Brújula de Bronce', text: 'Completa el nivel 6.', level: 6 },
  { id: 'silver', icon: '🥈', name: 'Cartógrafo de Plata', text: 'Completa el nivel 12.', level: 12 },
  { id: 'gold', icon: '🥇', name: 'Geómetra de Oro', text: 'Completa el nivel 18.', level: 18 },
  { id: 'second-direction', icon: '🧭', name: 'Navegante de Dos Rutas', text: 'Completa el nivel 24.', level: 24 },
  { id: 'master', icon: '🏆', name: 'Horizonte Perfecto', text: 'Consigue las 72 estrellas.', stars: 72 },
];

const state = {
  levelIndex: 0,
  values: [],
  notes: new Map(),
  selected: null,
  notesMode: false,
  routesVisible: true,
  hints: 0,
  elapsed: 0,
  timerId: null,
  startedAt: null,
  tutorialStep: -1,
  isTutorial: false,
  activeTab: 'levels',
  undoStack: [],
  redoStack: [],
  saved: loadSaved(),
};

function freshSave() {
  return { levels: {}, bestStars: {}, availableStars: 0, trophies: {}, seenDirections: {} };
}

function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      ...freshSave(),
      ...raw,
      levels: { ...(raw.levels || {}) },
      bestStars: { ...(raw.bestStars || {}) },
      trophies: { ...(raw.trophies || {}) },
      seenDirections: { ...(raw.seenDirections || {}) },
    };
  } catch {
    return freshSave();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved));
}

function totalStars() {
  return Object.values(state.saved.bestStars).reduce((sum, n) => sum + Number(n || 0), 0);
}

function maxCompletedLevel() {
  return LEVELS.reduce((max, item) => state.saved.bestStars[item.id] ? Math.max(max, item.number) : max, 0);
}

function cloneGrid(grid) { return grid.map((row) => [...row]); }
function level() { return LEVELS[state.levelIndex]; }
function isGiven(row, col) { return level().puzzle[row][col] !== 0; }
function isUnlocked(item) { return totalStars() >= item.unlockStars; }
function slopesFor(item = level()) { return item.slopes?.length ? item.slopes : [item.slope || 1]; }
function activeSlope(item = level()) { return slopesFor(item)[0]; }
function constraintSystem(item = level()) {
  const slopes = slopesFor(item);
  const key = slopes.join(',');
  if (!systemCache.has(key)) systemCache.set(key, makeConstraintSystem(slopes));
  return systemCache.get(key);
}
function worldFor(item = level()) { return WORLDS.find((world) => world.id === item.world) || WORLDS[0]; }
function firstLevelHelp() {
  if (state.isTutorial) return true;
  const item = level();
  return item.number === 1 && !state.saved.bestStars[item.id];
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === tab);
  });
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  renderHub();
}

function renderHub() {
  renderStarSummaries();
  renderLevels();
  renderTrophies();
  renderUnlockProgress();
}

function renderStarSummaries() {
  const total = totalStars();
  const available = state.saved.availableStars;
  $('#totalStarsTop').textContent = total;
  $('#availableStarsTop').textContent = available;
  $('#totalStarsRewards').textContent = `${total}★`;
  $('#availableStarsRewards').textContent = `${available}★`;
  $('#gameStarsBalance').textContent = `Disponibles: ${available}★`;
}

function renderUnlockProgress() {
  const total = totalStars();
  const next = LEVELS.find((item) => item.unlockStars > total);
  if (!next) {
    $('#nextUnlockText').textContent = 'Todos los niveles desbloqueados';
    $('#unlockProgress').style.width = '100%';
    return;
  }
  const previous = [...LEVELS].reverse().find((item) => item.unlockStars <= total)?.unlockStars || 0;
  const span = Math.max(1, next.unlockStars - previous);
  const progress = Math.max(0, Math.min(1, (total - previous) / span));
  $('#nextUnlockText').textContent = `Nivel ${next.number} · ${next.unlockStars}★`;
  $('#unlockProgress').style.width = `${Math.round(progress * 100)}%`;
}

function groupTitle(difficulty) {
  const labels = {
    'Iniciación': 'Aprender la estructura',
    'Intermedio': 'Cruzar información',
    'Avanzado': 'Leer la geometría',
    'Exploración': 'Descubrir el salto',
    'Dominio': 'Leer la nueva dirección',
    'Desafío': 'Resolver con menos señales',
  };
  return labels[difficulty] || difficulty;
}

function renderLevels() {
  difficultySections.innerHTML = '';

  for (const world of WORLDS) {
    const worldLevels = LEVELS.filter((item) => item.world === world.id);
    if (!worldLevels.length) continue;

    const worldSection = document.createElement('section');
    worldSection.className = 'world-section';
    const earned = worldLevels.reduce((sum, item) => sum + (state.saved.bestStars[item.id] || 0), 0);
    worldSection.innerHTML = `
      <div class="info-card world-card">
        <div class="section-heading difficulty-heading">
          <div>
            <p class="eyebrow">${world.kicker}</p>
            <h2>${world.name}</h2>
          </div>
          <span class="group-stars">${earned}/${worldLevels.length * 3}★</span>
        </div>
        <p>${world.description}</p>
      </div>
      <div class="world-groups"></div>
    `;

    const groupsRoot = worldSection.querySelector('.world-groups');
    for (const difficulty of world.groups) {
      const group = worldLevels.filter((item) => item.difficulty === difficulty);
      if (!group.length) continue;
      const section = document.createElement('section');
      section.className = 'difficulty-section';
      const groupEarned = group.reduce((sum, item) => sum + (state.saved.bestStars[item.id] || 0), 0);
      section.innerHTML = `
        <div class="section-heading difficulty-heading">
          <div>
            <p class="eyebrow">${difficulty}</p>
            <h2>${groupTitle(difficulty)}</h2>
          </div>
          <span class="group-stars">${groupEarned}/${group.length * 3}★</span>
        </div>
        <div class="level-grid"></div>
      `;
      const grid = section.querySelector('.level-grid');
      group.forEach((item) => grid.appendChild(makeLevelCard(item)));
      groupsRoot.appendChild(section);
    }
    difficultySections.appendChild(worldSection);
  }
}

function makeLevelCard(item) {
  const unlocked = isUnlocked(item);
  const best = state.saved.bestStars[item.id] || 0;
  const button = document.createElement('button');
  button.className = `level-card ${best ? 'completed' : ''} ${unlocked ? '' : 'locked'}`;
  button.disabled = !unlocked;
  const routeLabel = item.slope === 1 ? item.subtitle : `Ruta salto ${item.slope} · ${item.subtitle}`;
  button.innerHTML = `
    <span class="level-number">Nivel ${item.number}</span>
    <span class="level-name">${unlocked ? item.name : 'Bloqueado'}</span>
    <span class="level-clues">${unlocked ? routeLabel : `Necesitas ${item.unlockStars}★ totales`}</span>
    <span class="card-stars" aria-label="${best} estrellas">${starString(best)}</span>
    ${unlocked ? '' : '<span class="lock-mark">🔒</span>'}
  `;
  if (unlocked) button.addEventListener('click', () => startLevel(item.number - 1, false));
  return button;
}

function renderTrophies() {
  const grid = $('#trophyGrid');
  grid.innerHTML = '';
  TROPHIES.forEach((trophy) => {
    const earned = trophyEarned(trophy);
    if (earned) state.saved.trophies[trophy.id] = true;
    const card = document.createElement('article');
    card.className = `trophy-card ${earned ? 'earned' : 'locked'}`;
    card.innerHTML = `
      <div class="trophy-icon">${earned ? trophy.icon : '◌'}</div>
      <div><strong>${trophy.name}</strong><p>${trophy.text}</p></div>
      <span class="trophy-state">${earned ? 'Conseguido' : 'Pendiente'}</span>
    `;
    grid.appendChild(card);
  });
  persist();
}

function trophyEarned(trophy) {
  if (trophy.level) return maxCompletedLevel() >= trophy.level;
  if (trophy.stars) return totalStars() >= trophy.stars;
  return false;
}

function starString(count) {
  return `${'★'.repeat(count)}${'☆'.repeat(3 - count)}`;
}

function updateDirectionCallout() {
  if (!directionCallout) return;
  const slope = activeSlope();
  const shouldShow = !state.isTutorial && slope !== 1 && !state.saved.seenDirections[String(slope)];
  directionCallout.classList.toggle('hidden', !shouldShow);
  if (!shouldShow) return;
  $('#directionTitle').textContent = `Nueva ruta · salto ${slope}`;
  $('#directionText').textContent = `Al avanzar una columna, la ruta baja ${slope} casillas. Si sale del tablero, continúa por el borde opuesto.`;
}

function dismissDirectionCallout() {
  const slope = activeSlope();
  state.saved.seenDirections[String(slope)] = true;
  persist();
  directionCallout.classList.add('hidden');
}

function startLevel(index, tutorial = false) {
  const item = LEVELS[index];
  if (!tutorial && !isUnlocked(item)) {
    showToast(`Necesitas ${item.unlockStars}★ totales para desbloquear este nivel.`);
    return;
  }

  state.levelIndex = index;
  state.isTutorial = tutorial;
  const savedLevel = tutorial ? null : state.saved.levels[item.id];
  state.values = savedLevel?.values ? cloneGrid(savedLevel.values) : cloneGrid(item.puzzle);
  state.notes = tutorial ? new Map() : new Map(
    Object.entries(savedLevel?.notes || {}).map(([key, value]) => [key, new Set(value)])
  );
  state.hints = tutorial ? 0 : (savedLevel?.hints || 0);
  state.elapsed = tutorial ? 0 : (savedLevel?.elapsed || 0);
  state.selected = null;
  state.notesMode = false;
  state.routesVisible = true;
  state.tutorialStep = tutorial ? 0 : -1;
  state.undoStack = [];
  state.redoStack = [];

  $('#notesBtn').classList.remove('active');
  $('#notesBtn').setAttribute('aria-pressed', 'false');
  $('#routesBtn').classList.add('active');
  $('#routesBtn').setAttribute('aria-pressed', 'true');
  $('#routesBtn').innerHTML = 'Rutas <span>●</span>';
  $('#routesBtn').classList.toggle('hidden', tutorial);
  $('#hintBtn').classList.toggle('hidden', tutorial);
  $('#gameStarsBalance').classList.toggle('hidden', tutorial);

  const world = worldFor(item);
  $('#gameMeta').textContent = tutorial
    ? 'Tutorial opcional'
    : `Nivel ${item.number} · ${world.name} · ${item.difficulty}`;
  $('#gameTitle').textContent = tutorial ? 'Aprende las rutas' : item.name;

  hubScreen.classList.remove('active');
  gameScreen.classList.add('active');
  mainNav.classList.add('hidden');
  renderBoard();
  renderNumberPad();
  renderStarSummaries();
  updateHistoryButtons();
  updateTutorial();
  updateDirectionCallout();
  startTimer();
}

function leaveGame() {
  saveCurrent();
  stopTimer();
  if (invalidDialog?.open) invalidDialog.close();
  gameScreen.classList.remove('active');
  hubScreen.classList.add('active');
  mainNav.classList.remove('hidden');
  tutorialCallout.classList.add('hidden');
  directionCallout?.classList.add('hidden');
  renderHub();
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const key = cellKey(row, col);
      const button = document.createElement('button');
      button.className = 'cell';
      button.dataset.row = row;
      button.dataset.col = col;
      button.setAttribute('role', 'gridcell');
      if (isGiven(row, col)) button.classList.add('given');
      const value = state.values[row][col];
      if (value) button.textContent = value;
      else {
        const notes = state.notes.get(key);
        if (notes?.size) button.appendChild(makeNotes(notes));
      }
      button.addEventListener('click', () => selectCell(row, col));
      boardEl.appendChild(button);
    }
  }
  paintSelection();
}

function makeNotes(notes) {
  const grid = document.createElement('span');
  grid.className = 'notes-grid';
  for (const n of SYMBOLS) {
    const span = document.createElement('span');
    span.className = `note-${n}`;
    span.textContent = notes.has(n) ? n : '';
    grid.appendChild(span);
  }
  return grid;
}

function selectCell(row, col) {
  state.selected = { row, col };
  paintSelection();
  renderNumberPad();
  if (state.tutorialStep === 0) {
    state.tutorialStep = 1;
    updateTutorial();
  }
}

function paintSelection() {
  document.querySelectorAll('.cell').forEach((cell) => {
    cell.classList.remove('selected', 'peer', 'route-peer', 'same-value', 'error');
    cell.querySelectorAll('.wrap-dot').forEach((dot) => dot.remove());
  });
  if (!state.selected) return;

  const { row, col } = state.selected;
  const selectedKey = cellKey(row, col);
  const selectedValue = state.values[row][col];
  const slope = activeSlope();
  const routeKeys = new Set(routeCellsFor(row, col, slope).map((cell) => cellKey(cell.row, cell.col)));

  document.querySelectorAll('.cell').forEach((cell) => {
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    const key = cellKey(r, c);
    if (key === selectedKey) cell.classList.add('selected');
    else if (r === row || c === col) cell.classList.add('peer');
    if (state.routesVisible && key !== selectedKey && routeKeys.has(key)) cell.classList.add('route-peer');
    if (firstLevelHelp() && selectedValue && state.values[r][c] === selectedValue) cell.classList.add('same-value');
  });

  if (state.routesVisible) addWrapMarkers(row, col, slope);
}

function addWrapMarkers(row, col, slope) {
  const route = routeCellsFor(row, col, slope);
  const sorted = [...route].sort((a, b) => a.col - b.col);
  const signedStep = slope <= Math.floor(SIZE / 2) ? slope : slope - SIZE;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const rawNext = a.row + signedStep;
    if (rawNext >= SIZE) {
      const aCell = cellElement(a.row, a.col);
      const bCell = cellElement(b.row, b.col);
      if (aCell) aCell.appendChild(makeDot('edge-bottom', 'edge-right'));
      if (bCell) bCell.appendChild(makeDot('edge-top', 'edge-left'));
    } else if (rawNext < 0) {
      const aCell = cellElement(a.row, a.col);
      const bCell = cellElement(b.row, b.col);
      if (aCell) aCell.appendChild(makeDot('edge-top', 'edge-right'));
      if (bCell) bCell.appendChild(makeDot('edge-bottom', 'edge-left'));
    }
  }
}

function makeDot(verticalClass, horizontalClass) {
  const dot = document.createElement('span');
  dot.className = `wrap-dot ${verticalClass} ${horizontalClass}`;
  return dot;
}

function cellElement(row, col) {
  return boardEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function renderNumberPad() {
  const numbers = $('#numbers');
  numbers.innerHTML = '';
  const used = new Set();

  if (firstLevelHelp() && state.selected) {
    constraintSystem().peers.get(cellKey(state.selected.row, state.selected.col))?.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      if (state.values[r][c]) used.add(state.values[r][c]);
    });
  }

  SYMBOLS.forEach((n) => {
    const button = document.createElement('button');
    button.className = `num-btn ${used.has(n) ? 'used' : ''}`;
    button.textContent = n;
    button.addEventListener('click', () => enterNumber(n));
    numbers.appendChild(button);
  });
}

function notesObject() {
  const result = {};
  state.notes.forEach((set, key) => {
    if (set.size) result[key] = [...set];
  });
  return result;
}

function captureSnapshot() {
  return {
    values: cloneGrid(state.values),
    notes: notesObject(),
    selected: state.selected ? { ...state.selected } : null,
  };
}

function restoreSnapshot(snapshot) {
  state.values = cloneGrid(snapshot.values);
  state.notes = new Map(Object.entries(snapshot.notes || {}).map(([key, value]) => [key, new Set(value)]));
  state.selected = snapshot.selected ? { ...snapshot.selected } : null;
  saveCurrent();
  renderBoard();
  renderNumberPad();
  updateHistoryButtons();
}

function recordUserMove() {
  state.undoStack.push(captureSnapshot());
  if (state.undoStack.length > 200) state.undoStack.shift();
  state.redoStack = [];
}

function undoMove() {
  if (!state.undoStack.length) return;
  const previous = state.undoStack.pop();
  state.redoStack.push(captureSnapshot());
  restoreSnapshot(previous);
}

function redoMove() {
  if (!state.redoStack.length) return;
  const next = state.redoStack.pop();
  state.undoStack.push(captureSnapshot());
  restoreSnapshot(next);
  checkCompletion();
}

function updateHistoryButtons() {
  $('#undoBtn').disabled = state.undoStack.length === 0;
  $('#redoBtn').disabled = state.redoStack.length === 0;
}

function enterNumber(n) {
  if (!state.selected) return;
  const { row, col } = state.selected;
  if (isGiven(row, col)) return;
  const key = cellKey(row, col);

  recordUserMove();
  if (state.notesMode) {
    const notes = state.notes.get(key) || new Set();
    notes.has(n) ? notes.delete(n) : notes.add(n);
    state.notes.set(key, notes);
  } else {
    state.values[row][col] = n;
    state.notes.delete(key);
    if (firstLevelHelp()) removeNoteFromPeers(row, col, n);
  }

  saveCurrent();
  renderBoard();
  renderNumberPad();
  updateHistoryButtons();
  if (state.tutorialStep === 2) {
    state.tutorialStep = 3;
    updateTutorial();
  }
  if (!state.notesMode) checkCompletion();
}

function eraseSelected() {
  if (!state.selected) return;
  const { row, col } = state.selected;
  if (isGiven(row, col)) return;
  const key = cellKey(row, col);
  if (!state.values[row][col] && !state.notes.get(key)?.size) return;

  recordUserMove();
  state.values[row][col] = 0;
  state.notes.delete(key);
  saveCurrent();
  renderBoard();
  renderNumberPad();
  updateHistoryButtons();
}

function removeNoteFromPeers(row, col, n) {
  constraintSystem().peers.get(cellKey(row, col))?.forEach((key) => state.notes.get(key)?.delete(n));
}

function requestHint() {
  if (state.isTutorial) return;
  if (state.saved.availableStars < HINT_COST) {
    showToast(`Necesitas ${HINT_COST}★ disponible para usar una pista.`);
    return;
  }

  const item = level();
  const targets = [];
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
    if (!isGiven(row, col) && state.values[row][col] !== item.solution[row][col]) targets.push({ row, col });
  }
  if (!targets.length) return;

  const target = targets[0];
  state.saved.availableStars -= HINT_COST;
  state.values[target.row][target.col] = item.solution[target.row][target.col];
  state.notes.delete(cellKey(target.row, target.col));
  state.hints++;
  state.selected = target;
  state.undoStack = [];
  state.redoStack = [];
  saveCurrent();
  renderStarSummaries();
  renderBoard();
  requestAnimationFrame(() => cellElement(target.row, target.col)?.classList.add('hinted'));
  renderNumberPad();
  updateHistoryButtons();
  checkCompletion();
}

function starsForRun() {
  if (state.hints === 0) return 3;
  if (state.hints === 1) return 2;
  return 1;
}

function boardComplete() {
  return state.values.every((row) => row.every((value) => SYMBOLS.includes(value)));
}

function boardValid() {
  if (!boardComplete()) return false;
  return constraintSystem().units.every((unit) => {
    const values = unit.cells.map(({ row, col }) => state.values[row][col]);
    return new Set(values).size === SIZE && values.every((value) => SYMBOLS.includes(value));
  });
}

function checkCompletion() {
  if (!boardComplete()) return;
  if (!boardValid()) {
    if (!state.isTutorial && !invalidDialog.open) invalidDialog.showModal();
    return;
  }
  completeLevel();
}

function completeLevel() {
  stopTimer();
  if (state.isTutorial) {
    state.tutorialStep = -1;
    showToast('Tutorial completado. Ya puedes jugar los niveles cuando quieras.');
    leaveGame();
    setTab('levels');
    return;
  }

  const item = level();
  const beforeTrophies = new Set(TROPHIES.filter(trophyEarned).map((t) => t.id));
  const runStars = starsForRun();
  const previousBest = state.saved.bestStars[item.id] || 0;
  const newBest = Math.max(previousBest, runStars);
  const delta = newBest - previousBest;
  state.saved.bestStars[item.id] = newBest;
  state.saved.availableStars += delta;
  saveCurrent();
  persist();

  const afterTrophies = TROPHIES.filter(trophyEarned);
  afterTrophies.forEach((t) => { state.saved.trophies[t.id] = true; });
  const newTrophy = afterTrophies.find((t) => !beforeTrophies.has(t.id));
  persist();

  const min = Math.floor(state.elapsed / 60);
  const sec = String(state.elapsed % 60).padStart(2, '0');
  $('#victoryStars').textContent = starString(runStars);
  $('#victoryTitle').textContent = runStars === 3 ? '¡Recorrido impecable!' : runStars === 2 ? '¡Muy buen recorrido!' : '¡Nivel completado!';
  $('#victoryStats').textContent = `${min}:${sec} · ${state.hints} pistas`;
  const rewardParts = [];
  if (delta > 0) rewardParts.push(`+${delta}★ nuevas · saldo ${state.saved.availableStars}★`);
  else rewardParts.push(`Tu mejor marca sigue en ${previousBest}★`);
  if (newTrophy) rewardParts.push(`${newTrophy.icon} Nuevo trofeo: ${newTrophy.name}`);
  $('#victoryReward').textContent = rewardParts.join(' · ');

  const next = LEVELS[state.levelIndex + 1];
  const canContinue = next && isUnlocked(next);
  $('#nextLevelBtn').style.display = canContinue ? '' : 'none';
  victoryDialog.showModal();
  renderHub();
}

function saveCurrent() {
  if (!state.values.length || state.isTutorial) return;
  state.saved.levels[level().id] = {
    values: cloneGrid(state.values),
    notes: notesObject(),
    hints: state.hints,
    elapsed: state.elapsed,
  };
  persist();
}

function startTimer() {
  stopTimer();
  state.startedAt = Date.now() - state.elapsed * 1000;
  updateTimer();
  state.timerId = window.setInterval(() => {
    state.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    updateTimer();
    if (state.elapsed % 10 === 0) saveCurrent();
  }, 1000);
}

function stopTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  if (state.startedAt) state.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
}

function updateTimer() {
  const min = String(Math.floor(state.elapsed / 60)).padStart(2, '0');
  const sec = String(state.elapsed % 60).padStart(2, '0');
  $('#timer').textContent = `${min}:${sec}`;
}

const tutorialSteps = [
  ['1 · Toca una casilla', 'Selecciona una casilla vacía. Verás las restricciones que pasan por ella.'],
  ['2 · Fila, columna y ruta', 'La fila y la columna se suavizan. La ruta aparece en dorado y tampoco puede repetir números.'],
  ['3 · Juega un número', 'En el tutorial y en tu primera partida del nivel 1, el selector te ayuda a reconocer números ya usados. Después esa ayuda desaparece.'],
  ['4 · El borde continúa', 'Los puntos dorados muestran dónde una ruta sale por un borde y reaparece por el opuesto.'],
];

function updateTutorial() {
  if (state.tutorialStep < 0) {
    tutorialCallout.classList.add('hidden');
    return;
  }
  tutorialCallout.classList.remove('hidden');
  const [title, text] = tutorialSteps[Math.min(state.tutorialStep, tutorialSteps.length - 1)];
  $('#tutorialTitle').textContent = title;
  $('#tutorialText').textContent = text;
  $('#tutorialNextBtn').textContent = state.tutorialStep >= tutorialSteps.length - 1 ? 'Listo' : 'Siguiente';
}

function nextTutorialStep() {
  if (state.tutorialStep >= tutorialSteps.length - 1) {
    state.tutorialStep = -1;
    tutorialCallout.classList.add('hidden');
    return;
  }
  state.tutorialStep++;
  if (state.tutorialStep === 1 && !state.selected) {
    const target = findFirstEditable();
    if (target) state.selected = target;
    paintSelection();
    renderNumberPad();
  }
  updateTutorial();
}

function findFirstEditable() {
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
    if (!isGiven(row, col)) return { row, col };
  }
  return null;
}

let toastTimer = null;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 2600);
}

document.querySelectorAll('.nav-btn').forEach((button) => {
  button.addEventListener('click', () => setTab(button.dataset.tab));
});

$('#tutorialBtn').addEventListener('click', () => startLevel(0, true));
$('#backBtn').addEventListener('click', leaveGame);
$('#notesBtn').addEventListener('click', () => {
  state.notesMode = !state.notesMode;
  $('#notesBtn').classList.toggle('active', state.notesMode);
  $('#notesBtn').setAttribute('aria-pressed', String(state.notesMode));
});
$('#routesBtn').addEventListener('click', () => {
  if (state.isTutorial) return;
  state.routesVisible = !state.routesVisible;
  $('#routesBtn').classList.toggle('active', state.routesVisible);
  $('#routesBtn').setAttribute('aria-pressed', String(state.routesVisible));
  $('#routesBtn').innerHTML = state.routesVisible ? 'Rutas <span>●</span>' : 'Rutas <span>○</span>';
  paintSelection();
});
$('#eraseBtn').addEventListener('click', eraseSelected);
$('#hintBtn').addEventListener('click', requestHint);
$('#undoBtn').addEventListener('click', undoMove);
$('#redoBtn').addEventListener('click', redoMove);
$('#tutorialNextBtn').addEventListener('click', nextTutorialStep);
$('#directionDismissBtn').addEventListener('click', dismissDirectionCallout);
$('#levelsBtn').addEventListener('click', () => {
  victoryDialog.close();
  leaveGame();
  setTab('levels');
});
$('#nextLevelBtn').addEventListener('click', () => {
  victoryDialog.close();
  startLevel(state.levelIndex + 1, false);
});
$('#resetProgressBtn').addEventListener('click', () => {
  if (!confirm('¿Borrar niveles, estrellas, pistas gastadas y trofeos de Sudoproyective?')) return;
  state.saved = freshSave();
  persist();
  renderHub();
  showToast('Progreso reiniciado.');
});

window.addEventListener('beforeunload', saveCurrent);
renderHub();
setTab('levels');
