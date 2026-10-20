# Sudoproyective

Prototipo de puzzle matemático independiente inspirado en geometría afín finita.

## v0.3.1

La versión actual usa un tablero `7 × 7` con símbolos `1,…,7` y tres tipos de unidades `AllDifferent` en cada nivel:

- 7 filas;
- 7 columnas;
- 7 rutas de una familia de rectas paralelas.

La interfaz no exige conocimientos matemáticos: la regla jugable sigue siendo simplemente **fila, columna y ruta: sin repetir**.

### Dos mundos geométricos

La v0.3 introduce niveles cuya familia de rutas depende del propio nivel.

**Mundo 1 — Dirección 1**

Las rutas cumplen

`row = col + b (mod 7)`.

Contiene los 18 niveles originales, separados en Iniciación, Intermedio y Avanzado.

**Mundo 2 — Dirección 2**

Las rutas cumplen

`row = 2·col + b (mod 7)`.

Contiene 6 niveles nuevos, separados en Exploración, Dominio y Desafío. Al avanzar una columna, la ruta avanza dos filas y continúa por el borde opuesto cuando corresponde.

Todos los 24 niveles incluidos tienen solución única bajo la familia de rutas que les corresponde.

### Acceso y progresión

Todos los niveles están desbloqueados desde el inicio. El jugador puede entrar directamente a cualquier puzzle de cualquier mundo.

Las estrellas ya no sirven para abrir niveles: representan el grado de maestría conseguido en cada puzzle y en cada mundo.

Cada nivel entrega:

- 3 estrellas: completar sin pistas;
- 2 estrellas: completar usando una pista;
- 1 estrella: completar usando dos o más pistas.

Se mantienen dos cantidades distintas:

- **estrellas totales:** suma de las mejores marcas históricas y base del sistema de trofeos;
- **estrellas disponibles:** saldo que puede gastarse en pistas. Cada pista cuesta 1 estrella disponible.

Gastar estrellas disponibles no reduce el total histórico ni hace perder trofeos. Repetir un nivel sólo entrega la diferencia si se mejora la mejor marca.

### Trofeos por mundo

Cada mundo tiene tres rangos de maestría:

**Mundo 1 — 18 niveles, máximo 54★**

- 🥉 Bronce: 18★.
- 🥈 Plata: 36★.
- 🥇 Oro: 54★.

**Mundo 2 — 6 niveles, máximo 18★**

- 🥉 Bronce: 6★.
- 🥈 Plata: 12★.
- 🥇 Oro: 18★.

Los umbrales equivalen de forma natural a un promedio de 1, 2 y 3 estrellas por nivel respectivamente.

**🏆 Trofeo de Platino**

Se obtiene únicamente al conseguir el trofeo de oro en todos los mundos disponibles.

### Interfaz

- navegación por pestañas: Niveles, Tutorial, Reglas y Trofeos;
- tutorial opcional y separado del progreso;
- todos los niveles accesibles desde el inicio;
- rutas visibles/ocultas a voluntad en niveles normales;
- explicación breve al descubrir una nueva dirección;
- notas/candidatos;
- sin corrección inmediata desde el nivel 2;
- validación sólo al completar el tablero;
- selector numérico fijo para celular;
- resaltado opcional de todos los valores iguales desde el selector;
- deshacer y rehacer movimientos;
- guardado local automático;
- cronómetro y pantalla de victoria.

## Matemática

Internamente el tablero se identifica con `AG(2,7) = F_7²`. En coordenadas de pantalla `(row, col)`, una familia de rutas de pendiente `m` cumple

`row = m·col + b (mod 7)`.

La v0.3 usa `m = 1` y `m = 2` en mundos separados. El motor ya admite una lista de pendientes por nivel, de modo que una futura versión puede imponer simultáneamente varias familias de rutas sin rehacer la arquitectura.

## Pruebas

```bash
npm test
```

Las pruebas verifican:

- 21 unidades para cada mundo de una sola dirección;
- 3 unidades y 18 pares incompatibles por celda con una dirección;
- la geometría de pendientes 1 y 2;
- una configuración futura con pendientes 1 y 2 simultáneas: 28 unidades, 4 pertenencias y 24 pares por celda;
- validez de todas las soluciones;
- unicidad de los 24 puzzles;
- ids y numeración únicos para todos los niveles.
