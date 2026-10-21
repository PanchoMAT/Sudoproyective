import { SIZE, SYMBOLS, cellKey, makeConstraintSystem, routeCellsFor } from './geometry.js';
import { LEVELS, WORLDS } from './puzzles.js';

const $ = (selector) => document.querySelector(selector);
const boardEl = $('#board');
const hubScreen = $('#hubScreen');
const gameScreen = $('#gameScreen');
const mainNav = $('#mainNav');
const difficultySections = $('#difficultySections');
const routeTabsEl = $('#routeTabs');
const victoryDialog = $('#victoryDialog');
const invalidDialog = $('#invalidDialog');
const tutorialCallout = $('#tutorialCallout');
const directionCallout = $('#directionCallout');
const systemCache = new Map();

// Se conserva la clave histórica para mantener todo el progreso existente.
const STORAGE_KEY = 'sudoproyective-v02';
const HINT_COST = 1;

function levelsForWorld(worldId) {
  return LEVELS.filter((item) => item.world === worldId);
}

function worldMaxStars(worldId) {
  return levelsForWorld(worldId).length * 3;
}

function worldStarTotal(worldId) {
  return levelsForWorld(worldId).reduce(
    (sum, item) => sum + Number(state.saved.bestStars[item.id] || 0),
    0
  );
}

const TROPHIES = [
  ...WORLDS.flatMap((world) => {
    const levelCount = levelsForWorld(world.id).length;
    return [
      {
        id: `world-${world.id}-bronze`,
        icon: '🥉',
        name: `${world.name} · Bronce`,
        text: `Consigue ${levelCount}★ en ${world.name}.`,
        world: world.id,
        threshold: levelCount,
      },
      {
        id: `world-${world.id}-silver`,
        icon: '🥈',
        name: `${world.name} · Plata`,
        text: `Consigue ${levelCount * 2}★ en ${world.name}.`,
        world: world.id,
        threshold: levelCount * 2,
      },
      {
        id: `world-${world.id}-gold`,
        icon: '🥇',
        name: `${world.name} · Oro`,
        text: `Consigue las ${levelCount * 3}★ de ${world.name}.`,
        world: world.id,
        threshold: levelCount * 3,
      },
    ];
  }),
  {
    id: 'platinum',
    icon: '🏆',
    name: 'Trofeo de Platino',
    text: 'Consigue el trofeo de oro en las seis rutas.',
    platinum: true,
  },
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
  activeWorldId: 1,
  numberFocus: null,
  undoStack: [],
  redoStack: [],
  saved: loadSaved(),
};

state.activeWorldId = WORLDS.some((world) => world.id === Number(state.saved.selectedWorldId))
  ? Number(state.saved.selectedWorldId)
  : WORLDS[0].id;

