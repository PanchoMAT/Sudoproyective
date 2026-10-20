import { SIZE, SYMBOLS, cellKey, makeConstraintSystem, routeCellsFor } from './geometry.js';
import { LEVELS } from './puzzles.js';

const $ = (selector) => document.querySelector(selector);
const boardEl = $('#board');
const levelScreen = $('#levelScreen');
const gameScreen = $('#gameScreen');
const levelGrid = $('#levelGrid');
const tutorialCallout = $('#tutorialCallout');
const tutorialTitle = $('#tutorialTitle');
const tutorialText = $('#tutorialText');
const tutorialNextBtn = $('#tutorialNextBtn');
const rulesDialog = $('#rulesDialog');
const victoryDialog = $('#victoryDialog');
const system = makeConstraintSystem([1]);

const STORAGE_KEY = 'sudoproyective-v01';
const state = {
  levelIndex: 0,
  values: [],
  notes: new Map(),
  selected: null,
  notesMode: false,
  mistakes: 0,
  hints: 0,
  elapsed: 0,
  timerId: null,
  startedAt: null,
  tutorialStep: -1,
  saved: loadSaved(),
};

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { levels: {}, completed: {} };
  } catch {
    return { levels: {}, completed: {} };
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved));
}

function cloneGrid(grid) { return grid.map((row) => [...row]); }
function level() { return LEVELS[state.levelIndex]; }
function isGiven(row, col) { return level().puzzle[row][col] !== 0; }

function renderLevels() {
  levelGrid.innerHTML = '';
  LEVELS.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = `level-card ${state.saved.completed[item.id] ? 'completed' : ''}`;
    button.innerHTML = `
      <span class="level-number">Nivel ${item.number} · ${item.difficulty}</span>
      <span class="level-name">${item.name}</span>
      <span class="level-clues">${item.subtitle}</span>
      ${state.saved.completed[item.id] ? '<span class="complete-badge">✓</span>' : ''}
    `;
    button.addEventListener('click', () => startLevel(index, false));
    levelGrid.appendChild(button);
  });
}

function startLevel(index, tutorial = false) {
  state.levelIndex = index;
  const item = LEVELS[index];
  const savedLevel = state.saved.levels[item.id];
  state.values = savedLevel?.values ? cloneGrid(savedLevel.values) : cloneGrid(item.puzzle);
  state.notes = new Map(Object.entries(savedLevel?.notes || {}).map(([key, value]) => [key, new Set(value)]));
  state.mistakes = savedLevel?.mistakes || 0;
  state.hints = savedLevel?.hints || 0;
  state.elapsed = savedLevel?.elapsed || 0;
  state.selected = null;
  state.notesMode = false;
  state.tutorialStep = tutorial ? 0 : -1;
  $('#notesBtn').classList.remove('active');
  $('#notesBtn').setAttribute('aria-pressed', 'false');
  $('#gameMeta').textContent = tutorial ? 'Tutorial' : `Nivel ${item.number} · ${item.difficulty}`;
  $('#gameTitle').textContent = tutorial ? 'Aprende las rutas' : item.name;
  levelScreen.classList.remove('active');
  gameScreen.classList.add('active');
  renderBoard();
  renderNumberPad();
  updateTutorial();
  startTimer();
}

function leaveGame() {
  saveCurrent();
  stopTimer();
  gameScreen.classList.remove('active');
  levelScreen.classList.add('active');
  tutorialCallout.classList.add('hidden');
  renderLevels();
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
      if (value) {
        button.textContent = value;
      } else {
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
    cell.classList.remove('selected', 'peer', 'route-peer', 'same-value');
    cell.querySelectorAll('.wrap-dot').forEach((dot) => dot.remove());
  });
  if (!state.selected) return;
  const { row, col } = state.selected;
  const selectedKey = cellKey(row, col);
  const selectedValue = state.values[row][col];
  const routeKeys = new Set(routeCellsFor(row, col, 1).map((c) => cellKey(c.row, c.col)));

  document.querySelectorAll('.cell').forEach((cell) => {
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    const key = cellKey(r, c);
    if (key === selectedKey) cell.classList.add('selected');
    else if (system.peers.get(selectedKey)?.has(key)) cell.classList.add('peer');
    if (key !== selectedKey && routeKeys.has(key)) cell.classList.add('route-peer');
    if (selectedValue && state.values[r][c] === selectedValue) cell.classList.add('same-value');
  });
  addWrapMarkers(row, col);
}

function addWrapMarkers(row, col) {
  const route = routeCellsFor(row, col, 1);
  const sorted = [...route].sort((a, b) => a.col - b.col);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (Math.abs(b.row - a.row) > 1) {
      const aCell = cellElement(a.row, a.col);
      const bCell = cellElement(b.row, b.col);
      if (aCell) aCell.appendChild(makeDot(a.row > b.row ? 'edge-bottom' : 'edge-top', 'edge-right'));
      if (bCell) bCell.appendChild(makeDot(a.row > b.row ? 'edge-top' : 'edge-bottom', 'edge-left'));
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
  const selected = state.selected;
  const used = new Set();
  if (selected) {
    system.peers.get(cellKey(selected.row, selected.col))?.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      if (state.values[r][c]) used.add(state.values[r][c]);
    });
  }
  SYMBOLS.forEach((n) => {
    const btn = document.createElement('button');
    btn.className = `num-btn ${used.has(n) ? 'used' : ''}`;
    btn.textContent = n;
    btn.addEventListener('click', () => enterNumber(n));
    numbers.appendChild(btn);
  });
}

