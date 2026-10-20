export const SIZE = 7;
export const SYMBOLS = Object.freeze([1, 2, 3, 4, 5, 6, 7]);

export const mod = (n, m = SIZE) => ((n % m) + m) % m;
export const cellKey = (row, col) => `${row},${col}`;

export function makeRows() {
  return Array.from({ length: SIZE }, (_, row) =>
    Array.from({ length: SIZE }, (_, col) => ({ row, col }))
  );
}

export function makeColumns() {
  return Array.from({ length: SIZE }, (_, col) =>
    Array.from({ length: SIZE }, (_, row) => ({ row, col }))
  );
}

// In screen coordinates, row plays the role of y and col the role of x.
// The route family is y = x + b (mod 7), so b = row - col (mod 7).
export function routeId(row, col, slope = 1) {
  return mod(row - slope * col);
}

export function makeRoutes(slope = 1) {
  return Array.from({ length: SIZE }, (_, b) =>
    Array.from({ length: SIZE }, (_, col) => ({
      row: mod(slope * col + b),
      col,
    }))
  );
}

export function makeConstraintSystem(slopes = [1]) {
  const rows = makeRows();
  const columns = makeColumns();
  const routeFamilies = slopes.map((slope) => ({ slope, routes: makeRoutes(slope) }));
  const units = [
    ...rows.map((cells, id) => ({ type: 'row', id, cells })),
    ...columns.map((cells, id) => ({ type: 'column', id, cells })),
    ...routeFamilies.flatMap(({ slope, routes }) =>
      routes.map((cells, id) => ({ type: 'route', slope, id, cells }))
    ),
  ];

  const memberships = new Map();
  const peers = new Map();

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const key = cellKey(row, col);
      const ownUnits = units.filter((unit) =>
        unit.cells.some((cell) => cell.row === row && cell.col === col)
      );
      memberships.set(key, ownUnits);
      const peerKeys = new Set();
      ownUnits.forEach((unit) => unit.cells.forEach((cell) => {
        const candidate = cellKey(cell.row, cell.col);
        if (candidate !== key) peerKeys.add(candidate);
      }));
      peers.set(key, peerKeys);
    }
  }

  return { rows, columns, routeFamilies, units, memberships, peers, slopes };
}

export function routeCellsFor(row, col, slope = 1) {
  const b = routeId(row, col, slope);
  return makeRoutes(slope)[b];
}

export function conflictKinds(a, b, slopes = [1]) {
  const kinds = [];
  if (a.row === b.row) kinds.push('row');
  if (a.col === b.col) kinds.push('column');
  for (const slope of slopes) {
    if (routeId(a.row, a.col, slope) === routeId(b.row, b.col, slope)) kinds.push(`route:${slope}`);
  }
  return kinds;
}
