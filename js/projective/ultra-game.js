import { ULTRA_LEVELS } from '../ultra.js';
import { SIZE, SYMBOLS, cellKey, makeConstraintSystem, routeCellsFor } from '../geometry.js';
import { projectUnlocked, ultraComplete, loadUltraState, saveUltraState, markUltraComplete, allUltraComplete } from './storage.js';
import { familySvg } from './visuals.js';

const $ = (selector) => document.querySelector(selector);
const ultraScreen = $('#ultraGameScreen');
const ultraBoard = $('#ultraBoard');
const ultraNumbers = $('#ultraNumbers');
const ultraVictoryDialog = $('#ultraVictoryDialog');
const invalidDialog = $('#invalidDialog');

const state = {
  index: 0,
  values: [],
  notes: new Map(),
  selected: null,
  notesMode: false,
  routesVisible: true,
  elapsed: 0,
  timerId: null,
  startedAt: null,
  undoStack: [],
  redoStack: [],
};

function item() { return ULTRA_LEVELS[state.index]; }
function system() { return makeConstraintSystem([item().slope]); }
function isGiven(row,col) { return item().puzzle[row][col] !== 0; }
function cloneGrid(grid) { return grid.map((row)=>[...row]); }

function notesObject() {
  const result = {};
  state.notes.forEach((set,key)=>{ if (set.size) result[key]=[...set]; });
  return result;
}

function saveProgress() {
  if (!state.values.length) return;
  saveUltraState(item(), {
    values: cloneGrid(state.values),
    notes: notesObject(),
    elapsed: state.elapsed,
  });
}

export function startUltra(index) {
  if (!projectUnlocked()) return;
  state.index = index;
  const current = item();
  const saved = loadUltraState(current);
  state.values = saved?.values ? cloneGrid(saved.values) : cloneGrid(current.puzzle);
  state.notes = new Map(Object.entries(saved?.notes || {}).map(([key,values])=>[key,new Set(values)]));
  state.selected = null;
  state.notesMode = false;
  state.routesVisible = true;
  state.elapsed = saved?.elapsed || 0;
  state.undoStack = [];
  state.redoStack = [];

  $('#ultraNotesBtn').classList.remove('active');
  $('#ultraRoutesBtn').classList.add('active');
  $('#ultraRoutesBtn').innerHTML = 'Rutas <span>●</span>';
  $('#ultraMeta').textContent = `Proyecto final · Ruta ${current.slope}`;
  $('#ultraTitle').textContent = 'Desafío Ultraexperto';
  $('#hubScreen').classList.remove('active');
  $('#mainNav').classList.add('hidden');
  ultraScreen.classList.add('active');
  renderBoard();
  renderNumbers();
  updateHistory();
  startTimer();
}

function leaveUltra() {
  if (invalidDialog?.open) invalidDialog.close();
  saveProgress();
  stopTimer();
  ultraScreen.classList.remove('active');
  $('#hubScreen').classList.add('active');
  $('#mainNav').classList.remove('hidden');
  window.dispatchEvent(new CustomEvent('sudoproyective:projective-change'));
}

function makeNotes(notes) {
  const grid=document.createElement('span');
  grid.className='notes-grid';
  for (const n of SYMBOLS) {
    const span=document.createElement('span');
    span.className=`note-${n}`;
    span.textContent=notes.has(n)?n:'';
    grid.appendChild(span);
  }
  return grid;
}

function renderBoard() {
  ultraBoard.innerHTML='';
  for(let row=0;row<SIZE;row++) for(let col=0;col<SIZE;col++) {
    const button=document.createElement('button');
    button.className='cell';
    button.dataset.row=row;
    button.dataset.col=col;
    if(isGiven(row,col)) button.classList.add('given');
    const value=state.values[row][col];
    if(value) button.textContent=value;
    else {
      const notes=state.notes.get(cellKey(row,col));
      if(notes?.size) button.appendChild(makeNotes(notes));
    }
    button.addEventListener('click',()=>{ state.selected={row,col}; paintSelection(); });
    ultraBoard.appendChild(button);
  }
  paintSelection();
}

function paintSelection() {
  ultraBoard.querySelectorAll('.cell').forEach((cell)=>cell.classList.remove('selected','peer','route-peer'));
  if(!state.selected) return;
  const {row,col}=state.selected;
  const route=new Set(routeCellsFor(row,col,item().slope).map((cell)=>cellKey(cell.row,cell.col)));
  ultraBoard.querySelectorAll('.cell').forEach((cell)=>{
    const r=Number(cell.dataset.row), c=Number(cell.dataset.col), key=cellKey(r,c);
    if(r===row&&c===col) cell.classList.add('selected');
    else if(r===row||c===col) cell.classList.add('peer');
    if(state.routesVisible&&!(r===row&&c===col)&&route.has(key)) cell.classList.add('route-peer');
  });
}

function renderNumbers() {
  ultraNumbers.innerHTML='';
  const counts=new Map(SYMBOLS.map((n)=>[n,0]));
  state.values.forEach((row)=>row.forEach((value)=>{if(value)counts.set(value,counts.get(value)+1);}));
  SYMBOLS.forEach((n)=>{
    const button=document.createElement('button');
    button.className=`num-btn ${counts.get(n)===SIZE?'number-complete':''}`;
    button.textContent=n;
    button.addEventListener('click',()=>enterNumber(n));
    ultraNumbers.appendChild(button);
  });
}

