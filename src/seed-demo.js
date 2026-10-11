/* Datos de prueba con nombres inventados, para enseñar la app sin datos de nadie. */
window.TS_SEED = {
  note: 'Los jugadores y los resultados son inventados.',
  admin: 'u-admin',
  tags: { 'Omar': '⭐' },
  captains: ['Willy', 'Leo', 'Manu', 'Omar'],
  poll: { q: '¿Quién llega siempre tarde?', options: ['Bruno', 'Manu', 'Toni', 'Willy'] },
  personas: [
    { uid: 'u-admin', label: 'Leo, administrador' },
    { uid: 'u-jugador', label: 'Nico, jugador' },
    { uid: 'u-nuevo', label: 'Un móvil que entra por primera vez' }
  ],
  players: [['Leo', [], 'u-admin', 'med'], ['Nico', [], 'u-jugador', 'def'], ['Bruno', [], null, 'por'], ['Dario', [], null, 'med'], ['Edu', [], null, 'med'], ['Fer', [], null, 'ext'], ['Guille', [], null, 'del'], ['Hugo', [], null, 'def'], ['Iker', [], null, 'med'], ['Joel', [], null, 'ext'], ['Kike', [], null, 'por'], ['Manu', [], null, 'del'], ['Omar', [], null, 'por'], ['Pol', [], null, 'def'], ['Quique', [], null, 'def'], ['Raúl', [], null, 'med'], ['Samu', [], null, 'med'], ['Toni', [], null, 'ext'], ['Unai', [], null, 'del'], ['Víctor', [], null, 'def'], ['Willy', [], null, 'med'], ['Xavi', [], null, 'ext'], ['Yago', [], null, 'por']],
  matches: [
    { date: '2026-10-05', status: 'closed', sa: 3, sb: 4, cob: 'Willy',
      a: [['Bruno', 1], ['Leo', 0, 1, 1, 1], ['Nico', 0, 1, 0, 1], ['Dario', 0, 1, 0, 1], ['Edu', 0, 0, 1, 1], ['Fer', 0, 0, 1, 1], ['Guille', 0], ['Hugo', 0, 0, 0, 1], ['Iker', 0, 0, 0, 1], ['Joel', 0], ['Willy', 0]],
      b: [['Kike', 1], ['Manu', 0, 2, 0, 1], ['Omar', 0, 1, 1, 1], ['Pol', 0, 1, 0, 1], ['Quique', 0, 0, 2, 1], ['Raúl', 0, 0, 1, 1], ['Samu', 0, 0, 0, 1], ['Toni', 0, 0, 0, 1], ['Unai', 0], ['Víctor', 0, 0, 0, 1], ['Xavi', 0, 0, 0, 1]] },
    { date: '2026-10-12', status: 'open',
      a: [['Leo'], ['Nico'], ['Dario'], ['Edu'], ['Fer'], ['Guille'], ['Hugo'], ['Iker'], ['Joel'], ['Willy']],
      b: [['Kike', 1], ['Manu'], ['Omar'], ['Pol'], ['Quique'], ['Raúl'], ['Samu'], ['Toni'], ['Unai'], ['Víctor']] }
  ]
};
