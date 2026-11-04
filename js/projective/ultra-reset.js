// Reinicia únicamente el intento activo; no toca logros ni progreso persistente.
export function resetUltraAttempt(state, puzzle) {
  state.values = puzzle.map((row) => [...row]);
  state.notes = new Map();
  state.selected = null;
  state.notesMode = false;
  state.routesVisible = true;
  state.elapsed = 0;
  state.startedAt = null;
  state.undoStack = [];
  state.redoStack = [];
}
