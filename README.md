# Sudoproyective

Puzzle matemático independiente inspirado en geometría afín y proyectiva finita.

## v0.8

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

## Revelación al completar cada Ultraexperto

La victoria ya no muestra sólo una familia abstracta de rectas. La animación parte del mismo sudoku recién resuelto:

1. se ve el tablero completo con sus 49 números;
2. se explica que en cada ruta los siete valores son distintos;
3. los números se desvanecen y quedan sólo las 49 posiciones como puntos;
4. aparecen lentamente las siete rectas de la pendiente correspondiente, cada una con color propio;
5. las siete rectas se prolongan hacia un nuevo punto del infinito, `P_N`.

La narración enfatiza que los números fueron el mecanismo del puzzle, pero la estructura geométrica subyacente depende de las posiciones y de la familia de rectas.

## Construcción final de PG(2,7)

Al completar los seis Ultraexpertos se habilita una animación final con subtítulos grandes y progresivos.

El orden narrativo es:

1. Ruta 1;
2. Ruta 2;
3. Ruta 3;
4. Ruta 4;
5. Ruta 5;
6. Ruta 6;
7. Ruta 0, correspondiente a las filas horizontales;
8. Ruta ∞, correspondiente a las columnas verticales.

Las ocho familias se muestran en disposición circular. Cada mini-tablero representa la misma colección de 49 puntos del plano afín, organizada según una dirección distinta. Después aparecen los ocho puntos del infinito y una cuerda esquemática representa la única **recta del infinito**.

La disposición circular es deliberadamente visual: la cuerda representa incidencia proyectiva, no una recta euclidiana del dibujo.

Así se obtiene `PG(2,7)`:

- 57 puntos;
- 57 rectas;
- 8 puntos en cada recta;
- 8 rectas por cada punto;
- dos puntos determinan una recta;
- dos rectas se encuentran en un punto.

La secuencia ofrece reproducción automática, **Siguiente etapa** y **Repetir animación**.

## Celebración y Trofeo Proyectivo

Al completarse la recta del infinito, la recompensa final se desbloquea automáticamente y aparece una celebración visual con confeti y fuegos artificiales.

Después de la celebración queda disponible el certificado:

**Trofeo Proyectivo · Creador de Planos Proyectivos**

con la felicitación especial de la comunidad matemática.

La recompensa sigue separada del sistema normal de trofeos y del platino.

## Conexión con Spot It

Si los puntos de `PG(2,7)` se interpretan como símbolos y las rectas como cartas, se obtiene un diseño ideal de orden 7 con 57 símbolos, 57 cartas y 8 símbolos por carta. Dos cartas comparten exactamente un símbolo porque dos rectas proyectivas se cortan en exactamente un punto.

## Trofeos de campaña

Cada ruta contiene 30 niveles y un máximo de 90★:

- 🥉 Bronce: 30★;
- 🥈 Plata: 60★;
- 🥇 Oro: 90★.

El trofeo de platino exige oro en las seis rutas. El máximo global de la campaña permanece en `180 × 3 = 540★`. Proyectivo no modifica ese total.

## Modo Revisión

La URL con `?review=1` activa un modo de auditoría aislado del progreso real. Permite:

- abrir cualquier nivel de campaña;
- completar temporalmente los 60 niveles Difíciles con un solo botón;
- probar el candado y la ventana automática de desbloqueo de Proyectivo;
- abrir o completar cualquiera de los seis Ultraexpertos;
- previsualizar directamente las seis nuevas transiciones sudoku → puntos → rectas → `P_N`;
- reproducir individualmente las ocho familias de rectas;
- inspeccionar la construcción circular por etapas;
- lanzar la secuencia final completa;
- mostrar directamente la celebración final;
- mostrar la credencial oculta.

## Audio

La v0.8 no incorpora narración hablada. Los subtítulos y animaciones están preparados para que una capa de audio opcional pueda evaluarse en una versión posterior.

## Pruebas

```bash
npm test
```

Las pruebas verifican las seis geometrías, los 180 niveles de campaña, los seis Ultraexpertos, la estructura matemática de `PG(2,7)` y los elementos estructurales de las nuevas visualizaciones proyectivas. El repositorio ejecuta estas pruebas automáticamente en GitHub Actions con cada cambio en `main`.
