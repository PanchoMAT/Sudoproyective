import assert from 'node:assert/strict';

const mod = (n) => ((n % 7) + 7) % 7;
const affinePoint = (x,y) => `A:${x},${y}`;
const infinityPoint = (d) => `I:${d}`;
const directions = ['0','1','2','3','4','5','6','inf'];
const points = [
  ...Array.from({length:7},(_,x)=>Array.from({length:7},(_,y)=>affinePoint(x,y))).flat(),
  ...directions.map(infinityPoint),
];

const lines = [];
for (let m=0; m<=6; m++) {
  for (let b=0; b<7; b++) {
    lines.push(new Set([
      ...Array.from({length:7},(_,x)=>affinePoint(x, mod(m*x+b))),
      infinityPoint(String(m)),
    ]));
  }
}
for (let b=0; b<7; b++) {
  lines.push(new Set([
    ...Array.from({length:7},(_,y)=>affinePoint(b,y)),
    infinityPoint('inf'),
  ]));
}
lines.push(new Set(directions.map(infinityPoint)));

assert.equal(points.length, 57, 'PG(2,7) debe tener 57 puntos');
assert.equal(new Set(points).size, 57, 'Los 57 puntos deben ser distintos');
assert.equal(lines.length, 57, 'PG(2,7) debe tener 57 rectas');
for (const line of lines) assert.equal(line.size, 8, 'Cada recta debe contener 8 puntos');
for (const point of points) assert.equal(lines.filter((line)=>line.has(point)).length, 8, 'Cada punto debe pertenecer a 8 rectas');

for (let i=0; i<points.length; i++) {
  for (let j=i+1; j<points.length; j++) {
    const through = lines.filter((line)=>line.has(points[i]) && line.has(points[j])).length;
    assert.equal(through, 1, `Dos puntos deben determinar una única recta: ${points[i]}, ${points[j]}`);
  }
}

for (let i=0; i<lines.length; i++) {
  for (let j=i+1; j<lines.length; j++) {
    const intersection = [...lines[i]].filter((point)=>lines[j].has(point));
    assert.equal(intersection.length, 1, 'Dos rectas deben cortarse en exactamente un punto');
  }
}

console.log('projective.test.mjs: OK');
