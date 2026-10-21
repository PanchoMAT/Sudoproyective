const mod = (n) => ((n % 7) + 7) % 7;

export const DIRECTIONS = Object.freeze([
  { key: 0, label: '0 · Filas', short: 'Filas', math: 'm = 0', familyColor: '#70d6ff' },
  { key: 1, label: '1 · Ruta 1', short: 'Ruta 1', math: 'm = 1', familyColor: '#f7c948' },
  { key: 2, label: '2 · Ruta 2', short: 'Ruta 2', math: 'm = 2', familyColor: '#8ce99a' },
  { key: 3, label: '3 · Ruta 3', short: 'Ruta 3', math: 'm = 3', familyColor: '#ff8787' },
  { key: 4, label: '4 · Ruta 4', short: 'Ruta 4', math: 'm = 4', familyColor: '#c77dff' },
  { key: 5, label: '5 · Ruta 5', short: 'Ruta 5', math: 'm = 5', familyColor: '#4dd4ac' },
  { key: 6, label: '6 · Ruta 6', short: 'Ruta 6', math: 'm = 6', familyColor: '#ff922b' },
  { key: 'inf', label: '∞ · Columnas', short: 'Columnas', math: 'm = ∞', familyColor: '#f06595' },
]);

export const ROUTE_COLORS = Object.freeze([
  '#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac', '#ffa94d',
]);

export function directionMeta(direction) {
  return DIRECTIONS.find((item) => String(item.key) === String(direction)) || DIRECTIONS[0];
}

function routePoints(direction, b, pad, step) {
  if (direction === 'inf') {
    return Array.from({ length: 7 }, (_, row) => ({ x: pad + b * step, y: pad + row * step, row, col: b }));
  }
  const slope = Number(direction);
  if (slope === 0) {
    return Array.from({ length: 7 }, (_, col) => ({ x: pad + col * step, y: pad + b * step, row: b, col }));
  }
  return Array.from({ length: 7 }, (_, col) => {
    const row = mod(slope * col + b);
    return { x: pad + col * step, y: pad + row * step, row, col };
  });
}

function polylinePoints(points) {
  return points.map(({ x, y }) => `${x},${y}`).join(' ');
}

export function familySvg(direction, { compact = true, animated = false, extendToInfinity = true } = {}) {
  const meta = directionMeta(direction);
  const pad = compact ? 16 : 25;
  const step = compact ? 17 : 24;
  const gridEnd = pad + step * 6;
  const infX = gridEnd + (compact ? 24 : 44);
  const infY = pad + step * 3;
  const viewW = compact ? 154 : 232;
  const viewH = compact ? 142 : 200;
  const pieces = [`<rect class="family-board-frame" x="${pad - 8}" y="${pad - 8}" width="${gridEnd - pad + 16}" height="${gridEnd - pad + 16}" rx="8" style="--family-color:${meta.familyColor}"/>`];

  for (let b = 0; b < 7; b++) {
    const color = ROUTE_COLORS[b];
    const points = routePoints(direction, b, pad, step);
    const delay = `${(b * (compact ? .16 : .48)).toFixed(2)}s`;
    const routeClass = animated ? 'family-route draw-family-route' : 'family-route';
    pieces.push(`<polyline class="${routeClass}" points="${polylinePoints(points)}" style="--line-color:${color};--route-delay:${delay}"/>`);
    points.forEach(({ x, y }) => {
      pieces.push(`<circle class="family-route-dot" cx="${x}" cy="${y}" r="${compact ? 1.8 : 2.5}" style="--line-color:${color};--route-delay:${delay}"/>`);
    });
    if (extendToInfinity) {
      const anchor = points.reduce((best, point) => point.x > best.x ? point : best, points[0]);
      pieces.push(`<line class="family-extension ${animated ? 'draw-family-extension' : ''}" x1="${anchor.x}" y1="${anchor.y}" x2="${infX}" y2="${infY}" style="--line-color:${color};--route-delay:${delay}"/>`);
    }
  }

  pieces.push(`<circle class="infinity-point" cx="${infX}" cy="${infY}" r="${compact ? 4.5 : 7}" style="--family-color:${meta.familyColor}"/>`);
  pieces.push(`<text class="family-infinity-label" x="${infX}" y="${infY + (compact ? 14 : 20)}" text-anchor="middle">P${direction === 'inf' ? '∞' : direction}</text>`);
  return `<svg class="family-svg ${animated ? 'animated-family' : ''}" viewBox="0 0 ${viewW} ${viewH}" role="img" aria-label="Familia de rectas ${meta.label}">${pieces.join('')}</svg>`;
}

