# TalentoSEK

App de los partidos de fútbol de los lunes: convocatoria, resultados, goles y asistencias, pagos y clasificación.

Ahora mismo es un **prototipo**: funciona con datos de prueba inventados que se reinician al recargar. El siguiente paso es conectarla a la base de datos para que guarde de verdad.

## Cómo está hecha

- `src/app.js` y `src/app.css`: la app.
- `src/mock.js`: datos en memoria para el prototipo. La versión real lo sustituye por la conexión con la base de datos; los permisos que aplica son los mismos que tendrán las reglas de seguridad.
- `src/seed-demo.js`: jugadores y partidos inventados.
- `build.py`: junta todo en `index.html`, que es lo que se publica.

Para regenerar la página después de un cambio:

```
python3 build.py
```
