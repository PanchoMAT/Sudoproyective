# SudoProyectivo — Versión 1.3.0

## Alcance

Se revisan las construcciones geométricas de **F₃ y F₅** para seguir la secuencia visual y la disposición circular aprobadas para **F₇**, y se incorpora **F₉** como cuarto mundo.

El código de F₇, los 180 sudokus originales y su clave de progreso histórica no se modifican.

## Construcciones proyectivas

- Cada Ultraexperto de F₃, F₅ y F₉ utiliza la progresión aprobada: sudoku con números, trazado gradual de las rutas, números que desaparecen, puntos afines, prolongaciones y punto de infinito P_m.
- La construcción final muestra las familias en disposición circular; aparecen por separado las p−1 pendientes, las horizontales y las verticales.
- **La última recta se dibuja al final como una curva cerrada** que pasa por los p+1 puntos del infinito, igual que en F₇. Es una representación esquemática de la incidencia de una sola recta proyectiva, no un arco euclidiano.
- El esquema final representa PG(2,p) con p²+p+1 puntos y rectas; se comprueba por tests combinatorios para p=3,5,9.

## Mundo F₉

F₉ = F₃[α] con α²=2, mediante la representación a+bα, a,b ∈ F₃. Los índices 0 a 8 codifican los pares de coeficientes y los símbolos visibles del tablero son del 1 al 9. **No se utiliza aritmética de Z/9Z.**

- Tablero de 9×9.
- 8 rutas jugables (pendientes no nulas).
- **9 sudokus por dificultad en cada ruta**: 27 por ruta, 216 niveles normales.
- 8 Ultraexpertos, uno por pendiente.
- Distinciones Bronce, Plata y Oro independientes por ruta; Platino independiente de F₉.
- El Súper Platino exige Platino de F₃, F₅, F₇ y F₉.
- Cuenta de PG(2,9): 91 puntos, 91 rectas, 10 puntos por recta, 10 direcciones.
- Los niveles F₉ tienen 46, 36 y 29 pistas iniciales según la dificultad; los Ultraexpertos tienen 25 pistas. Todos tienen solución única comprobada por búsqueda exhaustiva de hasta 2 soluciones.
- Las 216 soluciones normales se generan a partir de funciones no afines de F₉, sin la alineación accidental adicional detectada históricamente en F₇.

## Progreso y compatibilidad

F₉ se incorpora dentro del guardado `sudoproyectivo-fields-v1`, separado del guardado original F₇ `sudoproyective-v02`. La nueva entrada no borra ni reescribe los logros anteriores. El modo de revisión `?review=1&all=1` admite ahora los cuatro mundos sin tocar el progreso real.

## Validaciones

- Test de axiomas de F₉, inversión y distributividad.
- Verificación de soluciones y unicidad de los 216 niveles y 8 Ultraexpertos de F₉.
- Verificación de incidencias proyectivas y de las familias circulares para F₃, F₅ y F₉.
- Pruebas existentes de F₇, PWA y modo de revisión mantenidas.
