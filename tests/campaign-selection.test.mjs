import assert from 'node:assert/strict';
import { SMALL_FIELD_DATA } from '../js/fields/data.js';
import { SHORT_CAMPAIGN_SELECTION, selectedCampaignRows } from '../js/fields/campaign-selection.js';
import { FIELD_CAMPAIGNS, FIELD_CONFIG, FIELD_STORAGE_KEY,
  blankFieldProgress, fieldPlatinum, fieldRouteTrophy,
  fieldHardFinished, readFieldProgress, writeFieldProgress,
} from '../js/fields/core.js';

function routeUnits(p, slope) {
  const units=[];
  for(let k=0;k<p;k++) {
    units.push(Array.from({length:p},(_,c)=>k*p+c));
    units.push(Array.from({length:p},(_,r)=>r*p+k));
    units.push(Array.from({length:p},(_,c)=>((slope*c+k)%p)*p+c));
  }
  return units;
}
// Heurística de complejidad para puzzles con igual número de pistas:
// candidatos disponibles, deducciones forzadas al inicio, singles de
// única posición en una unidad y rondas de propagación. No sustituye
// la evaluación humana de la dificultad.
function logicalCost(row,p) {
  const [,, , ,puzzle]=row,units=routeUnits(p,row[1]);
  const board=Array.from(puzzle,Number);
  function candidates() {
    const masks=Array(p*p).fill(0);
    let total=0,singles=0;
    for(let i=0;i<p*p;i++) {
      if(board[i])continue;
      let used=0;
      for(const unit of units) {
        if(!unit.includes(i))continue;
        for(const j of unit) if(board[j]) used|=1<<(board[j]-1);
      }
      const mask=((1<<p)-1)&~used;
      masks[i]=mask;
      let count=0;
      for(let bits=mask;bits;bits&=bits-1)count++;
      total+=count;
      if(count===1)singles++;
    }
    return {masks,total,singles};
  }
  const init=candidates();
  let rounds=0,entropy=0,hidden=0;
  while(rounds<50) {
    rounds++;
    const {masks,total}=candidates();
    entropy+=total;
    const placements=new Map();
    for(let i=0;i<p*p;i++)
      if(masks[i]&&!(masks[i]&(masks[i]-1)))
        placements.set(i,32-Math.clz32(masks[i]));
    for(const unit of units) for(let number=1;number<=p;number++) {
      if(unit.some(i=>board[i]===number))continue;
      const possibles=unit.filter(i=>!board[i]&&(masks[i]&(1<<(number-1))));
      if(possibles.length===1&&!placements.has(possibles[0])) {
        placements.set(possibles[0],number);
        hidden++;
      }
    }
    if(!placements.size)break;
    let changed=0;
    for(const [i,value] of placements) if(!board[i]) {board[i]=value;changed++;}
    if(!changed)break;
  }
  const unresolved=board.filter(x=>x===0).length;
  return unresolved*1000+hidden*40+entropy+init.total*2-init.singles*8+rounds*7;
}