export function ultraRevealSvg(solution, direction) {
  const meta = directionMeta(direction);
  const step = 42;
  const pad = 38;
  const gridEnd = pad + step * 6;
  const infX = 395;
  const infY = pad + step * 3;
  const pieces = [];

  pieces.push(`<rect class="ultra-reveal-board" x="17" y="17" width="${gridEnd - pad + 42}" height="${gridEnd - pad + 42}" rx="18" style="--family-color:${meta.familyColor}"/>`);

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const x = pad + col * step;
      const y = pad + row * step;
      pieces.push(`<rect class="ultra-reveal-cell" x="${x - 18}" y="${y - 18}" width="36" height="36" rx="7"/>`);
      pieces.push(`<text class="ultra-reveal-number" x="${x}" y="${y + 6}" text-anchor="middle">${solution[row][col]}</text>`);
      pieces.push(`<circle class="ultra-reveal-point" cx="${x}" cy="${y}" r="4.2"/>`);
    }
  }

  for (let b = 0; b < 7; b++) {
    const color = ROUTE_COLORS[b];
    const points = routePoints(direction, b, pad, step);
    const delay = `${(b * .38).toFixed(2)}s`;
    pieces.push(`<polyline class="ultra-reveal-route" points="${polylinePoints(points)}" style="--line-color:${color};--route-delay:${delay}"/>`);
    const anchor = points.reduce((best, point) => point.x > best.x ? point : best, points[0]);
    pieces.push(`<line class="ultra-reveal-extension" x1="${anchor.x}" y1="${anchor.y}" x2="${infX}" y2="${infY}" style="--line-color:${color};--route-delay:${delay}"/>`);
  }

  pieces.push(`<circle class="ultra-reveal-infinity" cx="${infX}" cy="${infY}" r="11" style="--family-color:${meta.familyColor}"/>`);
  pieces.push(`<text class="ultra-reveal-infinity-label" x="${infX}" y="${infY + 31}" text-anchor="middle">P${direction === 'inf' ? '∞' : direction}</text>`);

  return `<svg class="ultra-reveal-svg phase-numbers" viewBox="0 0 440 330" role="img" aria-label="Del sudoku resuelto a las rectas de pendiente ${direction}">${pieces.join('')}</svg>`;
}

export function renderDirectionGallery(root) {
  root.innerHTML = '';
  DIRECTIONS.forEach((direction, index) => {
    const card = document.createElement('article');
    card.className = 'direction-family-card';
    card.style.setProperty('--delay', `${index * .24}s`);
    card.style.setProperty('--family-color', direction.familyColor);
    card.innerHTML = `${familySvg(direction.key, { compact: true, animated: false, extendToInfinity: true })}<strong>${direction.label}</strong><small>7 rectas · 1 punto del infinito</small>`;
    root.appendChild(card);
  });
}

function circularRoutePoints(direction, b, cx, cy, step = 15) {
  const padX = cx - step * 3;
  const padY = cy - step * 3;
  return routePoints(direction, b, 0, step).map((point) => ({
    ...point,
    x: padX + point.x,
    y: padY + point.y,
  }));
}

