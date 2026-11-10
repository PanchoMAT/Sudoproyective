import assert from 'node:assert/strict';
import fs from 'node:fs';
import { circularFieldProjectiveSvg, ultraFieldRevealSvg, fieldDirections } from '../js/fields/visuals.js';
import { FIELD_CAMPAIGNS, FIELD_CONFIG, FIELD_STORAGE_KEY, FIELD_DIFFICULTIES,
  isValidSolution, countFieldSolutions, constraintUnits, routeCells, mod,
  fieldAdd, fieldSub, fieldMul, routeId,
  fieldRouteTrophy, fieldRouteStars, fieldPlatinum, fieldHardFinished,
  fieldUltraFinished, fieldProgressSummary, blankFieldProgress,
} from '../js/fields/core.js';

assert.equal(FIELD_STORAGE_KEY, 'sudoproyectivo-fields-v1');
let total = 0;
let ultraTotal = 0;
for (const p of [3,5,9]) {
  const cfg = FIELD_CAMPAIGNS[p];
  const per = FIELD_CONFIG[p].perDifficulty;
  assert.equal(cfg.routeCount,p-1);
  assert.equal(cfg.levels.length,(p-1)*per*3);
  assert.equal(cfg.ultra.length,p-1);
  assert.equal(cfg.projectivePoints,p*p+p+1);
  assert.deepEqual(FIELD_DIFFICULTIES,['Fácil','Intermedio','Difícil']);
  const ids = new Set();
  const grids = new Set();
  for (let m=1;m<p;m++) {
    const items = cfg.levels.filter((x)=>x.slope===m);
    assert.equal(items.length,per*3);
    for(let diff=0;diff<3;diff++)
      assert.equal(items.filter((x)=>x.group===diff).length,per);
    for(let i=0;i<items.length;i++)
      assert.equal(items[i].localNumber,i+1);
    const units=constraintUnits(p,m);
    assert.equal(units.length,p*3);
    for(const unit of units)assert.equal(unit.length,p);
    const origin=routeCells(p,m,0,0);
    assert.equal(origin.length,p);
    assert.equal(new Set(origin.map((x)=>x.row+','+x.col)).size,p);
    assert.ok(origin.every((x)=>routeId(x.row,x.col,m,p)===0));
    for(const item of items) {
      assert.equal(item.p,p);
      assert.equal(item.difficulty,FIELD_DIFFICULTIES[item.group]);
      assert.ok(!ids.has(item.id),item.id+': ID duplicado');
      ids.add(item.id);
      const key=item.puzzle.flat().join('');
      assert.ok(!grids.has(key),item.id+': puzzle duplicado');
      grids.add(key);
      assert.equal(item.puzzle.length,p);
      assert.ok(item.puzzle.every((row)=>row.length===p));
      assert.ok(isValidSolution(item.solution,p,m),item.id+': solución inválida');
      assert.ok(item.puzzle.every((row,r)=>row.every((v,c)=>!v||item.solution[r][c]===v)),
        item.id+': pista incorrecta');
      assert.equal(countFieldSolutions(item.puzzle,p,m),1,item.id+': debe tener solución única');
      const expected=p===3 ? [6,4,3] : p===5 ? [16,13,10] : [46,36,29];
      const givens=item.puzzle.flat().filter(Boolean).length;
      assert.equal(givens,expected[item.group],item.id+': cantidad de pistas');
      total++;
    }
    const ultra=cfg.ultra.find((x)=>x.slope===m);
    assert.ok(ultra);
    assert.ok(isValidSolution(ultra.solution,p,m),ultra.id+': solución inválida');
    assert.ok(ultra.puzzle.every((row,r)=>row.every((v,c)=>!v||ultra.solution[r][c]===v)));
    assert.equal(countFieldSolutions(ultra.puzzle,p,m),1,ultra.id+': debe ser único');
    assert.ok(ultra.puzzle.flat().filter(Boolean).length<items.filter(x=>x.group===2)[0].puzzle.flat().filter(Boolean).length,
      ultra.id+': el Ultraexperto debe tener menos pistas que Difícil');
    ultraTotal++;
  }
  const world=blankFieldProgress();
  assert.equal(fieldProgressSummary(p,world).done,0);
  assert.equal(fieldRouteTrophy(p,1,world),'Pendiente');
  assert.equal(fieldPlatinum(p,world),false);
  assert.equal(fieldHardFinished(p,world),false);
  assert.equal(fieldUltraFinished(p,world),false);
  for(const item of cfg.levels) world.bestStars[item.id]=3;
  assert.equal(fieldRouteStars(p,1,world),per*9);
  assert.equal(fieldRouteTrophy(p,1,world),'Oro');
  assert.equal(fieldPlatinum(p,world),true);
  assert.equal(fieldHardFinished(p,world),true);
  for(const item of cfg.ultra) world.ultraCompleted[item.id]=true;
  assert.equal(fieldUltraFinished(p,world),true);
  assert.equal(fieldProgressSummary(p,world).stars,cfg.levels.length*3);
}
assert.equal(total,330);
assert.equal(ultraTotal,14);

