# Sudoproyective

Puzzle matemático independiente inspirado en geometría afín y proyectiva finita.

## v0.7

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

En total hay `6 × 30 = 180` niveles, distintos y con solución única bajo la ruta correspondiente.

## Proyectivo: desafío final

Después del selector de las seis rutas aparece **Proyectivo**, bloqueado desde el comienzo. Al tocar el candado se explica que para abrirlo hay que completar los 60 niveles Difíciles: los niveles 21–30 de las seis rutas.

Al completar el último nivel Difícil pendiente, el juego muestra automáticamente **¡Desafío final desbloqueado!** y permite entrar directamente a Proyectivo.

Proyectivo contiene seis desafíos **Ultraexperto**, uno por pendiente `1,…,6`. Son puzzles fijos con 12 pistas iniciales, solución única, guardado automático, notas y deshacer/rehacer. No entregan estrellas ni consumen pistas.

Al resolver un Ultraexperto se revela lentamente la familia de siete rectas asociada. Las siete rectas se dibujan con colores distintos y se prolongan visualmente hasta su punto del infinito.

## Construcción final de PG(2,7)

Al completar los seis Ultraexpertos se habilita una animación final explicada con subtítulos.

La visualización muestra ocho mini-tableros en disposición circular:

- filas: `m = 0`;
- las seis rutas: `m = 1,…,6`;
- columnas: `m = ∞`.

Cada mini-tablero representa la misma colección de 49 puntos del plano afín, organizada según una de sus ocho direcciones. Las familias se construyen una por una; cada una aporta siete rectas y un punto del infinito.

Después de las ocho familias aparecen los ocho puntos del infinito. Una cuerda esquemática pasa por ellos para representar la única **recta del infinito**. La disposición circular es deliberadamente visual: la cuerda representa incidencia proyectiva, no una recta euclidiana del dibujo.

Así se obtiene `PG(2,7)`:

- 57 puntos;
- 57 rectas;
- 8 puntos en cada recta;
- 8 rectas por cada punto;
- dos puntos determinan una recta;
- dos rectas se encuentran en un punto.

La secuencia tarda aproximadamente medio minuto en reproducción automática y también ofrece **Siguiente etapa** y **Repetir animación**.

## Conexión con Spot It

Si los puntos de `PG(2,7)` se interpretan como símbolos y las rectas como cartas, se obtiene un diseño ideal de orden 7 con 57 símbolos, 57 cartas y 8 símbolos por carta. Dos cartas comparten exactamente un símbolo porque dos rectas proyectivas se cortan en exactamente un punto.

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

El trofeo de platino exige oro en las seis rutas. El máximo global de la campaña permanece en `180 × 3 = 540★`. Proyectivo no modifica ese total.

## Modo Revisión

La URL con `?review=1` activa un modo de auditoría aislado del progreso real. Permite:

- abrir cualquier nivel de campaña;
- simular `0/60`, `59/60` y `60/60` niveles Difíciles;
- probar el candado y la ventana automática de desbloqueo de Proyectivo;
- abrir o completar cualquiera de los seis Ultraexpertos;
- reproducir individualmente las ocho familias de rectas;
- inspeccionar la construcción circular por etapas;
- lanzar la secuencia final completa;
- mostrar la credencial oculta.

## Pruebas

```bash
npm test
```

Las pruebas verifican las seis geometrías, los 180 niveles de campaña, los seis Ultraexpertos y la estructura matemática de `PG(2,7)`.
