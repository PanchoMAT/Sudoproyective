# SudoProyectivo v1.1.1

## Recompensa por recorrido perfecto

Esta versión añade una recompensa de consulta para los niveles normales completados con 3 estrellas.

Cuando un nivel tiene una mejor marca de **★★★**, al volver a entrar aparece la opción **Ver solución**.

La solución:

- se muestra en modo sólo lectura;
- no modifica el nuevo intento del jugador;
- no consume pistas ni estrellas;
- no modifica el cronómetro ni el progreso;
- distingue visualmente las pistas originales de las casillas que debían resolverse.

Los niveles con 0, 1 o 2 estrellas no muestran esta opción.

La funcionalidad usa la mejor marca histórica ya almacenada en `bestStars`, por lo que no requiere cambiar la estructura de guardado existente.
