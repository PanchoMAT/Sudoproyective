# Sudoproyective — prototipo v0.1

Puzzle matemático independiente inspirado en la geometría afín finita.

## Mecánica visible

- Tablero de 7×7.
- Símbolos 1–7.
- No repetir en una fila.
- No repetir en una columna.
- No repetir en una ruta.
- Las rutas continúan por el borde opuesto del tablero.

## Estructura matemática

Las 49 celdas se identifican con `AG(2,7) = F_7^2`. La primera versión usa tres direcciones:

- filas;
- columnas;
- rutas `y = x + b (mod 7)`, para `b = 0,…,6`.

Cada grupo de siete celdas es una restricción `AllDifferent`. Hay 21 unidades en total y cada celda pertenece a exactamente tres de ellas. El motor está preparado para añadir nuevas familias de pendientes en versiones posteriores.

## Ejecutar

No hay proceso de compilación ni dependencias. Basta servir la carpeta por HTTP, por ejemplo:

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000`.

También puede publicarse directamente con GitHub Pages desde la rama principal.

## Incluido en v0.1

- interfaz adaptable a celular;
- selector fijo de números;
- notas/candidatos;
- detección opcional de errores;
- resaltado de fila, columna y ruta;
- indicación visual de salto por los bordes;
- tutorial interactivo básico;
- seis niveles introductorios con solución única;
- pistas;
- guardado automático con `localStorage`;
- marca de niveles completados;
- cronómetro y pantalla de victoria.

## Filosofía

La geometría avanzada es parte de la estructura del juego, no un requisito para jugarlo. La interfaz debe seguir siendo comprensible sin conocer cuerpos finitos, planos afines o geometría proyectiva.