function freshSave() {
  return {
    levels: {},
    bestStars: {},
    availableStars: 0,
    trophies: {},
    seenDirections: {},
    selectedWorldId: 1,
  };
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

function cloneGrid(grid) { return grid.map((row) => [...row]); }
function level() { return LEVELS[state.levelIndex]; }
function isGiven(row, col) { return level().puzzle[row][col] !== 0; }
function slopesFor(item = level()) { return item.slopes?.length ? item.slopes : [item.slope || 1]; }
function activeSlope(item = level()) { return slopesFor(item)[0]; }
function signedStepForSlope(slope) { return slope <= 3 ? slope : slope - SIZE; }
function constraintSystem(item = level()) {
  const slopes = slopesFor(item);
  const key = slopes.join(',');
  if (!systemCache.has(key)) systemCache.set(key, makeConstraintSystem(slopes));
  return systemCache.get(key);
}
function worldFor(item = level()) {
  return WORLDS.find((world) => world.id === item.world) || WORLDS[0];
}
function firstLevelHelp() {
  if (state.isTutorial) return true;
  const item = level();
  return item.number === 1 && !state.saved.bestStars[item.id];
}
function stepLabel(slope) {
  const step = signedStepForSlope(slope);
  return step > 0 ? `+${step}` : `${step}`;
}
function stepSentence(slope) {
  const step = signedStepForSlope(slope);
  return step > 0
    ? `baja ${step} ${step === 1 ? 'casilla' : 'casillas'}`
    : `sube ${Math.abs(step)} ${Math.abs(step) === 1 ? 'casilla' : 'casillas'}`;
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

function selectWorld(worldId) {
  state.activeWorldId = worldId;
  state.saved.selectedWorldId = worldId;
  persist();
  renderRouteTabs();
  renderLevels();
}

function renderHub() {
  renderStarSummaries();
  renderRouteTabs();
  renderLevels();
  renderTrophies();
  renderMasteryProgress();
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

function renderMasteryProgress() {
  const total = totalStars();
  const maximum = LEVELS.length * 3;
  $('#nextUnlockText').textContent = `Perfección global · ${total}/${maximum}★`;
  $('#unlockProgress').style.width = `${Math.round((total / maximum) * 100)}%`;
}

function groupTitle(difficulty) {
  const labels = {
    'Iniciación': 'Aprender la estructura',
    'Intermedio': 'Cruzar información',
    'Avanzado': 'Leer la geometría',
    'Exploración': 'Descubrir la dirección',
    'Dominio': 'Leer la nueva ruta',
    'Desafío': 'Resolver con menos señales',
  };
  return labels[difficulty] || difficulty;
}

function worldMedal(worldId) {
  const stars = worldStarTotal(worldId);
  const levels = levelsForWorld(worldId).length;
  if (stars >= levels * 3) return '🥇 Oro';
  if (stars >= levels * 2) return '🥈 Plata';
  if (stars >= levels) return '🥉 Bronce';
  return 'Sin trofeo';
}

function worldMedalIcon(worldId) {
  const stars = worldStarTotal(worldId);
  const levels = levelsForWorld(worldId).length;
  if (stars >= levels * 3) return '🥇';
  if (stars >= levels * 2) return '🥈';
  if (stars >= levels) return '🥉';
  return '';
}

function renderRouteTabs() {
  routeTabsEl.innerHTML = '';
  WORLDS.forEach((world) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `route-tab ${state.activeWorldId === world.id ? 'active' : ''}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(state.activeWorldId === world.id));
    button.innerHTML = `<span>${world.name}</span><small>${worldMedalIcon(world.id) || `${worldStarTotal(world.id)}★`}</small>`;
    button.addEventListener('click', () => selectWorld(world.id));
    routeTabsEl.appendChild(button);
  });
}

function renderLevels() {
  difficultySections.innerHTML = '';
  const world = WORLDS.find((item) => item.id === state.activeWorldId) || WORLDS[0];
  const worldLevels = levelsForWorld(world.id);
  if (!worldLevels.length) return;

  const worldSection = document.createElement('section');
  worldSection.className = 'world-section';
  const earned = worldStarTotal(world.id);
  const count = worldLevels.length;
  worldSection.innerHTML = `
    <div class="info-card world-card">
      <div class="section-heading difficulty-heading">
        <div>
          <p class="eyebrow">${world.kicker}</p>
          <h2>${world.name}</h2>
        </div>
        <span class="group-stars">${earned}/${count * 3}★</span>
      </div>
      <p>${world.description}</p>
      <p><strong>Rango actual:</strong> ${worldMedal(world.id)} · 🥉 ${count}★ · 🥈 ${count * 2}★ · 🥇 ${count * 3}★</p>
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

function makeLevelCard(item) {
  const best = state.saved.bestStars[item.id] || 0;
  const button = document.createElement('button');
  button.className = `level-card ${best ? 'completed' : ''}`;
  const routeLabel = `Ruta ${stepLabel(item.slope)} · ${item.subtitle}`;
  button.innerHTML = `
    <span class="level-number">Nivel ${item.number}</span>
    <span class="level-name">${item.name}</span>
    <span class="level-clues">${routeLabel}</span>
    <span class="card-stars" aria-label="${best} estrellas">${starString(best)}</span>
  `;
  button.addEventListener('click', () => startLevel(item.number - 1, false));
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
  if (trophy.platinum) {
    return WORLDS.every((world) => worldStarTotal(world.id) >= worldMaxStars(world.id));
  }
  if (trophy.world) return worldStarTotal(trophy.world) >= trophy.threshold;
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
  $('#directionTitle').textContent = `Nueva ruta · ${stepLabel(slope)}`;
  $('#directionText').textContent =
    `Al avanzar una columna, la ruta ${stepSentence(slope)}. Si sale del tablero, continúa por el borde opuesto.`;
}

function dismissDirectionCallout() {
  const slope = activeSlope();
  state.saved.seenDirections[String(slope)] = true;
  persist();
  directionCallout.classList.add('hidden');
}

function startLevel(index, tutorial = false) {
  const item = LEVELS[index];
  state.levelIndex = index;
  state.isTutorial = tutorial;
  state.numberFocus = null;

  if (!tutorial) {
    state.activeWorldId = item.world;
    state.saved.selectedWorldId = item.world;
  }

  // Un nivel ya terminado comienza de nuevo al reabrirlo para que pueda mejorarse su marca.
  const savedLevel = tutorial || state.saved.bestStars[item.id] ? null : state.saved.levels[item.id];
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
  persist();
  startTimer();
}

function leaveGame() {
  saveCurrent();
  stopTimer();
  state.numberFocus = null;
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
  // Cualquier toque en el tablero apaga el seguimiento numérico previo.
  state.numberFocus = null;
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
    cell.classList.remove('selected', 'peer', 'route-peer', 'same-value', 'error', 'number-focus');
    cell.querySelectorAll('.wrap-dot').forEach((dot) => dot.remove());
  });

  const selected = state.selected;
  let routeKeys = new Set();
  if (selected) {
    routeKeys = new Set(
      routeCellsFor(selected.row, selected.col, activeSlope())
        .map((cell) => cellKey(cell.row, cell.col))
    );
  }

  document.querySelectorAll('.cell').forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const key = cellKey(row, col);
    const value = state.values[row][col];

    if (state.numberFocus !== null && value === state.numberFocus) {
      cell.classList.add('number-focus');
    }

    if (!selected) return;
    const selectedKey = cellKey(selected.row, selected.col);
    if (key === selectedKey) cell.classList.add('selected');
    else if (row === selected.row || col === selected.col) cell.classList.add('peer');
    if (state.routesVisible && key !== selectedKey && routeKeys.has(key)) cell.classList.add('route-peer');

    const selectedValue = state.values[selected.row][selected.col];
    if (firstLevelHelp() && selectedValue && value === selectedValue) cell.classList.add('same-value');
  });

  if (selected && state.routesVisible) addWrapMarkers(selected.row, selected.col, activeSlope());
}

function addWrapMarkers(row, col, slope) {
  const route = routeCellsFor(row, col, slope);
  const sorted = [...route].sort((a, b) => a.col - b.col);
  const signedStep = signedStepForSlope(slope);

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

function numberCounts() {
  const counts = new Map(SYMBOLS.map((n) => [n, 0]));
  state.values.forEach((row) => row.forEach((value) => {
    if (counts.has(value)) counts.set(value, counts.get(value) + 1);
  }));
  return counts;
}

function renderNumberPad() {
  const numbers = $('#numbers');
  numbers.innerHTML = '';
  const used = new Set();
  const counts = numberCounts();

  if (firstLevelHelp() && state.selected) {
    constraintSystem().peers.get(cellKey(state.selected.row, state.selected.col))?.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      if (state.values[r][c]) used.add(state.values[r][c]);
    });
  }

  SYMBOLS.forEach((n) => {
    const count = counts.get(n) || 0;
    const button = document.createElement('button');
    const completed = count === SIZE;
    button.className = [
      'num-btn',
      used.has(n) ? 'used' : '',
      state.numberFocus === n ? 'number-focus' : '',
      completed ? 'number-complete' : '',
    ].filter(Boolean).join(' ');
    button.dataset.number = String(n);
    button.textContent = n;
    button.title = completed ? `${n}: 7 de 7 colocados` : `${n}: ${count} de 7 colocados`;
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', String(state.numberFocus === n));
    button.addEventListener('click', () => handleNumberButton(n));
    numbers.appendChild(button);
  });
}

