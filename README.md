# Sudoproyective

Puzzle matemático independiente inspirado en geometría afín y proyectiva finita.

## v0.6

El tablero es `7 × 7` con símbolos `1,…,7`. Cada nivel de campaña exige no repetir números en 7 filas, 7 columnas y 7 rutas de una familia de rectas paralelas.

La regla visible sigue siendo: **fila, columna y ruta: sin repetir**.

## Campaña principal

La campaña usa las seis pendientes diagonales no redundantes de `AG(2,7)`:

- Ruta 1 → `m = 1`;
- Ruta 2 → `m = 2`;
- Ruta 3 → `m = 3`;
- Ruta 4 → `m = 4`;
- Ruta 5 → `m = 5`;
- Ruta 6 → `m = 6`.

La pendiente `0` coincide con las filas y la dirección vertical con las columnas.

Cada ruta contiene 30 puzzles fijos:

- niveles 1–10: **Fácil**;
- niveles 11–20: **Intermedio**;
- niveles 21–30: **Difícil**.

En total hay `6 × 30 = 180` niveles. Los 180 puzzles son distintos y tienen solución única bajo la ruta correspondiente.

### Pistas

- Fácil: **2★**;
- Intermedio: **3★**;
- Difícil: **4★**.

La puntuación del nivel sigue siendo 3★ sin pistas, 2★ con una pista y 1★ con dos o más.

## Proyecto final: geometría oculta

La quinta pestaña, **Proyecto**, existe desde el inicio pero permanece bloqueada. Se desbloquea al completar los 60 niveles Difíciles: los niveles 21–30 de las seis rutas.

El Proyecto contiene seis desafíos **Ultraexperto**, uno por pendiente. Son puzzles fijos, distintos de la campaña, con 12 pistas iniciales, solución única, guardado automático, notas y deshacer/rehacer. No entregan estrellas ni consumen pistas: forman una fase final independiente del sistema de trofeos.

Al resolver un Ultraexperto se revela visualmente la familia de siete rectas asociada a esa pendiente.

Después de completar los seis desafíos se habilita la construcción final:

1. las seis familias diagonales aportan `6 × 7 = 42` rectas;
2. las 7 filas corresponden a la dirección `m = 0`;
3. las 7 columnas corresponden a la dirección `m = ∞`;
4. en total aparecen las `8 × 7 = 56` rectas de `AG(2,7)`;
5. se añade un punto del infinito por cada una de las ocho direcciones;
6. los ocho puntos nuevos forman la recta del infinito.

Así se obtiene `PG(2,7)`:

- 57 puntos;
- 57 rectas;
- 8 puntos en cada recta;
- 8 rectas por cada punto;
- dos puntos determinan una recta;
- dos rectas se encuentran en un punto.

La secuencia utiliza animaciones SVG/CSS para revelar progresivamente familias, puntos del infinito y recta del infinito.

## Conexión con Spot It

La construcción final muestra también la relación combinatoria con un Spot It/Dobble ideal de orden 7: si los puntos son símbolos y las rectas son cartas, se obtienen 57 símbolos y 57 cartas con 8 símbolos por carta; cada par de cartas comparte exactamente un símbolo.

## Distinción oculta

La pestaña de trofeos muestra desde el inicio una **Recompensa oculta**, separada de los trofeos normales y del platino.

Al completar la construcción de `PG(2,7)` se desbloquea la credencial:

**Trofeo Proyectivo · Creador de Planos Proyectivos**

con la felicitación especial de la comunidad matemática.

## Trofeos de campaña

Cada ruta contiene 30 niveles y un máximo de 90★:

- 🥉 Bronce: 30★;
- 🥈 Plata: 60★;
- 🥇 Oro: 90★.

El trofeo de platino exige oro en las seis rutas. El máximo global de la campaña permanece en `180 × 3 = 540★`. El Proyecto final no modifica ese total.

## Pruebas

```bash
npm test
```

Las pruebas verifican las seis geometrías, los 180 niveles de campaña y los seis Ultraexpertos, incluyendo validez de soluciones, consistencia de pistas y unicidad.
