# Sudoproyective

Puzzle matemático independiente inspirado en geometría afín finita.

## v0.4

El tablero sigue siendo `7 × 7` con símbolos `1,…,7`. Cada nivel exige `AllDifferent` en:

- 7 filas;
- 7 columnas;
- 7 rutas de una familia de rectas paralelas.

La regla visible continúa siendo: **fila, columna y ruta: sin repetir**.

### Seis rutas del tablero 7×7

La v0.4 incorpora las seis direcciones diagonales no redundantes de `AG(2,7)`:

- Ruta `+1` → pendiente `m=1`;
- Ruta `+2` → pendiente `m=2`;
- Ruta `+3` → pendiente `m=3`;
- Ruta `−3` → pendiente `m=4 ≡ -3 (mod 7)`;
- Ruta `−2` → pendiente `m=5 ≡ -2 (mod 7)`;
- Ruta `−1` → pendiente `m=6 ≡ -1 (mod 7)`.

La pendiente `0` coincide con las filas y la dirección vertical con las columnas, por lo que no se presentan como rutas adicionales.

La pantalla de niveles tiene un selector compacto de pestañas. Sólo se muestran los niveles de la ruta seleccionada.

### Niveles

La v0.4 contiene 48 puzzles:

- Ruta +1: 18 niveles originales;
- Ruta +2: 6 niveles;
- Ruta +3: 6 niveles;
- Ruta −3: 6 niveles;
- Ruta −2: 6 niveles;
- Ruta −1: 6 niveles.

Todos tienen solución única bajo su familia de rutas.

### Mejoras de juego

- al aparecer exactamente siete copias de un número en el tablero, su botón muestra un `✓`;
- tocar cualquier casilla del tablero apaga el resaltado de números iguales;
- al completar un tablero inválido se informa cuántas casillas son incorrectas, pero no cuáles;
- la pista revela la casilla editable seleccionada por el jugador;
- todos los niveles siguen abiertos desde el inicio;
- los niveles completados se reinician al reabrirse, permitiendo mejorar la marca de estrellas;
- cada ruta entrega trofeos de bronce, plata y oro;
- el platino exige oro en las seis rutas.

### Estrellas

- 3★: sin pistas;
- 2★: una pista;
- 1★: dos o más pistas.

Las estrellas históricas determinan trofeos. Las estrellas disponibles se pueden gastar en pistas.

## Matemática

En coordenadas de pantalla `(row, col)`, una ruta de pendiente `m` cumple

`row = m·col + b (mod 7)`.

Cada valor `m ∈ {1,2,3,4,5,6}` define una clase paralela distinta del plano afín `AG(2,7)`.

## Pruebas

```bash
npm test
```

Las pruebas verifican:

- las seis geometrías;
- 21 unidades, 3 pertenencias y 18 pares por celda en cada ruta;
- validez de todas las soluciones;
- unicidad de los 48 puzzles.