function handleNumberButton(n) {
  state.numberFocus = state.numberFocus === n ? null : n;
  const changed = enterNumber(n);
  if (!changed) {
    renderBoard();
    renderNumberPad();
  }
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
  state.numberFocus = null;
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
  if (!state.selected) return false;
  const { row, col } = state.selected;
  if (isGiven(row, col)) return false;
  const key = cellKey(row, col);

  if (!state.notesMode && state.values[row][col] === n && !state.notes.get(key)?.size) {
    renderBoard();
    renderNumberPad();
    return false;
  }

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
  return true;
}

function eraseSelected() {
  if (!state.selected) return;
  const { row, col } = state.selected;
  if (isGiven(row, col)) return;
  const key = cellKey(row, col);
  if (!state.values[row][col] && !state.notes.get(key)?.size) return;

  state.numberFocus = null;
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

  if (!state.selected) {
    showToast('Selecciona primero la casilla que quieres revelar.');
    return;
  }

  const { row, col } = state.selected;
  if (isGiven(row, col)) {
    showToast('Esa casilla es fija. Selecciona una casilla editable.');
    return;
  }

  const item = level();
  if (state.values[row][col] === item.solution[row][col] && !state.notes.get(cellKey(row, col))?.size) {
    showToast('Esa casilla ya tiene el valor correcto. Elige otra.');
    return;
  }

  if (state.saved.availableStars < HINT_COST) {
    showToast(`Necesitas ${HINT_COST}★ disponible para usar una pista.`);
    return;
  }

  state.saved.availableStars -= HINT_COST;
  state.values[row][col] = item.solution[row][col];
  state.notes.delete(cellKey(row, col));
  state.hints++;
  state.numberFocus = null;

  // Una pista es una ayuda comprada y no forma parte del historial reversible.
  state.undoStack = [];
  state.redoStack = [];

  saveCurrent();
  renderStarSummaries();
  renderBoard();
  requestAnimationFrame(() => cellElement(row, col)?.classList.add('hinted'));
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

function wrongCellCount() {
  const item = level();
  let count = 0;
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!isGiven(row, col) && state.values[row][col] !== item.solution[row][col]) count++;
    }
  }
  return count;
}

