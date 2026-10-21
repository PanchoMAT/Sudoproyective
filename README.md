# Sudoproyective

Puzzle matemático independiente inspirado en geometría afín finita.

## v0.5

El tablero es `7 × 7` con símbolos `1,…,7`. Cada nivel exige no repetir números en:

- 7 filas;
- 7 columnas;
- 7 rutas de una familia de rectas paralelas.

La regla visible sigue siendo: **fila, columna y ruta: sin repetir**.

## Seis rutas

La campaña usa las seis pendientes diagonales no redundantes de `AG(2,7)`:

- Ruta 1 → `m = 1`;
- Ruta 2 → `m = 2`;
- Ruta 3 → `m = 3`;
- Ruta 4 → `m = 4`;
- Ruta 5 → `m = 5`;
- Ruta 6 → `m = 6`.

La pendiente `0` coincide con las filas y la dirección vertical con las columnas, por lo que no se muestran como rutas adicionales.

## Campaña de 180 niveles

Cada ruta contiene exactamente 30 puzzles fijos:

- niveles 1–10: **Fácil**;
- niveles 11–20: **Intermedio**;
- niveles 21–30: **Difícil**.

En total hay `6 × 30 = 180` niveles y todos están disponibles desde el inicio.

Los 48 puzzles que ya existían en v0.4 conservan sus IDs y sus tableros, pero quedan reorganizados dentro de la nueva estructura de dificultad. Esto permite mantener compatible el progreso local existente.

Todos los 180 puzzles son distintos y tienen solución única bajo la ruta correspondiente.

## Pistas

El jugador elige la casilla que quiere revelar. El costo depende de la dificultad:

- Fácil: **2★**;
- Intermedio: **3★**;
- Difícil: **4★**.

La puntuación del nivel sigue midiendo cuántas pistas se usaron:

- 3★: sin pistas;
- 2★: una pista;
- 1★: dos o más pistas.

Las estrellas históricas determinan trofeos. Las estrellas disponibles son el saldo que puede gastarse en pistas.

## Progresión y trofeos

Cada ruta contiene 30 niveles y un máximo de 90★:

- 🥉 Bronce: 30★;
- 🥈 Plata: 60★;
- 🥇 Oro: 90★.

El trofeo de platino exige oro en las seis rutas.

El máximo global de la campaña es:

`180 × 3 = 540★`.

## Interfaz

- selector compacto para Ruta 1–6;
- niveles listados verticalmente y separados por dificultad;
- cada fila muestra `Nivel N`, estado de completado y mejor marca de estrellas;
- todos los niveles están desbloqueados;
- números completados muestran `✓` en el teclado;
- seleccionar cualquier casilla apaga el resaltado numérico anterior;
- la validación final informa cuántas casillas son incorrectas, pero no cuáles;
- notas, deshacer/rehacer, guardado local, cronómetro y selector numérico fijo para celular.

## Matemática

En coordenadas de pantalla `(row, col)`, una ruta de pendiente `m` cumple

`row = m·col + b (mod 7)`.

Cada `m ∈ {1,2,3,4,5,6}` define una clase paralela distinta del plano afín `AG(2,7)`.

## Pruebas

```bash
npm test
```

Las pruebas verifican:

- las seis geometrías;
- 30 niveles por ruta;
- 10 niveles por dificultad en cada ruta;
- IDs, números y puzzles únicos;
- validez de todas las soluciones;
- compatibilidad entre pistas y soluciones;
- unicidad de los 180 puzzles.
