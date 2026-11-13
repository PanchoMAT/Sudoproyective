import {
  FIELD_CAMPAIGNS, FIELD_STORAGE_KEY, routeCells, constraintUnits,
  readFieldProgress, writeFieldProgress, fieldBestStars,
} from './core.js';

const $ = (selector) => document.querySelector(selector);
const HINT_COSTS = [2, 3, 4];
const copyGrid = (grid) => grid.map((row) => [...row]);

export function createFieldGame({ onExit, onVictory, onToast }) {
  const state = {
    p: 3, item: null, ultra: false, values: [], notes: new Map(),
    selected: null, notesMode: false, routesVisible: true, numberFocus: null,
    hints: 0, elapsed: 0, startedAt: null, timerId: null, undo: [], redo: [],
  };

  function currentWorld() { return readFieldProgress()[state.p]; }
  function notesObject() {
    const result = {};
    for (const [key, entries] of state.notes)
      if (entries.size) result[key] = [...entries];
    return result;
  }
  function save() {
    if (!state.item) return;
    const all = readFieldProgress();
    const world = all[state.p];
    const key = state.ultra ? 'ultraLevels' : 'levels';
    if (!state.ultra || !world.ultraCompleted[state.item.id]) {
      world[key] = {
        ...world[key],
        [state.item.id]: {
          values: copyGrid(state.values),
          notes: notesObject(),
          elapsed: state.elapsed,
          hints: state.hints,
        },
      };
    }
    writeFieldProgress(all);
  }
  function stopTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
    if (state.startedAt != null)
      state.elapsed = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
    state.startedAt = null;
  }
  function timerText() {
    const min = String(Math.floor(state.elapsed / 60)).padStart(2, '0');
    const sec = String(state.elapsed % 60).padStart(2, '0');
    $('#fieldTimer').textContent = min + ':' + sec;
  }
  function startTimer() {
    stopTimer();
    state.startedAt = Date.now() - state.elapsed * 1000;
    timerText();
    state.timerId = setInterval(() => {
      state.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      timerText();
      if (state.elapsed % 10 === 0) save();
    }, 1000);
  }
  function given(row, col) { return state.item.puzzle[row][col] !== 0; }
  function snapshot() {
    return { values: copyGrid(state.values), notes: notesObject(),
      selected: state.selected ? { ...state.selected } : null };
  }
  function record() {
    state.undo.push(snapshot());
    if (state.undo.length > 200) state.undo.shift();
    state.redo = [];
  }
  function restore(snap) {
    state.values = copyGrid(snap.values);
    state.notes = new Map(Object.entries(snap.notes || {})
      .map(([key, value]) => [key, new Set(value)]));
    state.selected = snap.selected ? { ...snap.selected } : null;
    state.numberFocus = null;
    refresh();
    save();
  }
  function undo() {
    if (!state.undo.length) return;
    const before = state.undo.pop();
    state.redo.push(snapshot());
    restore(before);
  }
  function redo() {
    if (!state.redo.length) return;
    const after = state.redo.pop();
    state.undo.push(snapshot());
    restore(after);
    checkCompletion();
  }
  function renderBoard() {
    const board = $('#fieldBoard');
    board.style.setProperty('--field-p', String(state.p));
    board.setAttribute('aria-label', 'Tablero de ' + state.p + ' por ' + state.p);
    board.replaceChildren();
    const selected = state.selected;
    const routeSet = selected && state.routesVisible
      ? new Set(routeCells(state.p, state.item.slope, selected.row, selected.col)
        .map((point) => point.row + ',' + point.col))
      : new Set();
    for (let row = 0; row < state.p; row++) {
      for (let col = 0; col < state.p; col++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'field-cell';
        b.dataset.row = String(row);
        b.dataset.col = String(col);
        b.setAttribute('role', 'gridcell');
        const key = row + ',' + col;
        if (given(row, col)) b.classList.add('given');
        if (selected && selected.row === row && selected.col === col) b.classList.add('selected');
        else if (selected && (selected.row === row || selected.col === col)) b.classList.add('peer');
        if (selected && routeSet.has(key) && !(selected.row === row && selected.col === col))
          b.classList.add('route-peer');
        const value = state.values[row][col];
        if (value) {
          b.textContent = String(value);
          if (!given(row, col)) b.classList.add('filled');
          if (state.numberFocus === value) b.classList.add('number-focus');
        } else {
          const notes = state.notes.get(key);
          if (notes?.size) {
            const small = document.createElement('span');
            small.className = 'field-notes';
            small.style.setProperty('--field-p', String(state.p));
            for (let n = 1; n <= state.p; n++) {
              const span = document.createElement('span');
              span.textContent = notes.has(n) ? String(n) : '';
              small.appendChild(span);
            }
            b.appendChild(small);
          }
        }
        b.addEventListener('click', () => {
          state.selected = { row, col };
          state.numberFocus = null;
          renderBoard();
          renderPad();
        });
        board.appendChild(b);
      }
    }
  }
  function renderPad() {
    const numbers = $('#fieldNumbers');
    numbers.style.setProperty('--field-p', String(state.p));
    numbers.replaceChildren();
    for (let n = 1; n <= state.p; n++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'field-digit';
      const count = state.values.flat().filter((v) => v === n).length;
      if (count === state.p) btn.classList.add('number-complete');
      if (state.numberFocus === n) btn.classList.add('number-focus');
      btn.textContent = String(n);
      btn.setAttribute('aria-label', n + ' · ' + count + ' de ' + state.p);
      btn.addEventListener('click', () => {
        state.numberFocus = state.numberFocus === n ? null : n;
        enter(n);
      });
      numbers.appendChild(btn);
    }
  }
  function refresh() {
    if (!state.item) return;
    renderBoard();
    renderPad();
    $('#fieldUndo').disabled = state.undo.length === 0;
    $('#fieldRedo').disabled = state.redo.length === 0;
    $('#fieldNotes').classList.toggle('active', state.notesMode);
    $('#fieldNotes').setAttribute('aria-pressed', String(state.notesMode));
    $('#fieldRoutes').classList.toggle('active', state.routesVisible);
    $('#fieldRoutes').setAttribute('aria-pressed', String(state.routesVisible));
    $('#fieldRoutes').textContent = state.routesVisible ? 'Rutas ●' : 'Rutas ○';
    $('#fieldHint').hidden = state.ultra;
    $('#fieldHint').textContent = 'Pista · ' + HINT_COSTS[state.item.group] + '★';
    const best = state.ultra ? 0 : fieldBestStars(currentWorld(), state.item);
    $('#fieldSolutionBtn').hidden = state.ultra || best !== 3;
    const world = currentWorld();
    $('#fieldGameBalance').textContent = state.ultra
      ? 'Sin pistas ni estrellas'
      : 'Disponibles: ' + world.availableStars + '★';
    timerText();
  }
  function enter(n) {
    if (!state.selected) { refresh(); return; }
    const { row, col } = state.selected;
    if (given(row, col)) { refresh(); return; }
    const key = row + ',' + col;
    if (state.notesMode) {
      record();
      const notes = state.notes.get(key) || new Set();
      notes.has(n) ? notes.delete(n) : notes.add(n);
      if (notes.size) state.notes.set(key, notes);
      else state.notes.delete(key);
    } else {
      if (state.values[row][col] === n && !state.notes.has(key)) { refresh(); return; }
      record();
      state.values[row][col] = n;
      state.notes.delete(key);
    }
    refresh();
    save();
    if (!state.notesMode) checkCompletion();
  }
  function erase() {
    if (!state.selected) return;
    const { row, col } = state.selected, key = row + ',' + col;
    if (given(row, col) || (!state.values[row][col] && !state.notes.has(key))) return;
    record();
    state.values[row][col] = 0;
    state.notes.delete(key);
    state.numberFocus = null;
    refresh();
    save();
  }
  function hint() {
    if (state.ultra) return;
    if (!state.selected) { onToast('Selecciona una casilla editable primero.'); return; }
    const { row, col } = state.selected;
    if (given(row, col)) { onToast('Esa casilla es una pista fija.'); return; }
    const correct = state.item.solution[row][col];
    if (state.values[row][col] === correct && !state.notes.has(row + ',' + col)) {
      onToast('Esa casilla ya tiene el valor correcto.'); return;
    }
    const all = readFieldProgress(), world = all[state.p], cost = HINT_COSTS[state.item.group];
    if (world.availableStars < cost) { onToast('Necesitas ' + cost + '★ para una pista.'); return; }
    const balanceAfter = world.availableStars - cost;
    if (!window.confirm('¿Quieres solicitar una pista para esta casilla?\n\nCosto: ' + cost + '★.\nEstrellas disponibles: ' + world.availableStars + '★.\nSaldo después de la pista: ' + balanceAfter + '★.\n\nPulsa Cancelar para conservar tus estrellas.')) return;
    if (!window.confirm('SEGUNDA CONFIRMACIÓN\n\nSe descontarán definitivamente ' + cost + '★ para revelar esta casilla.\n¿Confirmas el gasto de estrellas?')) return;
    world.availableStars -= cost;
    writeFieldProgress(all);
    state.values[row][col] = correct;
    state.notes.delete(row + ',' + col);
    state.hints++;
    state.undo = [];
    state.redo = [];
    refresh(); save(); checkCompletion();
  }
  function checkCompletion() {
    if (!state.values.every((row) => row.every((v) => v >= 1 && v <= state.p))) return;
    const values = state.values.flat();
    const valid = constraintUnits(state.p, state.item.slope).every((unit) =>
      new Set(unit.map((pos) => values[pos])).size === state.p
    );
    if (!valid) {
      let bad = 0;
      for (let r = 0; r < state.p; r++) for (let c = 0; c < state.p; c++)
        if (!given(r, c) && state.values[r][c] !== state.item.solution[r][c]) bad++;
      $('#fieldInvalidCount').textContent = bad === 1
        ? 'Hay 1 casilla incorrecta.' : 'Hay ' + bad + ' casillas incorrectas.';
      $('#fieldInvalid').showModal();
      return;
    }
    stopTimer();
    const all = readFieldProgress(), world = all[state.p];
    const item = state.item;
    const oldBest = state.ultra ? 0 : fieldBestStars(world, item);
    const runStars = state.hints === 0 ? 3 : state.hints === 1 ? 2 : 1;
    let delta = 0;
    if (state.ultra) {
      world.ultraCompleted[item.id] = true;
      delete world.ultraLevels[item.id];
    } else {
      delta = Math.max(0, runStars - oldBest);
      world.bestStars[item.id] = Math.max(oldBest, runStars);
      world.availableStars += delta;
      delete world.levels[item.id];
    }
    writeFieldProgress(all);
    onVictory({ item, p: state.p, ultra: state.ultra, runStars, delta, elapsed: state.elapsed });
  }
  function reset() {
    if (!state.item || !$('#fieldGameScreen').classList.contains('active')) return;
    const text = '¿Reiniciar este nivel?\n\nSe borrarán todos los números y notas que agregaste y el tiempo volverá a cero. Tus estrellas, trofeos y progreso histórico se conservarán. Las estrellas gastadas en pistas no se reembolsan.';
    if (!window.confirm(text)) return;
    stopTimer();
    state.values = copyGrid(state.item.puzzle);
    state.notes = new Map();
    state.selected = null;
    state.notesMode = false;
    state.routesVisible = true;
    state.numberFocus = null;
    // Las pistas utilizadas en este intento continúan contando para las estrellas.
    state.elapsed = 0;
    state.undo = [];
    state.redo = [];
    refresh();
    save();
    startTimer();
  }
  function showSolution() {
    if (state.ultra || fieldBestStars(currentWorld(), state.item) !== 3) return;
    const board = $('#fieldSolutionBoard');
    board.style.setProperty('--field-p', String(state.p));
    board.replaceChildren();
    for (let row = 0; row < state.p; row++) for (let col = 0; col < state.p; col++) {
      const el = document.createElement('span');
      el.className = 'field-cell field-solution-cell';
      if (given(row, col)) el.classList.add('given');
      el.textContent = String(state.item.solution[row][col]);
      board.appendChild(el);
    }
    $('#fieldSolutionTitle').textContent = 'Solución · F' + state.p + ' · Ruta ' + state.item.slope;
    $('#fieldSolutionDialog').showModal();
  }
  function open(p, item, ultra = false) {
    if (state.item) {
      if (state.timerId) stopTimer();
      save();
    }
    state.p = p;
    state.item = item;
    state.ultra = ultra;
    const world = currentWorld();
    const saved = ultra
      ? (world.ultraCompleted[item.id] ? null : world.ultraLevels[item.id])
      : (fieldBestStars(world, item) > 0 ? null : world.levels[item.id]);
    state.values = saved?.values ? copyGrid(saved.values) : copyGrid(item.puzzle);
    state.notes = new Map(Object.entries(saved?.notes || {})
      .map(([key, val]) => [key, new Set(val)]));
    state.selected = null;
    state.notesMode = false;
    state.routesVisible = true;
    state.numberFocus = null;
    state.hints = saved?.hints || 0;
    state.elapsed = saved?.elapsed || 0;
    state.undo = [];
    state.redo = [];
    $('#fieldGameMeta').textContent = 'Mundo F' + p + ' · Ruta ' + item.slope +
      (ultra ? ' · Proyectivo' : ' · ' + item.difficulty);
    $('#fieldGameTitle').textContent = ultra
      ? 'Desafío Ultraexperto' : 'Nivel ' + item.localNumber;
    refresh();
    startTimer();
  }
  function close() {
    if (!state.item) return;
    stopTimer();
    save();
    const wasUltra = state.ultra;
    state.item = null;
    onExit(wasUltra);
  }
  function handleVictoryAction(action) {
    state.item = null;
    if (action === 'next') {
      onExit(state.ultra, 'next');
      return;
    }
    onExit(state.ultra);
  }
  $('#fieldBack').addEventListener('click', close);
  $('#fieldNotes').addEventListener('click', () => { state.notesMode = !state.notesMode; refresh(); });
  $('#fieldRoutes').addEventListener('click', () => { state.routesVisible = !state.routesVisible; refresh(); });
  $('#fieldHint').addEventListener('click', hint);
  $('#fieldErase').addEventListener('click', erase);
  $('#fieldUndo').addEventListener('click', undo);
  $('#fieldRedo').addEventListener('click', redo);
  $('#fieldReset').addEventListener('click', reset);
  $('#fieldSolutionBtn').addEventListener('click', showSolution);
  $('#fieldSolutionClose').addEventListener('click', () => $('#fieldSolutionDialog').close());
  $('#fieldInvalidClose').addEventListener('click', () => $('#fieldInvalid').close());
  $('#fieldVictoryLevels').addEventListener('click', () => {
    $('#fieldVictory').close(); handleVictoryAction('levels');
  });
  $('#fieldVictoryNext').addEventListener('click', () => {
    $('#fieldVictory').close(); handleVictoryAction('next');
  });
  document.addEventListener('keydown', (event) => {
    if (!$('#fieldGameScreen').classList.contains('active') || event.altKey || event.metaKey || event.ctrlKey) return;
    const n = Number(event.key);
    if (n >= 1 && n <= state.p) { event.preventDefault(); enter(n); }
    if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); erase(); }
  });
  window.addEventListener('beforeunload', () => {
    if (state.item && $('#fieldGameScreen').classList.contains('active')) {
      stopTimer();
      save();
    }
  });
  return { open, close, stopTimer, save, state };
}
