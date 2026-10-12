/* Datos inventados para probar la regla de titulares (partido del 26 de octubre). */
window.TS_SEED = {
  note: 'Prueba de la regla de titulares.',
  admin: 'u-ana',
  personas: [{ uid: 'u-ana', label: 'Ana, administradora' }, { uid: 'u-bea', label: 'Bea, jugó los dos lunes' }, { uid: 'u-carla', label: 'Carla, jugó solo uno' }, { uid: 'u-dani', label: 'Dani, de suplente el último' }],
  players: [['Ana', [], 'u-ana', 'med'], ['Bea', [], 'u-bea', 'def'], ['Carla', [], 'u-carla', 'del'], ['Dani', [], 'u-dani', 'ext'], ['Eli', [], null, 'por'], ['Fran', [], null, 'med']],
  matches: [
    { date: '2026-10-12', status: 'closed', sa: 1, sb: 0, a: [['Eli', 1], ['Bea', 0, 1], ['Carla']], b: [['Fran'], ['Dani']] },
    { date: '2026-10-19', status: 'closed', sa: 2, sb: 2, a: [['Eli', 1], ['Bea']], b: [['Fran'], ['Ana']], s: [['Dani'], ['Carla']] },
    { date: '2026-10-26', status: 'open', a: [], b: [] }
  ]
};