function enterNumber(n) {
  if (!state.selected) return;
  const { row, col } = state.selected;
  if (isGiven(row, col)) return;
  const key = cellKey(row, col);
  if (state.notesMode) {
    const notes = state.notes.get(key) || new Set();
    notes.has(n) ? notes.delete(n) : notes.add(n);
    state.notes.set(key, notes);
  } else {
    const wrong = n !== level().solution[row][col];
    state.values[row][col] = n;
    state.notes.delete(key);
    if (wrong && $('#errorToggle').checked) {
      state.mistakes++;
      requestAnimationFrame(() => cellElement(row, col)?.classList.add('error'));
    }
    removeNoteFromPeers(row, col, n);
  }
  saveCurrent();
  renderBoard();
  renderNumberPad();
  if (state.tutorialStep === 2) {
    state.tutorialStep = 3;
    updateTutorial();
  }
  checkVictory();
}

function eraseSelected() {
  if (!state.selected) return;
  const { row, col } = state.selected;
  if (isGiven(row, col)) return;
  state.values[row][col] = 0;
  state.notes.delete(cellKey(row, col));
  saveCurrent();
  renderBoard();
  renderNumberPad();
}

function removeNoteFromPeers(row, col, n) {
  system.peers.get(cellKey(row, col))?.forEach((key) => state.notes.get(key)?.delete(n));
}

function requestHint() {
  const item = level();
  const empties = [];
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
    if (!isGiven(row, col) && state.values[row][col] !== item.solution[row][col]) empties.push({ row, col });
  }
  if (!empties.length) return;
  const target = empties[0];
  state.values[target.row][target.col] = item.solution[target.row][target.col];
  state.notes.delete(cellKey(target.row, target.col));
  state.hints++;
  state.selected = target;
  saveCurrent();
  renderBoard();
  requestAnimationFrame(() => cellElement(target.row, target.col)?.classList.add('hinted'));
  renderNumberPad();
  checkVictory();
}

function checkVictory() {
  const solved = level().solution.every((row, r) => row.every((value, c) => state.values[r][c] === value));
  if (!solved) return;
  stopTimer();
  state.saved.completed[level().id] = true;
  saveCurrent();
  persist();
  const min = Math.floor(state.elapsed / 60);
  const sec = String(state.elapsed % 60).padStart(2, '0');
  $('#victoryStats').textContent = `${min}:${sec} · ${state.mistakes} errores · ${state.hints} pistas`;
  $('#nextLevelBtn').style.display = state.levelIndex < LEVELS.length - 1 ? '' : 'none';
  victoryDialog.showModal();
}

function saveCurrent() {
  if (!state.values.length) return;
  const notes = {};
  state.notes.forEach((set, key) => { if (set.size) notes[key] = [...set]; });
  state.saved.levels[level().id] = {
    values: cloneGrid(state.values), notes, mistakes: state.mistakes, hints: state.hints, elapsed: state.elapsed,
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
  ['1 · Toca una casilla', 'Selecciona una casilla vacía. El tablero te mostrará todo lo que se relaciona con ella.'],
  ['2 · Tres restricciones', 'La fila y la columna se suavizan. La ruta aparece en dorado: sus siete casillas tampoco pueden repetir números.'],
  ['3 · Juega un número', 'Elige abajo el número correcto. El selector permanece fijo para que sea cómodo en celular.'],
  ['4 · El borde continúa', 'Observa los pequeños puntos dorados: indican dónde la ruta salta de un borde al opuesto. Ya conoces todas las reglas.'],
];

function updateTutorial() {
  if (state.tutorialStep < 0) {
    tutorialCallout.classList.add('hidden');
    return;
  }
  tutorialCallout.classList.remove('hidden');
  const [title, text] = tutorialSteps[Math.min(state.tutorialStep, tutorialSteps.length - 1)];
  tutorialTitle.textContent = title;
  tutorialText.textContent = text;
  tutorialNextBtn.textContent = state.tutorialStep >= tutorialSteps.length - 1 ? 'Listo' : 'Siguiente';
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

$('#tutorialBtn').addEventListener('click', () => startLevel(0, true));
$('#backBtn').addEventListener('click', leaveGame);
$('#rulesBtn').addEventListener('click', () => rulesDialog.showModal());
$('#notesBtn').addEventListener('click', () => {
  state.notesMode = !state.notesMode;
  $('#notesBtn').classList.toggle('active', state.notesMode);
  $('#notesBtn').setAttribute('aria-pressed', String(state.notesMode));
});
$('#eraseBtn').addEventListener('click', eraseSelected);
$('#hintBtn').addEventListener('click', requestHint);
$('#tutorialNextBtn').addEventListener('click', nextTutorialStep);
$('#levelsBtn').addEventListener('click', () => { victoryDialog.close(); leaveGame(); });
$('#nextLevelBtn').addEventListener('click', () => {
  victoryDialog.close();
  startLevel(Math.min(state.levelIndex + 1, LEVELS.length - 1), false);
});
$('#resetProgressBtn').addEventListener('click', () => {
  if (!confirm('¿Borrar el progreso guardado de Sudoproyective?')) return;
  state.saved = { levels: {}, completed: {} };
  persist();
  renderLevels();
});
document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
});
window.addEventListener('beforeunload', saveCurrent);

renderLevels();
