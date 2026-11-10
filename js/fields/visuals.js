import { FIELD_CONFIG, routeCells } from './core.js';

// Misma disposición y clases CSS de la construcción circular aprobada en F7.
// Las posiciones en pantalla son un esquema de incidencias, no rectas euclidianas.
export const FIELD_ROUTE_COLORS = Object.freeze([
  '#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa',
  '#f783ac', '#ffa94d', '#70d6ff', '#4dd4ac',
]);
const FAMILY_COLORS = Object.freeze([
  '#f7c948','#8ce99a','#ff8787','#c77dff','#4dd4ac',
  '#ff922b','#70d6ff','#f06595','#b197fc','#e7cb83',
]);
const GF9_ELEMENTS = ['0','1','2','α','1+α','2+α','2α','1+2α','2+2α'];

export function slopeName(p, slope) {
  return p === 9 ? GF9_ELEMENTS[slope] : String(slope);
}

export function fieldDirections(p) {
  return [
    ...Array.from({ length: p - 1 }, (_, i) => ({
      key: i + 1,
      short: 'Ruta ' + (i + 1),
      math: 'm = ' + slopeName(p, i + 1),
      color: FAMILY_COLORS[i % FAMILY_COLORS.length],
    })),
    { key: 0, short: 'Filas', math: 'm = 0', color: FAMILY_COLORS[(p-1)%FAMILY_COLORS.length] },
    { key: 'inf', short: 'Columnas', math: 'm = ∞', color: FAMILY_COLORS[p%FAMILY_COLORS.length] },
  ];
}

function familyCells(p, direction, intercept) {
  if (direction === 'inf') return Array.from({ length:p }, (_, r) => ({ row:r, col:intercept }));
  if (direction === 0) return Array.from({ length:p }, (_, c) => ({ row:intercept, col:c }));
  return routeCells(p, direction, intercept, 0);
}

function coords(cells, x0, y0, step) {
  return cells.map(({row,col}) => ({x:x0+col*step,y:y0+row*step}));
}
function pointsAttr(points) {
  return points.map(({x,y})=>x.toFixed(2)+','+y.toFixed(2)).join(' ');
}
function outwardAnchor(points, cx, cy, ux, uy) {
  return points.reduce((best, point) =>
    (point.x-cx)*ux+(point.y-cy)*uy > (best.x-cx)*ux+(best.y-cy)*uy ? point : best,
    points[0]
  );
}

export function circularFieldProjectiveSvg(p) {
  if (!FIELD_CONFIG[p]) throw new Error('Cuerpo no disponible: F' + p);
  const size=1000, center=500, boardRadius=292, infinityRadius=445;
  const boardHalf=58, step=90/(p-1);
  const directions=fieldDirections(p);
  const infinityPoints=[],pieces=[];
  pieces.push('<circle class="projective-orbit-guide" cx="500" cy="500" r="445"/>');
  pieces.push('<circle class="projective-center-halo" cx="500" cy="500" r="112"/>');
  pieces.push('<text class="projective-center-title" x="500" y="492" text-anchor="middle">AG(2,'+p+')</text>');
  pieces.push('<text class="projective-center-subtitle" x="500" y="520" text-anchor="middle">'+(p+1)+' direcciones</text>');
  directions.forEach((direction,index)=>{
    const angle=-Math.PI/2+index*2*Math.PI/directions.length;
    const ux=Math.cos(angle),uy=Math.sin(angle);
    const cx=center+boardRadius*ux,cy=center+boardRadius*uy;
    const ix=center+infinityRadius*ux,iy=center+infinityRadius*uy;
    infinityPoints.push({x:ix,y:iy});
    const group=[];
    group.push('<rect class="circle-board-frame" x="'+(cx-boardHalf)+'" y="'+(cy-boardHalf)+'" width="116" height="116" rx="13" style="--family-color:'+direction.color+'"/>');
    for(let row=0;row<p;row++) for(let col=0;col<p;col++){
      const x=cx-45+col*step,y=cy-45+row*step;
      group.push('<circle class="circle-grid-point" cx="'+x+'" cy="'+y+'" r="'+(p===9?1.45:2)+'"/>');
    }
    for(let b=0;b<p;b++){
      const color=FIELD_ROUTE_COLORS[b%FIELD_ROUTE_COLORS.length];
      const path=coords(familyCells(p,direction.key,b),cx-45,cy-45,step);
      const anchor=outwardAnchor(path,cx,cy,ux,uy);
      const delay=(b*.16).toFixed(2)+'s';
      group.push('<polyline class="circle-route" points="'+pointsAttr(path)+'" style="--line-color:'+color+';--route-delay:'+delay+'"/>');
      group.push('<line class="circle-extension" x1="'+anchor.x+'" y1="'+anchor.y+'" x2="'+ix+'" y2="'+iy+'" style="--line-color:'+color+';--route-delay:'+delay+'"/>');
    }
    group.push('<circle class="circle-infinity-point" cx="'+ix+'" cy="'+iy+'" r="10" style="--family-color:'+direction.color+'"/>');
    group.push('<text class="circle-infinity-label" x="'+ix+'" y="'+(iy+28)+'" text-anchor="middle">P'+(direction.key==='inf'?'∞':direction.key)+'</text>');
    const lx=cx-ux*88,ly=cy-uy*88;
    group.push('<text class="circle-family-label" x="'+lx+'" y="'+ly+'" text-anchor="middle" style="--family-color:'+direction.color+'">'+direction.short+'</text>');
    group.push('<text class="circle-family-math" x="'+lx+'" y="'+(ly+18)+'" text-anchor="middle">'+direction.math+'</text>');
    pieces.push('<g class="circle-family circle-family-'+index+'" data-family-index="'+index+'" style="--family-color:'+direction.color+'">'+group.join('')+'</g>');
  });
  // El polígono es una única curva cerrada: representa la recta del infinito
  // que reúne los p+1 puntos del infinito (no p+1 rectas distintas).
  pieces.push('<polygon class="infinity-rope" points="'+pointsAttr(infinityPoints)+'"/>');
  const count=p*p+p+1;
  pieces.push('<g class="projective-final-label"><text x="500" y="491" text-anchor="middle">PG(2,'+p+')</text><text class="small" x="500" y="520" text-anchor="middle">'+count+' puntos · '+count+' rectas</text></g>');
  return '<svg class="circular-projective-svg" viewBox="0 0 1000 1000" role="img" aria-label="Construcción circular de PG(2,'+p+')">'+pieces.join('')+'</svg>';
}

