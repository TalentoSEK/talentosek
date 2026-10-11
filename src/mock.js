/* Datos de prueba en memoria para el prototipo. La app real cambia este archivo por la conexión con la base de datos;
   los permisos de aquí son los mismos que tendrán las reglas de seguridad. */
window.createBackend = function () {
  'use strict';
  var db = { players: {}, users: {}, admins: {}, matches: {}, entries: {}, poll: null, captains: [] };
  var seq = 0, t0 = Date.now() - 3 * 86400000;
  function id(p) { seq++; return p + seq.toString(36) + Math.random().toString(36).slice(2, 6); }
  function add(name, aka, uid, pos) {
    var pid = id('p');
    db.players[pid] = { id: pid, name: name, aka: aka || [], uid: uid || null, guestOf: null, pos: pos || null };
    if (uid) db.users[uid] = pid;
    return pid;
  }
  // Los datos de prueba llegan aparte (window.TS_SEED) para que el código no lleve nombres dentro.
  var seed = window.TS_SEED || { players: [], admin: null, matches: [], personas: [] };
  var N = {};
  seed.players.forEach(function (r) { N[r[0]] = add(r[0], r[1], r[2], r[3]); });
  if (seed.admin) db.admins[seed.admin] = true;
  if (seed.captains) db.captains = seed.captains.map(function (n) { return N[n]; }).filter(Boolean);
  if (seed.poll) db.poll = { q: seed.poll.q, options: seed.poll.options, active: true };
  function entry(t, gk, i, g, a, og, paid) { return { t: t, gk: !!gk, at: t0 + i * 60000, g: g || 0, a: a || 0, og: og || 0, paid: !!paid }; }
  // cada jugador de un partido: [nombre, portero, goles, asistencias, pagado]
  seed.matches.forEach(function (sm, k) {
    var mid = 'm' + sm.date.replace(/-/g, ''), es = {}, fin = null, i = 0;
    ['a', 'b', 's'].forEach(function (t) {
      (sm[t] || []).forEach(function (r) { es[N[r[0]]] = entry(t, r[1], k * 1000 + (i++), r[2], r[3], 0, r[4]); });
    });
    if (sm.status === 'closed') {
      fin = {};
      Object.keys(es).forEach(function (pid, j) { var e = es[pid]; if (e.t !== 's') fin[pid] = { t: e.t, gk: e.gk, g: e.g, a: e.a, og: e.og, o: j }; });
    }
    db.matches[mid] = { id: mid, date: sm.date, time: '20:30', status: sm.status, sa: sm.sa || 0, sb: sm.sb || 0, cob: sm.cob ? N[sm.cob] : null, final: fin };
    db.entries[mid] = es;
  });

  var uid = seed.personas.length ? seed.personas[0].uid : 'u-0', watchers = [];
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function snap() {
    return clone({
      me: { uid: uid, pid: db.users[uid] || null, isAdmin: !!db.admins[uid] },
      players: Object.keys(db.players).map(function (k) { return db.players[k]; }),
      admins: db.admins,
      poll: db.poll,
      captains: db.captains,
      matches: Object.keys(db.matches).map(function (k) { return db.matches[k]; }),
      entries: db.entries
    });
  }
  function emit() { var s = snap(); watchers.forEach(function (w) { w(s); }); }
  function deny(msg) { var e = new Error(msg || 'No tienes permiso para hacer eso.'); e.code = 'denied'; throw e; }
  function admin() { return !!db.admins[uid]; }
  function mine() { return db.users[uid] || null; }
  function owns(pid) { var p = db.players[pid], me = mine(); return !!p && !!me && (pid === me || p.guestOf === me); }
  function only(patch, keys) { return Object.keys(patch).every(function (k) { return keys.indexOf(k) >= 0; }); }
  function op(fn) {
    return new Promise(function (ok, ko) {
      try { var r = fn(); emit(); ok(r); } catch (e) { ko(e); }
    });
  }

  return {
    mock: true,
    personas: seed.personas,
    note: seed.note || '',
    switchUser: function (u) { uid = u; emit(); },
    watch: function (cb) { watchers.push(cb); cb(snap()); },

    claimPlayer: function (pid) {
      return op(function () {
        var p = db.players[pid];
        if (!p) deny('Ese jugador ya no existe.');
        if (mine()) deny('Este móvil ya está asociado a un jugador.');
        if (p.uid) deny('Ese nombre ya lo ha cogido otro móvil. Pide a un administrador que lo libere.');
        p.uid = uid; db.users[uid] = pid;
      });
    },
    createPlayer: function (data) {
      return op(function () {
        var name = String(data.name || '').trim().slice(0, 30);
        if (!name) deny('Escribe un nombre.');
        var pid = id('p'), p = { id: pid, name: name, aka: [], uid: null, guestOf: null, pos: null };
        if (data.guestOf) {
          if (data.guestOf !== mine() && !admin()) deny();
          p.guestOf = data.guestOf;
        } else if (!admin() || data.self) {
          if (mine()) deny('Este móvil ya está asociado a un jugador.');
          p.uid = uid; db.users[uid] = pid;
        }
        db.players[pid] = p;
        return pid;
      });
    },
    releasePlayer: function (pid) {
      return op(function () {
        var p = db.players[pid];
        if (!p) return;
        if (!admin() && pid !== mine()) deny();
        if (p.uid) delete db.users[p.uid];
        p.uid = null;
      });
    },
    updatePlayer: function (pid, patch) {
      return op(function () {
        if (!admin()) deny();
        var p = db.players[pid];
        if (!p) deny('Ese jugador ya no existe.');
        if (patch.name !== undefined) p.name = String(patch.name).trim().slice(0, 30) || p.name;
        if (patch.aka) p.aka = patch.aka;
      });
    },
    // Lo que cada jugador puede cambiar de sí mismo: su posición y su respuesta a la encuesta.
    setProfile: function (pid, patch) {
      return op(function () {
        var p = db.players[pid];
        if (!p) deny('Ese jugador ya no existe.');
        if (!admin() && pid !== mine()) deny();
        if ('pos' in patch) p.pos = patch.pos || null;
        if ('poll' in patch) p.poll = patch.poll || null;
      });
    },
    setCaptains: function (order) {
      return op(function () {
        if (!admin()) deny();
        db.captains = order.slice();
      });
    },
    setPoll: function (data) {
      return op(function () {
        if (!admin()) deny();
        db.poll = { q: data.q, options: data.options, active: !!data.active };
      });
    },
    deletePlayer: function (pid) {
      return op(function () {
        var p = db.players[pid];
        if (!p) return;
        if (!admin() && !(p.guestOf && p.guestOf === mine())) deny();
        Object.keys(db.matches).forEach(function (mid) {
          var m = db.matches[mid];
          if (m.final && m.final[pid]) deny('Tiene partidos cerrados; se puede renombrar, pero no borrar.');
        });
        Object.keys(db.entries).forEach(function (mid) { delete db.entries[mid][pid]; });
        if (p.uid) delete db.users[p.uid];
        delete db.players[pid];
      });
    },
    setAdmin: function (pid, on) {
      return op(function () {
        if (!admin()) deny();
        var p = db.players[pid];
        if (!p || !p.uid) deny('Primero tiene que entrar en la app y elegir su nombre.');
        if (!on && p.uid === uid) deny('No puedes quitarte a ti mismo de administrador.');
        if (on) db.admins[p.uid] = true; else delete db.admins[p.uid];
      });
    },
    createMatch: function (data) {
      return op(function () {
        if (!admin()) deny();
        var mid = 'm' + String(data.date).replace(/-/g, '') + id('');
        db.matches[mid] = { id: mid, date: data.date, time: data.time || '20:30', status: 'open', sa: 0, sb: 0, cob: null, final: null };
        db.entries[mid] = {};
        return mid;
      });
    },
    updateMatch: function (mid, patch) {
      return op(function () {
        if (!admin()) deny();
        var m = db.matches[mid];
        if (!m) deny('Ese partido ya no existe.');
        Object.keys(patch).forEach(function (k) { m[k] = patch[k]; });
      });
    },
    deleteMatch: function (mid) {
      return op(function () {
        if (!admin()) deny();
        delete db.matches[mid]; delete db.entries[mid];
      });
    },
    setEntry: function (mid, pid, data) {
      return op(function () {
        var m = db.matches[mid];
        if (!m) deny('Ese partido ya no existe.');
        if (!admin() && !(owns(pid) && m.status === 'open')) deny(m.status === 'open' ? undefined : 'La convocatoria ya está cerrada.');
        db.entries[mid][pid] = { t: data.t, gk: !!data.gk, at: data.at || Date.now(), g: 0, a: 0, og: 0, paid: false };
      });
    },
    updateEntry: function (mid, pid, patch) {
      return op(function () {
        var m = db.matches[mid], e = m && db.entries[mid][pid];
        if (!e) deny('Ese jugador ya no está en el partido.');
        if (!admin()) {
          if (!owns(pid)) deny();
          var ok = m.status === 'open' ? only(patch, ['t', 'gk']) : m.status === 'review' ? only(patch, ['g', 'a', 'og', 'paid']) : only(patch, ['paid']);
          if (!ok) deny('Eso solo puede cambiarlo un administrador.');
        }
        Object.keys(patch).forEach(function (k) { e[k] = patch[k]; });
      });
    },
    deleteEntry: function (mid, pid) {
      return op(function () {
        var m = db.matches[mid];
        if (!m || !db.entries[mid][pid]) return;
        if (!admin() && !(owns(pid) && m.status === 'open')) deny();
        delete db.entries[mid][pid];
      });
    }
  };
};