const ui=fs.readFileSync(new URL('../js/fields/app.js',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../js/fields/game.js',import.meta.url),'utf8');
const legacy=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const puzzles=fs.readFileSync(new URL('../js/puzzles.js',import.meta.url),'utf8');
assert.match(ui,/superPlatinum/);
assert.match(ui,/platinum7/);
assert.match(ui,/fieldUltraFinished/);
assert.match(ui,/Construir el plano proyectivo/);
assert.match(ui,/Reiniciar progreso de/);
assert.match(ui,/data-field-action="enter"/);
assert.match(ui,/data-field-action="reset-world"/);
assert.match(game,/state\.values = copyGrid\(state\.item\.puzzle\)/,'El reinicio vuelve a las pistas originales');
assert.match(game,/fieldSolutionBtn/);
assert.match(game,/fieldUndo/);
assert.match(game,/fieldNotes/);
assert.match(game,/fieldHint/);
assert.match(puzzles,/import\('\.\/fields\/app\.js'\)/,'Debe entrar al selector nuevo');
assert.match(legacy,/const STORAGE_KEY = 'sudoproyective-v02';/,'Se conserva el progreso F7');
// Axiomas básicos del cuerpo GF(9) = GF(3)[α]/(α²−2).
assert.equal(fieldMul(3,3,9),2,'α² = 2');
for(let a=0;a<9;a++) {
  assert.equal(fieldAdd(a,0,9),a);
  assert.equal(fieldMul(a,1,9),a);
  for(let b=0;b<9;b++) {
    assert.equal(fieldSub(fieldAdd(a,b,9),b,9),a);
    assert.equal(fieldAdd(a,b,9),fieldAdd(b,a,9));
    assert.equal(fieldMul(a,b,9),fieldMul(b,a,9));
    for(let c=0;c<9;c++) {
      assert.equal(fieldMul(a,fieldAdd(b,c,9),9),
        fieldAdd(fieldMul(a,b,9),fieldMul(a,c,9),9));
      assert.equal(fieldMul(fieldMul(a,b,9),c,9),
        fieldMul(a,fieldMul(b,c,9),9));
    }
  }
  if(a>0) assert.ok(Array.from({length:8},(_,i)=>i+1).some(b=>fieldMul(a,b,9)===1),
    'Cada elemento no nulo de GF9 debe tener inverso');
}
// Cada dirección genera p rectas y todas las p+1 direcciones satisfacen
// las incidencias combinatorias del plano proyectivo.
for(const p of [3,5,9]){
  const dirs=fieldDirections(p);
  assert.equal(dirs.length,p+1);
  const lines=[];
  const point=(r,c)=>r*p+c;
  for(const direction of dirs) {
    for(let intercept=0;intercept<p;intercept++) {
      const cells=direction.key==='inf'
        ? Array.from({length:p},(_,r)=>({row:r,col:intercept}))
        : direction.key===0
          ? Array.from({length:p},(_,c)=>({row:intercept,col:c}))
          : routeCells(p,direction.key,intercept,0);
      lines.push(new Set([...cells.map(({row,col})=>point(row,col)),p*p+dirs.indexOf(direction)]));
    }
  }
  lines.push(new Set(Array.from({length:p+1},(_,i)=>p*p+i)));
  assert.equal(lines.length,p*p+p+1);
  for(let i=0;i<p*p+p+1;i++) {
    assert.equal(lines.filter(line=>line.has(i)).length,p+1);
    for(let j=i+1;j<p*p+p+1;j++)
      assert.equal(lines.filter(line=>line.has(i)&&line.has(j)).length,1);
  }
  const svg=circularFieldProjectiveSvg(p);
  assert.equal((svg.match(/class="circle-family circle-family-/g)||[]).length,p+1);
  assert.equal((svg.match(/class="circle-route"/g)||[]).length,p*(p+1));
  assert.equal((svg.match(/class="circle-infinity-point"/g)||[]).length,p+1);
  assert.equal((svg.match(/class="infinity-rope"/g)||[]).length,1);
  assert.ok(svg.includes('PG(2,'+p+')'));
  const ultra=FIELD_CAMPAIGNS[p].ultra[0];
  const single=ultraFieldRevealSvg(ultra.solution,p,ultra.slope);
  assert.equal((single.match(/class="ultra-reveal-number"/g)||[]).length,p*p);
  assert.equal((single.match(/class="ultra-reveal-route"/g)||[]).length,p);
  assert.equal((single.match(/class="ultra-reveal-extension"/g)||[]).length,p);
}
const gf9=FIELD_CAMPAIGNS[9];
assert.equal(gf9.levels.length,216);
assert.equal(gf9.ultra.length,8);
// Las soluciones de F9 no inducen una cuarta dirección de líneas paralelas
// para cada símbolo (regularidad involuntaria que eliminamos en F7).
for(const item of gf9.levels) {
  for(let value=1;value<=9;value++){
    const cells=[];
    for(let r=0;r<9;r++)for(let c=0;c<9;c++)
      if(item.solution[r][c]===value)cells.push({r,c});
    assert.equal(cells.length,9);
    for(let m=0;m<9;m++)
      assert.ok(new Set(cells.map(({r,c})=>routeId(r,c,m,9))).size>1,
        item.id+': símbolo alineado inesperadamente en pendiente '+m);
    assert.ok(new Set(cells.map(({c})=>c)).size>1);
  }
}

console.log('fields.test.mjs: OK');