function outwardAnchor(points, cx, cy, ux, uy) {
  return points.reduce((best, point) => {
    const score = (point.x - cx) * ux + (point.y - cy) * uy;
    const bestScore = (best.x - cx) * ux + (best.y - cy) * uy;
    return score > bestScore ? point : best;
  }, points[0]);
}

export function circularProjectiveSvg() {
  const size = 1000;
  const center = size / 2;
  const boardRadius = 292;
  const infinityRadius = 445;
  const boardHalf = 58;
  const pieces = [];
  const infinityPoints = [];

  pieces.push(`<circle class="projective-orbit-guide" cx="${center}" cy="${center}" r="${infinityRadius}"/>`);
  pieces.push(`<circle class="projective-center-halo" cx="${center}" cy="${center}" r="112"/>`);
  pieces.push(`<text class="projective-center-title" x="${center}" y="${center - 8}" text-anchor="middle">AG(2,7)</text>`);
  pieces.push(`<text class="projective-center-subtitle" x="${center}" y="${center + 20}" text-anchor="middle">8 direcciones</text>`);

  DIRECTIONS.forEach((direction, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 4;
    const ux = Math.cos(angle), uy = Math.sin(angle);
    const cx = center + boardRadius * ux;
    const cy = center + boardRadius * uy;
    const ix = center + infinityRadius * ux;
    const iy = center + infinityRadius * uy;
    infinityPoints.push({ x: ix, y: iy });

    const group = [];
    group.push(`<rect class="circle-board-frame" x="${cx - boardHalf}" y="${cy - boardHalf}" width="${boardHalf * 2}" height="${boardHalf * 2}" rx="13" style="--family-color:${direction.familyColor}"/>`);
    for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++) {
      const x = cx - 45 + col * 15;
      const y = cy - 45 + row * 15;
      group.push(`<circle class="circle-grid-point" cx="${x}" cy="${y}" r="2"/>`);
    }

    for (let b = 0; b < 7; b++) {
      const color = ROUTE_COLORS[b];
      const points = circularRoutePoints(direction.key, b, cx, cy, 15);
      const anchor = outwardAnchor(points, cx, cy, ux, uy);
      const delay = `${(b * .22).toFixed(2)}s`;
      group.push(`<polyline class="circle-route" points="${polylinePoints(points)}" style="--line-color:${color};--route-delay:${delay}"/>`);
      group.push(`<line class="circle-extension" x1="${anchor.x}" y1="${anchor.y}" x2="${ix}" y2="${iy}" style="--line-color:${color};--route-delay:${delay}"/>`);
    }

    group.push(`<circle class="circle-infinity-point" cx="${ix}" cy="${iy}" r="10" style="--family-color:${direction.familyColor}"/>`);
    group.push(`<text class="circle-infinity-label" x="${ix}" y="${iy + 28}" text-anchor="middle">${direction.key === 'inf' ? 'P∞' : `P${direction.key}`}</text>`);
    const labelX = cx - ux * 88;
    const labelY = cy - uy * 88;
    group.push(`<text class="circle-family-label" x="${labelX}" y="${labelY}" text-anchor="middle" style="--family-color:${direction.familyColor}">${direction.short}</text>`);
    group.push(`<text class="circle-family-math" x="${labelX}" y="${labelY + 18}" text-anchor="middle">${direction.math}</text>`);
    pieces.push(`<g class="circle-family circle-family-${index}" data-family-index="${index}" style="--family-color:${direction.familyColor}">${group.join('')}</g>`);
  });

  const ropePoints = infinityPoints.map(({ x, y }) => `${x},${y}`).join(' ');
  pieces.push(`<polygon class="infinity-rope" points="${ropePoints}"/>`);
  pieces.push(`<g class="projective-final-label"><text x="${center}" y="${center - 9}" text-anchor="middle">PG(2,7)</text><text class="small" x="${center}" y="${center + 20}" text-anchor="middle">57 puntos · 57 rectas</text></g>`);

  return `<svg class="circular-projective-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Construcción circular esquemática de PG(2,7)">${pieces.join('')}</svg>`;
}