function snapshot() {
  return { values:cloneGrid(state.values), notes:notesObject(), selected:state.selected?{...state.selected}:null };
}

function restore(snap) {
  state.values=cloneGrid(snap.values);
  state.notes=new Map(Object.entries(snap.notes||{}).map(([key,values])=>[key,new Set(values)]));
  state.selected=snap.selected?{...snap.selected}:null;
  saveProgress();
  renderBoard(); renderNumbers(); updateHistory();
}

function record() {
  state.undoStack.push(snapshot());
  if(state.undoStack.length>200) state.undoStack.shift();
  state.redoStack=[];
}

function enterNumber(n) {
  if(!state.selected) return;
  const {row,col}=state.selected;
  if(isGiven(row,col)) return;
  const key=cellKey(row,col);
  record();
  if(state.notesMode) {
    const notes=state.notes.get(key)||new Set();
    notes.has(n)?notes.delete(n):notes.add(n);
    state.notes.set(key,notes);
  } else {
    state.values[row][col]=n;
    state.notes.delete(key);
  }
  saveProgress(); renderBoard(); renderNumbers(); updateHistory();
  if(!state.notesMode) checkCompletion();
}

function erase() {
  if(!state.selected) return;
  const {row,col}=state.selected;
  if(isGiven(row,col)) return;
  const key=cellKey(row,col);
  if(!state.values[row][col]&&!state.notes.get(key)?.size) return;
  record();
  state.values[row][col]=0;
  state.notes.delete(key);
  saveProgress(); renderBoard(); renderNumbers(); updateHistory();
}

function undo() {
  if(!state.undoStack.length) return;
  const previous=state.undoStack.pop();
  state.redoStack.push(snapshot());
  restore(previous);
}

function redo() {
  if(!state.redoStack.length) return;
  const next=state.redoStack.pop();
  state.undoStack.push(snapshot());
  restore(next); checkCompletion();
}

function updateHistory() {
  $('#ultraUndoBtn').disabled=state.undoStack.length===0;
  $('#ultraRedoBtn').disabled=state.redoStack.length===0;
}

function boardComplete() {
  return state.values.every((row)=>row.every((value)=>SYMBOLS.includes(value)));
}

function boardValid() {
  if(!boardComplete()) return false;
  return system().units.every((unit)=>new Set(unit.cells.map(({row,col})=>state.values[row][col])).size===SIZE);
}

function wrongCount() {
  let count=0;
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(!isGiven(r,c)&&state.values[r][c]!==item().solution[r][c]) count++;
  return count;
}

function checkCompletion() {
  if(!boardComplete()) return;
  if(!boardValid()) {
    const errors=wrongCount();
    $('#invalidErrorCount').textContent=errors===1?'Hay 1 casilla incorrecta.':`Hay ${errors} casillas incorrectas.`;
    if(!invalidDialog.open) invalidDialog.showModal();
    return;
  }
  complete();
}

function complete() {
  stopTimer();
  const current=item();
  markUltraComplete(current);
  $('#ultraVictoryTitle').textContent=`Dirección ${current.slope} descubierta`;
  $('#ultraVictoryText').textContent=`Has revelado las siete rectas de pendiente ${current.slope}. Esta familia será parte de la construcción final.`;
  $('#ultraFamilyGraphic').innerHTML=familySvg(current.slope,{compact:false,animated:true});
  ultraVictoryDialog.showModal();
  window.dispatchEvent(new CustomEvent('sudoproyective:projective-change'));
}

function startTimer() {
  stopTimer();
  state.startedAt=Date.now()-state.elapsed*1000;
  updateTimer();
  state.timerId=setInterval(()=>{
    state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);
    updateTimer();
    if(state.elapsed%10===0) saveProgress();
  },1000);
}

function stopTimer() {
  if(state.timerId) clearInterval(state.timerId);
  state.timerId=null;
  if(state.startedAt) state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);
}

function updateTimer() {
  const min=String(Math.floor(state.elapsed/60)).padStart(2,'0');
  const sec=String(state.elapsed%60).padStart(2,'0');
  $('#ultraTimer').textContent=`${min}:${sec}`;
}

$('#ultraBackBtn')?.addEventListener('click',leaveUltra);
$('#ultraNotesBtn')?.addEventListener('click',()=>{state.notesMode=!state.notesMode;$('#ultraNotesBtn').classList.toggle('active',state.notesMode);});
$('#ultraRoutesBtn')?.addEventListener('click',()=>{state.routesVisible=!state.routesVisible;$('#ultraRoutesBtn').classList.toggle('active',state.routesVisible);$('#ultraRoutesBtn').innerHTML=state.routesVisible?'Rutas <span>●</span>':'Rutas <span>○</span>';paintSelection();});
$('#ultraEraseBtn')?.addEventListener('click',erase);
$('#ultraUndoBtn')?.addEventListener('click',undo);
$('#ultraRedoBtn')?.addEventListener('click',redo);
$('#ultraVictoryContinue')?.addEventListener('click',()=>{
  ultraVictoryDialog.close();
  leaveUltra();
  window.dispatchEvent(new CustomEvent('sudoproyective:ultra-return',{detail:{allDone:allUltraComplete()}}));
});
window.addEventListener('beforeunload',saveProgress);
