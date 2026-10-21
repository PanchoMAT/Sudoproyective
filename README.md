# SudoProyectivo

**Versión estable 1.0 · 21 de octubre de 2026**

Puzzle matemático independiente inspirado en geometría afín y proyectiva finita.

© 2026 Francisco Alegría M. · **Todos los derechos reservados.**

## Autoría e identidad

SudoProyectivo es una creación dirigida por **Francisco Alegría M.** La autoría del proyecto comprende su concepción y dirección creativa, el diseño matemático del juego, las reglas, la progresión, la estructura de niveles, la narrativa de descubrimiento geométrico, los textos, la experiencia de usuario y el desarrollo iterativo de esta realización concreta.

La implementación de software fue desarrollada de manera iterativa con asistencia de herramientas de inteligencia artificial bajo dirección, selección, corrección y validación humana.

No se reclama exclusividad sobre ideas matemáticas abstractas, métodos, procedimientos ni resultados matemáticos. La protección de derechos se refiere a la realización concreta de SudoProyectivo: su software, textos, diseño, material visual, documentación, selección y organización original de contenidos y demás elementos protegibles.

Esta versión 1.0 constituye la **primera versión estable y formal de referencia** del proyecto. Las versiones posteriores podrán corregir errores, incorporar mejoras o ampliar funcionalidades sin alterar este hito histórico.

Consulta `LICENSE` para las condiciones de uso y `VERSION_1.0.md` para la ficha de referencia de esta versión.

## Juego principal

El tablero es `7 × 7` con símbolos `1,…,7`. Cada nivel exige no repetir números en:

- cada fila;
- cada columna;
- cada ruta de la dirección seleccionada.

La regla visible es: **fila, columna y ruta: sin repetir**.

La campaña utiliza las seis pendientes diagonales no redundantes de `AG(2,7)`:

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

En total hay `6 × 30 = 180` niveles.

## Estrellas y trofeos

Completar un nivel entrega:

- 3★ sin pistas;
- 2★ usando una pista;
- 1★ usando dos o más pistas.

Cada ruta tiene un máximo de 90★:

- 🥉 Bronce: 30★;
- 🥈 Plata: 60★;
- 🥇 Oro: 90★.

El platino exige oro en las seis rutas. El máximo global de campaña es `540★`.

## Proyectivo: desafío final

Después del selector de las seis rutas aparece **Proyectivo**, inicialmente bloqueado.

Se desbloquea al completar los 60 niveles Difíciles de la campaña. Al lograrlo, el juego muestra automáticamente **¡Desafío final desbloqueado!**.

Proyectivo contiene seis desafíos **Ultraexperto**, uno por pendiente `1,…,6`. Cada uno tiene 12 pistas iniciales, solución única, guardado automático, notas y deshacer/rehacer. No entrega ni consume estrellas.

## Revelación geométrica de cada Ultraexperto

Al completar una Ruta `N`:

1. se conserva momentáneamente el sudoku completo con sus números;
2. se unen las siete rutas construidas y se destaca que todas tienen pendiente `N`;
3. los números dejan de ser relevantes y son reemplazados visualmente por puntos;
4. las rectas se prolongan hacia un nuevo punto `P_N`.

La transición desplaza deliberadamente el foco desde el puzzle numérico hacia la estructura geométrica subyacente.

## Construcción final de PG(2,7)

Al completar los seis Ultraexpertos se habilita la construcción final.

El orden narrativo es:

1. Ruta 1;
2. Ruta 2;
3. Ruta 3;
4. Ruta 4;
5. Ruta 5;
6. Ruta 6;
7. Ruta 0, correspondiente a las filas horizontales;
8. Ruta ∞, correspondiente a las columnas verticales.

Las ocho familias aparecen en disposición circular. Cada una determina un punto del infinito. Al final se agrega una última recta que reúne los ocho puntos del infinito: la **recta del infinito**.

Así se obtiene `PG(2,7)`:

- 57 puntos;
- 57 rectas;
- 8 puntos en cada recta;
- 8 rectas por cada punto;
- dos puntos determinan exactamente una recta;
- dos rectas se encuentran en exactamente un punto.

Antes de la celebración final, el juego deja visible el mensaje central de que el jugador acaba de construir el plano proyectivo `PG(2,7)`.

## Celebración y Trofeo Proyectivo

La finalización de la construcción desbloquea una celebración visual con confeti y fuegos artificiales.

Después queda disponible la distinción:

**Trofeo Proyectivo · Creador de Planos Proyectivos**

La recompensa es independiente del sistema normal de estrellas y trofeos de campaña.

## Conexión con Spot It

Si los puntos de `PG(2,7)` se interpretan como símbolos y las rectas como cartas, se obtiene un diseño ideal de orden 7 con 57 símbolos, 57 cartas y 8 símbolos por carta. Dos cartas comparten exactamente un símbolo porque dos rectas proyectivas se cortan en exactamente un punto.

## Modo Revisión

La URL con `?review=1` activa un modo de auditoría aislado del progreso real. Permite, entre otras cosas:

- abrir cualquier nivel;
- completar temporalmente los 60 niveles Difíciles;
- probar el desbloqueo de Proyectivo;
- abrir y resolver Ultraexpertos;
- previsualizar las revelaciones geométricas;
- reproducir las ocho familias de rectas;
- lanzar la secuencia final completa;
- mostrar la celebración y la credencial.

## Audio

La versión 1.0 no incorpora narración hablada. Los textos y animaciones están preparados para que el audio pueda evaluarse más adelante.

## Pruebas

```bash
npm test
```

Las pruebas verifican las seis geometrías, los 180 niveles de campaña, los seis Ultraexpertos, la estructura matemática de `PG(2,7)` y los elementos principales de las visualizaciones proyectivas. GitHub Actions ejecuta estas pruebas con los cambios en `main`.

## Licencia

**SudoProyectivo no es software de código abierto.** La publicación del repositorio permite consultar el proyecto, pero no concede una licencia general para copiar, modificar, redistribuir o explotar su contenido.

Consulta el archivo `LICENSE` para el texto completo.