function checkCompletion() {
  if (!boardComplete()) return;
  if (!boardValid()) {
    if (!state.isTutorial) {
      const errors = wrongCellCount();
      $('#invalidErrorCount').textContent =
        errors === 1 ? 'Hay 1 casilla incorrecta.' : `Hay ${errors} casillas incorrectas.`;
      if (!invalidDialog.open) invalidDialog.showModal();
    }
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
  $('#victoryTitle').textContent = runStars === 3
    ? '¡Recorrido impecable!'
    : runStars === 2
      ? '¡Muy buen recorrido!'
      : '¡Nivel completado!';
  $('#victoryStats').textContent = `${min}:${sec} · ${state.hints} pistas`;

  const rewardParts = [];
  if (delta > 0) rewardParts.push(`+${delta}★ nuevas · saldo ${state.saved.availableStars}★`);
  else rewardParts.push(`Tu mejor marca sigue en ${previousBest}★`);
  if (newTrophy) rewardParts.push(`${newTrophy.icon} Nuevo trofeo: ${newTrophy.name}`);
  $('#victoryReward').textContent = rewardParts.join(' · ');

  const next = LEVELS[state.levelIndex + 1];
  $('#nextLevelBtn').style.display = next ? '' : 'none';
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
  $('#tutorialNextBtn').textContent =
    state.tutorialStep >= tutorialSteps.length - 1 ? 'Listo' : 'Siguiente';
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
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!isGiven(row, col)) return { row, col };
    }
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
  state.activeWorldId = 1;
  persist();
  renderHub();
  showToast('Progreso reiniciado.');
});

window.addEventListener('beforeunload', saveCurrent);
renderHub();
setTab('levels');
