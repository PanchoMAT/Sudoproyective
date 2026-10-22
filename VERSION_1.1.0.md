# SudoProyectivo v1.1.0 — Auditoría de la campaña

**Fecha:** 21 de octubre de 2026  
**Autor y dirección:** Francisco Alegría M.

## Motivo de esta versión

Durante la revisión de las soluciones de la campaña se detectó una regularidad no declarada: en las 180 soluciones de la versión anterior, las siete apariciones de cada símbolo `1,…,7` formaban una recta afín completa, y las siete rectas obtenidas eran paralelas entre sí.

Esta propiedad no forma parte de las reglas de SudoProyectivo y podía ser utilizada como una pista adicional no intencionada.

## Conclusión matemática de la auditoría

La regularidad **no es necesaria**.

Para una ruta de pendiente `m`, las reglas reales sólo exigen que los símbolos `1,…,7` no se repitan en:

- filas;
- columnas;
- las siete rutas `y = mx + b (mod 7)` de la familia seleccionada.

Se construyeron soluciones válidas que satisfacen exactamente esas restricciones y en las que los conjuntos de posiciones de los símbolos no son rectas afines. Por tanto, la alineación detectada era una propiedad accidental de la familia de soluciones empleada originalmente, no una consecuencia de la geometría del juego.

## Corrección aplicada

La campaña de 180 niveles fue regenerada manteniendo:

- 6 rutas;
- 30 niveles por ruta;
- los mismos identificadores de nivel;
- las categorías Fácil, Intermedio y Difícil;
- solución única para cada puzzle;
- una densidad de pistas prácticamente igual a la campaña anterior.

Promedio de pistas iniciales en v1.1.0:

- Fácil: **26.0**;
- Intermedio: **18.5**;
- Difícil: **13.5**.

Como condición adicional de control de calidad, en ninguna de las 180 soluciones ningún símbolo individual `1,…,7` ocupa una recta afín completa del tablero.

## Prueba de regresión

Se añadió `tests/nonlinear-campaign.test.mjs`. La prueba recorre las 180 soluciones y los siete símbolos de cada una, y falla si las siete posiciones de cualquier símbolo forman una recta afín en cualquiera de las ocho direcciones del plano afín de orden 7.

Las pruebas anteriores de consistencia, unicidad y geometría permanecen activas.

## Migración del progreso

El cambio altera el contenido matemático de los puzzles pero conserva sus IDs. Para impedir que una partida parcialmente resuelta con la campaña anterior se mezcle con una solución nueva:

- se conservan estrellas obtenidas;
- se conservan niveles completados;
- se conservan trofeos, saldo y progreso Proyectivo;
- se conservan perfil y preferencias;
- únicamente se descartan los tableros normales que estuvieran a medio resolver.

La clave histórica `sudoproyective-v02` se mantiene para no perder el resto del progreso.

## Estado

SudoProyectivo **v1.1.0** pasa a ser la campaña auditada de referencia.