for(const p of [3,5]) {
  const cfg=FIELD_CONFIG[p];
  const original=SMALL_FIELD_DATA[p];
  const levels=FIELD_CAMPAIGNS[p].levels;
  const selected=selectedCampaignRows(p,original.levels,cfg);
  const expectedCount=(p-1)*3*cfg.perDifficulty;
  assert.equal(levels.length,expectedCount);
  assert.equal(selected.length,expectedCount);
  assert.equal(original.ultras.length,p-1,'Todos los secretos originales permanecen');
  assert.deepEqual(FIELD_CAMPAIGNS[p].ultra.map(x=>x.id),
    original.ultras.map(x=>x[0]),'Los Ultraexpertos conservan sus IDs');
  assert.equal(new Set(levels.map(x=>x.id)).size,levels.length);

  for(let slope=1;slope<p;slope++) for(let group=0;group<3;group++) {
    const source=original.levels.filter(row=>row[1]===slope&&row[3]===group);
    const chosen=levels.filter(x=>x.slope===slope&&x.group===group);
    assert.equal(chosen.length,cfg.perDifficulty);
    const expectedIndices=SHORT_CAMPAIGN_SELECTION[p][slope-1][group];
    assert.deepEqual(chosen.map(x=>x.legacyLocalNumber),expectedIndices);
    for(let j=0;j<chosen.length;j++) {
      const item=chosen[j];
      const originalRow=source.find(row=>row[2]===expectedIndices[j]);
      assert.ok(originalRow);
      assert.equal(item.localNumber,group*cfg.perDifficulty+j+1);
      assert.equal(item.id,originalRow[0],'El guardado histórico depende del ID, nunca de la nueva posición');
      assert.equal(item.puzzle.flat().join(''),originalRow[4]);
      assert.equal(item.solution.flat().join(''),originalRow[5]);
    }
    const ranked=source.map(row=>({number:row[2],score:logicalCost(row,p)}))
      .sort((a,b)=>b.score-a.score||b.number-a.number);
    const hardest=new Set(ranked.slice(0,cfg.perDifficulty).map(x=>x.number));
    assert.deepEqual(new Set(expectedIndices),hardest,
      'Se deben conservar los puzzles más complejos de F'+p+' ruta '+slope+' dificultad '+group);
    for(let j=1;j<chosen.length;j++)
      assert.ok(logicalCost(source.find(x=>x[2]===chosen[j-1].legacyLocalNumber),p)
        <=logicalCost(source.find(x=>x[2]===chosen[j].legacyLocalNumber),p),
        'Progresión interna del grupo: de menor a mayor complejidad estimada');
  }
  // Guardar progreso previo no debe borrar niveles archivados.
  const progress=blankFieldProgress();
  for(const item of original.levels) progress.bestStars[item[0]]=3;
  progress.levels[original.levels[0][0]]={values:[[2]],notes:{'0,0':[1]}};
  progress.ultraCompleted[original.ultras[0][0]]=true;
  progress.finalSeen=true;
  progress.availableStars=original.levels.length*3;
  assert.equal(fieldPlatinum(p,progress),true,'El platino ya ganado sigue siendo válido');
  assert.equal(fieldHardFinished(p,progress),true);
  assert.equal(fieldRouteTrophy(p,1,progress),'Oro');
  assert.ok(progress.bestStars[original.levels[0][0]],'Las marcas archivadas permanecen guardadas');
}

const originalStorage=globalThis.localStorage;
const historical={3:{...blankFieldProgress(),bestStars:{'f3-r1-l01':2,'f3-r1-l05':3}},
  5:{...blankFieldProgress(),bestStars:{'f5-r1-l01':1,'f5-r1-l05':3},
    ultraCompleted:{'f5-ultra-1':true}},9:blankFieldProgress(),11:blankFieldProgress(),
  achievements:{previousSuperPlatinumWorlds:4}};
let stored=JSON.stringify(historical);
globalThis.localStorage={
  getItem(key){assert.equal(key,FIELD_STORAGE_KEY);return stored;},
  setItem(key,value){assert.equal(key,FIELD_STORAGE_KEY);stored=value;},
};
const read=readFieldProgress();
assert.equal(read[3].bestStars['f3-r1-l01'],2,'Se conserva el progreso archivado');
assert.equal(read[3].bestStars['f3-r1-l05'],3,'Se conserva el progreso visible');
assert.equal(read[5].bestStars['f5-r1-l01'],1);
assert.equal(read[5].ultraCompleted['f5-ultra-1'],true);
writeFieldProgress(read);
assert.deepEqual(JSON.parse(stored),historical,'No se migra ni se elimina el progreso ya guardado');
if(originalStorage===undefined)delete globalThis.localStorage;
else globalThis.localStorage=originalStorage;

assert.equal(FIELD_CAMPAIGNS[9].levels.length,216);
assert.equal(FIELD_CAMPAIGNS[11].levels.length,150);
console.log('campaign-selection.test.mjs: OK');
