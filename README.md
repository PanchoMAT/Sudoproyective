# Sudoproyective

Prototipo de puzzle matemático independiente inspirado en geometría afín finita.

## v0.2

La versión actual usa un tablero `7 × 7` con símbolos `1,…,7` y tres tipos de unidades `AllDifferent`:

- 7 filas;
- 7 columnas;
- 7 rutas de la familia `y = x + b (mod 7)`.

La interfaz no exige conocimientos matemáticos: la regla jugable es simplemente **fila, columna y ruta: sin repetir**.

### Progresión

La v0.2 contiene 18 niveles separados en tres grupos:

1. **Iniciación** — alta densidad de pistas y deducciones directas.
2. **Intermedio** — menos pistas y mayor necesidad de cruzar información entre unidades.
3. **Avanzado** — puzzles más vacíos con más deducciones de posición única dentro de una unidad.

Todos los niveles incluidos tienen solución única.

### Estrellas, pistas y desbloqueos

Cada nivel entrega de 1 a 3 estrellas según la calidad de la resolución:

- 3 estrellas: sin pistas y como máximo 1 error;
- 2 estrellas: como máximo 1 pista y 3 errores;
- 1 estrella: nivel completado.

Se mantienen dos cantidades distintas:

- **estrellas totales:** suma de las mejores marcas históricas; nunca disminuye y sirve para desbloquear niveles;
- **estrellas disponibles:** saldo que puede gastarse en pistas. Cada pista cuesta 1 estrella disponible.

Repetir un nivel sólo entrega la diferencia si se mejora la mejor marca, evitando obtener estrellas infinitas del mismo puzzle.

### Trofeos provisionales

- Brújula de Bronce — completar nivel 6.
- Cartógrafo de Plata — completar nivel 12.
- Geómetra de Oro — completar nivel 18.
- Horizonte Perfecto — conseguir las 54 estrellas.

### Interfaz

- navegación por pestañas: Niveles, Tutorial, Reglas y Trofeos;
- tutorial opcional y separado del progreso;
- rutas visibles/ocultas a voluntad en niveles normales;
- notas/candidatos;
- errores opcionales;
- selector numérico fijo para celular;
- guardado local automático;
- cronómetro y pantalla de victoria.

## Matemática

Internamente el tablero se identifica con `AG(2,7) = F_7²`. En coordenadas de pantalla `(row, col)`, las rutas de la primera versión cumplen

`row = col + b (mod 7)`.

El motor está diseñado para admitir más familias `row = m·col + b (mod 7)` en versiones futuras sin cambiar la arquitectura básica.

## Pruebas

```bash
npm test
```

Las pruebas verifican:

- 21 unidades en la configuración actual;
- 3 unidades por celda;
- 18 pares incompatibles por celda;
- validez de todas las soluciones;
- unicidad de los 18 puzzles;
- coherencia de los umbrales de desbloqueo.
