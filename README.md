# TalentoSEK

App de los partidos de fútbol de los lunes: convocatoria, resultados, goles y asistencias, pagos y clasificación.

## Estado

- `demo.html`: la app con datos de prueba inventados. No guarda nada; sirve para enseñarla.
- `index.html`: la app de verdad. Se conecta a Firebase cuando existe `firebase-config.json`; mientras no exista, es igual que la demo.

## Cómo está hecha

- `src/app.js` y `src/app.css`: la app.
- `src/firebase.js`: conexión con la base de datos (Firestore y entrada anónima de Firebase).
- `firestore.rules`: quién puede hacer qué. Se pegan en la consola de Firebase, en Firestore Database → Reglas.
- `src/mock.js` y `src/seed-demo.js`: datos en memoria e inventados para la demo. `mock.js` aplica los mismos permisos que las reglas.
- `build.py`: junta todo en `demo.html` e `index.html`, que es lo que se publica.
- `test/`: una base de datos simulada para probar `src/firebase.js` sin red. No comprueba las reglas.

Para regenerar las páginas después de un cambio:

```
python3 build.py
```

## Permisos

Cualquiera que abra la app puede leer. Cada móvil se asocia a un jugador la primera vez y, desde entonces, solo puede apuntarse o borrarse a sí mismo y a sus invitados, declarar sus goles y asistencias y marcar su pago. Abrir y cerrar partidos, el marcador, quién cobra y la gestión de jugadores quedan para los administradores. El primero que configura la app se nombra administrador; después, los administradores nombran a los demás.
