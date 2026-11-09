# SudoProyectivo — versión 1.2.0

## Nuevos mundos

Se introduce una pantalla de selección del cuerpo basal:

| Cuerpo | Tablero | Pendientes jugables | Niveles por dificultad y pendiente | Campaña | Ultraexpertos |
|---|---|---|---|---|---|
| F3 | 3×3 | 1 y 2 | 5 | 30 | 2 |
| F5 | 5×5 | 1, 2, 3 y 4 | 7 | 84 | 4 |
| F7 | 7×7 | 1, 2, 3, 4, 5 y 6 | 10 | 180 | 6 |

Las tres restricciones son idénticas en todos los cuerpos: filas, columnas y rutas, sin repetir. En el cuerpo Fp, las rutas están determinadas por r − m·c ≡ b (mod p). Cada una de las seis nuevas rutas/campañas pequeñas conserva la división Fácil, Intermedio y Difícil.

Los 114 puzzles nuevos y los seis Ultraexpertos nuevos están precalculados y versionados, tienen **solución única** y se validan automáticamente por enumeración de soluciones y verificación geométrica. La campaña original de F7 no se modifica.

## Avance y logros por mundo

Cada ruta posee Bronce, Plata y Oro, obtenidos al llegar a 1, 2 y 3 estrellas por nivel de esa ruta, respectivamente. Cada cuerpo obtiene su **Platino propio** cuando todas sus rutas alcanzan el Oro:

- F3: 90 estrellas históricas máximas, 2 rutas;
- F5: 252 estrellas históricas máximas, 4 rutas;
- F7: 540 estrellas históricas máximas, 6 rutas (sistema anterior intacto).

**Superplatino**: solo aparece cuando los tres mundos alcanzan simultáneamente su propio Platino. Se calcula desde las marcas históricas y se actualiza automáticamente al cambiar de mundo.

El saldo para comprar pistas, los niveles en curso, las estrellas y los desafíos Ultraexpertos son independientes en F3 y F5. F7 conserva su clave original. Reiniciar el progreso en un mundo pequeño solo modifica ese mundo.

## Desafíos Proyectivo

Una vez terminados todos los niveles difíciles del mundo, se desbloquean un Ultraexperto por pendiente (dos en F3, cuatro en F5). Los Ultraexpertos no entregan ni consumen estrellas. Al completar cada uno aparece su familia de rectas y su punto del infinito. La construcción final añade filas y columnas, después la recta del infinito, mostrando PG(2,3) con 13 puntos y 13 rectas o PG(2,5) con 31 puntos y 31 rectas. Los desafíos antiguos y la experiencia PG(2,7) se conservan.

## Compatibilidad y protección del progreso

- F7 conserva el almacenamiento `sudoproyective-v02` y sus 180 IDs de nivel.
- F3/F5 usan una nueva clave independiente `sudoproyectivo-fields-v1`.
- Los perfiles permanecen en `sudoproyectivo-profile-v1`.
- El modo de revisión con `?review=1&all=1` habilita los tres mundos dentro de una copia aislada; no sobrescribe el progreso real.
- Se mantiene la aplicación PWA y se incrementa su caché a `sudoproyectivo-1.2.0`.

## Alcance

El paso a F11 y F13 no forma parte de este lanzamiento. Su implementación requerirá adaptar especialmente la interfaz a tableros de 121 y 169 casillas.