export function ultraFieldRevealSvg(solution, p, slope) {
  const step=250/(p-1),pad=38,infX=395,infY=163;
  const color=fieldDirections(p).find(x=>x.key===slope).color;
  const pieces=[];
  pieces.push('<rect class="ultra-reveal-board" x="17" y="17" width="292" height="292" rx="18" style="--family-color:'+color+'"/>');
  const half=Math.min(step-5,p===3?47:p===5?27:18);
  for(let row=0;row<p;row++)for(let col=0;col<p;col++){
    const x=pad+col*step,y=pad+row*step;
    pieces.push('<rect class="ultra-reveal-cell" x="'+(x-half)+'" y="'+(y-half)+'" width="'+(half*2)+'" height="'+(half*2)+'" rx="6"/>');
    pieces.push('<text class="ultra-reveal-number" x="'+x+'" y="'+(y+6)+'" text-anchor="middle" style="font-size:'+(p===9?16:p===5?22:28)+'px">'+solution[row][col]+'</text>');
    pieces.push('<circle class="ultra-reveal-point" cx="'+x+'" cy="'+y+'" r="4.2"/>');
  }
  for(let b=0;b<p;b++){
    const tint=FIELD_ROUTE_COLORS[b%FIELD_ROUTE_COLORS.length],delay=(b*.30).toFixed(2)+'s';
    const path=coords(familyCells(p,slope,b),pad,pad,step);
    const anchor=path.reduce((best,pt)=>pt.x>best.x?pt:best,path[0]);
    pieces.push('<polyline class="ultra-reveal-route" points="'+pointsAttr(path)+'" style="--line-color:'+tint+';--route-delay:'+delay+'"/>');
    pieces.push('<line class="ultra-reveal-extension" x1="'+anchor.x+'" y1="'+anchor.y+'" x2="'+infX+'" y2="'+infY+'" style="--line-color:'+tint+';--route-delay:'+delay+'"/>');
  }
  pieces.push('<circle class="ultra-reveal-infinity" cx="'+infX+'" cy="'+infY+'" r="11" style="--family-color:'+color+'"/>');
  pieces.push('<text class="ultra-reveal-infinity-label" x="'+infX+'" y="'+(infY+31)+'" text-anchor="middle">P'+slope+'</text>');
  return '<svg class="ultra-reveal-svg phase-numbers" viewBox="0 0 440 330" role="img" aria-label="Del sudoku de F'+p+' a las rectas de pendiente '+slope+'">'+pieces.join('')+'</svg>';
}
