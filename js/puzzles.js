import './review-bootstrap.js';
import './campaign-migration.js';
import './brand.js';
import './pwa.js';
import './profile.js';
import route1 from './data/route1.js';
import route2 from './data/route2.js';
import route3 from './data/route3.js';
import route4 from './data/route4.js';
import route5 from './data/route5.js';
import route6 from './data/route6.js';
import nonlinear1 from './data/nonlinear/route1.js';
import nonlinear2 from './data/nonlinear/route2.js';
import nonlinear3 from './data/nonlinear/route3.js';
import nonlinear4 from './data/nonlinear/route4.js';
import nonlinear5 from './data/nonlinear/route5.js';
import nonlinear6 from './data/nonlinear/route6.js';

const routeData = [route1, route2, route3, route4, route5, route6];
const nonlinearData = [nonlinear1, nonlinear2, nonlinear3, nonlinear4, nonlinear5, nonlinear6];

function parseGrid(text) {
  return Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: 7 }, (_, col) => Number(text[row * 7 + col]))
  );
}

function difficultyFor(localNumber) {
  if (localNumber <= 10) return 'Fácil';
  if (localNumber <= 20) return 'Intermedio';
  return 'Difícil';
}

function signedStep(slope) {
  return slope <= 3 ? slope : slope - 7;
}

function routeDescription(slope) {
  const step = signedStep(slope);
  if (step > 0) {
    return `La ruta baja ${step} ${step === 1 ? 'casilla' : 'casillas'} al avanzar una columna y continúa por el borde opuesto.`;
  }
  const up = Math.abs(step);
  return `La pendiente es ${slope} en F₇; visualmente la ruta sube ${up} ${up === 1 ? 'casilla' : 'casillas'} al avanzar una columna.`;
}

const raw = routeData.flatMap((rows, index) => {
  const world = index + 1;
  const replacement = nonlinearData[index];
  return rows.map(([id, localNumber], levelIndex) => {
    const [p, s] = replacement[levelIndex];
    return { id, world, localNumber, p, s };
  });
});

export const LEVELS = raw.map(({ id, world, localNumber, p, s }, index) => ({
  id,
  number: index + 1,
  localNumber,
  name: `Nivel ${localNumber}`,
  difficulty: difficultyFor(localNumber),
  subtitle: `${[...p].filter((value) => value === '0').length} casillas por completar`,
  world,
  slope: world,
  slopes: [world],
  puzzle: parseGrid(p),
  solution: parseGrid(s),
}));

export const WORLDS = Array.from({ length: 6 }, (_, index) => {
  const slope = index + 1;
  return {
    id: slope,
    slope,
    signedStep: signedStep(slope),
    name: `Ruta ${slope}`,
    kicker: `Pendiente ${slope} en F₇`,
    description: routeDescription(slope),
    groups: ['Fácil', 'Intermedio', 'Difícil'],
  };
});

export const DIFFICULTIES = ['Fácil', 'Intermedio', 'Difícil'];

// La fase final se carga sólo en navegador y después de que el motor principal termina de inicializarse.
if (typeof document !== 'undefined') {
  setTimeout(async () => {
    try {
      await import('./projective.js');
      if (window.__SUDOP_REVIEW__) {
        await import('./review.js');
        await import('./review-polish.js');
      }
    } catch (error) {
      console.error('No se pudo cargar la fase final de SudoProyectivo', error);
    }
  }, 0);
}
