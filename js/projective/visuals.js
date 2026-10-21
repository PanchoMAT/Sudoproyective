function pointXY(row, col, pad = 16, step = 18) {
  return { x: pad + col * step, y: pad + row * step };
}

export function familySvg(direction, { compact = true, animated = false } = {}) {
  const pad = compact ? 16 : 24;
  const step = compact ? 17 : 25;
  const gridEnd = pad + step * 6;
  const view = compact ? 142 : 220;
  const lineClass = animated ? 'project-line draw-line' : 'project-line';
  const pieces = [];

  for (let r=0; r<7; r++) for (let c=0; c<7; c++) {
    const {x,y} = pointXY(r,c,pad,step);
    pieces.push(`<circle class="project-point" cx="${x}" cy="${y}" r="${compact ? 1.7 : 2.3}"/>`);
  }

  if (direction === 'inf') {
    for (let c=0; c<7; c++) {
      const a = pointXY(0,c,pad,step), b = pointXY(6,c,pad,step);
      pieces.push(`<line class="${lineClass}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`);
    }
  } else {
    const slope = Number(direction);
    if (slope === 0) {
      for (let r=0; r<7; r++) {
        const a = pointXY(r,0,pad,step), b = pointXY(r,6,pad,step);
        pieces.push(`<line class="${lineClass}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`);
      }
    } else {
      const signed = slope <= 3 ? slope : slope - 7;
      for (let b=0; b<7; b++) {
        let row = b;
        for (let c=0; c<6; c++) {
          const raw = row + signed;
          const nextRow = ((raw % 7) + 7) % 7;
          if (raw >= 0 && raw < 7) {
            const a = pointXY(row,c,pad,step), d = pointXY(nextRow,c+1,pad,step);
            pieces.push(`<line class="${lineClass}" x1="${a.x}" y1="${a.y}" x2="${d.x}" y2="${d.y}"/>`);
          }
          row = nextRow;
        }
      }
    }
  }

  const infX = gridEnd + (compact ? 18 : 30);
  const infY = pad + step * 3;
  pieces.push(`<circle class="infinity-point" cx="${infX}" cy="${infY}" r="${compact ? 4 : 6}"/>`);
  return `<svg class="family-svg ${animated ? 'animated-family' : ''}" viewBox="0 0 ${view} ${view}" role="img" aria-label="Familia de rectas de dirección ${direction === 'inf' ? 'vertical' : direction}">${pieces.join('')}</svg>`;
}

export function renderDirectionGallery(root) {
  root.innerHTML = '';
  [0,1,2,3,4,5,6,'inf'].forEach((direction, index) => {
    const card = document.createElement('article');
    card.className = 'direction-family-card';
    card.style.setProperty('--delay', `${index * .18}s`);
    const label = direction === 'inf' ? '∞ · columnas' : direction === 0 ? '0 · filas' : `${direction} · Ruta ${direction}`;
    card.innerHTML = `${familySvg(direction)}<strong>${label}</strong><small>7 rectas · 1 dirección</small>`;
    root.appendChild(card);
  });
}

export function finalPlaneSvg() {
  const pieces = [];
  const pad=28, step=30;
  for (let r=0; r<7; r++) for (let c=0; c<7; c++) {
    pieces.push(`<circle class="plane-affine-point" cx="${pad+c*step}" cy="${pad+r*step}" r="3"/>`);
  }
  const labels=['0','1','2','3','4','5','6','∞'];
  const y=250;
  labels.forEach((label,i) => {
    const x=22+i*28;
    pieces.push(`<circle class="plane-infinity-point p-${i}" cx="${x}" cy="${y}" r="7"/>`);
    pieces.push(`<text class="plane-label" x="${x}" y="${y+22}" text-anchor="middle">${label}</text>`);
  });
  pieces.push(`<line class="infinity-line" x1="14" y1="${y}" x2="226" y2="${y}"/>`);
  return `<svg class="final-plane-svg" viewBox="0 0 240 286" role="img" aria-label="Construcción esquemática de PG(2,7)">${pieces.join('')}</svg>`;
}
