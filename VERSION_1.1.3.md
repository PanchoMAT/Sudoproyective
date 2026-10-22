# SudoProyectivo v1.1.3

## Corrección del sistema de actualización PWA

Esta versión corrige el caso en que una aplicación ya instalada podía permanecer mostrando una versión anterior aunque GitHub Pages ya hubiera publicado archivos nuevos.

### Cambios

- el registro del service worker usa `updateViaCache: 'none'`;
- la aplicación ejecuta una comprobación explícita de actualizaciones al iniciarse;
- se escucha `controllerchange` y se recarga la interfaz cuando entra en control una versión nueva;
- la pestaña **Instalar** muestra la versión actual y un botón **Buscar actualización**;
- cuando existe una actualización en espera aparece una acción visible **Actualizar ahora**;
- se incorpora el mensaje `SKIP_WAITING` para activar una actualización elegida por el usuario;
- la transición desde versiones anteriores a 1.1.3 fuerza una única recarga de rescate solamente si se detecta una caché antigua de SudoProyectivo;
- una primera visita o instalación nueva no recibe esa recarga forzada.

La corrección no modifica el progreso del jugador ni las claves históricas de almacenamiento local.
