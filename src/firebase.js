/* Conexión con Firebase (Firestore + entrada anónima). Ofrece exactamente las mismas operaciones que mock.js;
   quién puede hacer qué lo deciden las reglas de firestore.rules, no este archivo. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, writeBatch, setDoc, updateDoc, deleteDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

window.createBackend = function () {
  const app = initializeApp(window.TS_FIREBASE), auth = getAuth(app), db = getFirestore(app);
  const st = { uid: null, players: null, admins: null, matches: null, claimed: null, poll: null, captains: [], entries: {} };
  const subs = {};                 // partido -> función para dejar de escuchar sus apuntados
  let cb = null, error = null, booted = false, started = false;

  function denied(msg) { return Object.assign(new Error(msg || 'No tienes permiso para hacer eso.'), { code: 'denied' }); }
  function guard(p) { return p.catch(function (e) { throw e && e.code === 'permission-denied' ? denied() : e; }); }
  function isAdmin() { return !!(st.admins && st.admins[st.uid]); }
  function myPid() {
    const mine = Object.values(st.players || {}).find(function (p) { return p.uid === st.uid; });
    return mine ? mine.id : null;
  }
  // Se escuchan los apuntados de los partidos sin cerrar y de los cerrados con pagos pendientes (como mucho los 6 últimos).
  function wanted() {
    const ms = Object.values(st.matches || {}).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return ms.filter(function (m, i) { return m.status !== 'closed' || (!m.settled && i < 6); }).map(function (m) { return m.id; });
  }
  function emit() {
    if (!cb) return;
    const me = { uid: st.uid, pid: null, isAdmin: false, canBootstrap: false };
    if (error) { cb({ error: error, me: me, players: [], admins: {}, matches: [], entries: {} }); return; }
    if (!booted) {
      booted = !!(st.uid && st.players && st.admins && st.matches && st.claimed !== null) && wanted().every(function (mid) { return !!st.entries[mid]; });
      if (!booted) { cb({ loading: true, me: me, players: [], admins: {}, matches: [], entries: {} }); return; }
    }
    me.pid = myPid(); me.isAdmin = isAdmin(); me.canBootstrap = st.claimed === false;
    cb({ me: me, players: Object.values(st.players), admins: st.admins, matches: Object.values(st.matches), entries: st.entries, poll: st.poll, captains: st.captains });
  }
  function fail(e) {
    console.error('TalentoSEK', e);
    const code = (e && e.code) || '';
    error = code.indexOf('operation-not-allowed') >= 0 || code.indexOf('admin-restricted') >= 0 ? 'La entrada sin contraseña no está activada en Firebase (Authentication, método Anónimo).'
      : code === 'permission-denied' ? 'La base de datos no deja leer: faltan por publicar las reglas de acceso.'
      : code.indexOf('unauthorized-domain') >= 0 ? 'Esta dirección web no está autorizada en Firebase (Authentication, dominios autorizados).'
      : 'No se ha podido conectar con la base de datos. Comprueba la conexión y recarga la página.';
    emit();
  }
  function syncEntries() {
    const want = wanted();
    Object.keys(subs).forEach(function (mid) { if (want.indexOf(mid) < 0) { subs[mid](); delete subs[mid]; delete st.entries[mid]; } });
    want.forEach(function (mid) {
      if (subs[mid]) return;
      subs[mid] = onSnapshot(collection(db, 'matches', mid, 'entries'), function (snap) {
        const o = {};
        snap.forEach(function (d) { o[d.id] = d.data(); });
        st.entries[mid] = o; emit();
      }, fail);
    });
  }
  function listen() {
    if (started) return;
    started = true;
    const all = function (name, key) {
      onSnapshot(collection(db, name), function (snap) {
        const o = {};
        snap.forEach(function (d) { o[d.id] = key ? Object.assign({ id: d.id }, d.data()) : true; });
        st[name] = o;
        if (name === 'matches') syncEntries();
        emit();
      }, fail);
    };
    all('players', true); all('matches', true); all('admins', false);
    onSnapshot(doc(db, 'meta', 'claimed'), function (d) { st.claimed = d.exists(); emit(); }, fail);
    // Encuesta y capitanes son opcionales: si no se pueden leer, la app sigue funcionando sin ellos.
    onSnapshot(doc(db, 'meta', 'captains'), function (d) { st.captains = (d.exists() && d.data().order) || []; emit(); }, function () { st.captains = []; });
    onSnapshot(doc(db, 'meta', 'poll'), function (d) { st.poll = d.exists() ? d.data() : null; emit(); }, function () { st.poll = null; });
  }
  onAuthStateChanged(auth, function (user) {
    if (!user) { signInAnonymously(auth).catch(fail); return; }
    st.uid = user.uid; listen(); emit();
  }, fail);

  return {
    watch: function (fn) { cb = fn; emit(); },

    // El primero que configura la app se hace administrador; después la puerta queda cerrada (meta/claimed).
    bootstrapAdmin: function () {
      const b = writeBatch(db);
      b.set(doc(db, 'admins', st.uid), { at: Date.now() });
      b.set(doc(db, 'meta', 'claimed'), { by: st.uid, at: Date.now() });
      return guard(b.commit());
    },
    claimPlayer: function (pid) {
      const p = st.players[pid];
      if (!p) return Promise.reject(denied('Ese jugador ya no existe.'));
      if (myPid()) return Promise.reject(denied('Este móvil ya está asociado a un jugador.'));
      if (p.uid) return Promise.reject(denied('Ese nombre ya lo ha cogido otro móvil. Pide a un administrador que lo libere.'));
      const b = writeBatch(db);
      b.update(doc(db, 'players', pid), { uid: st.uid });
      b.set(doc(db, 'users', st.uid), { pid: pid });
      return guard(b.commit());
    },
    createPlayer: function (data) {
      const name = String(data.name || '').trim().slice(0, 30);
      if (!name) return Promise.reject(denied('Escribe un nombre.'));
      const ref = doc(collection(db, 'players')), b = writeBatch(db);
      const self = !data.guestOf && (data.self || !isAdmin());
      if (self && myPid()) return Promise.reject(denied('Este móvil ya está asociado a un jugador.'));
      b.set(ref, { name: name, aka: [], uid: self ? st.uid : null, guestOf: data.guestOf || null });
      if (self) b.set(doc(db, 'users', st.uid), { pid: ref.id });
      return guard(b.commit()).then(function () { return ref.id; });
    },
    releasePlayer: function (pid) {
      const p = st.players[pid];
      if (!p) return Promise.resolve();
      const b = writeBatch(db);
      b.update(doc(db, 'players', pid), { uid: null });
      if (p.uid) b.delete(doc(db, 'users', p.uid));
      return guard(b.commit());
    },
    updatePlayer: function (pid, patch) {
      const out = {};
      if (patch.name !== undefined) out.name = String(patch.name).trim().slice(0, 30);
      if (patch.aka) out.aka = patch.aka;
      if (patch.tag !== undefined) out.tag = patch.tag || null;
      return guard(updateDoc(doc(db, 'players', pid), out));
    },
    setProfile: function (pid, patch) {
      const out = {};
      if ('pos' in patch) out.pos = patch.pos || null;
      if ('poll' in patch) out.poll = patch.poll || null;
      return guard(updateDoc(doc(db, 'players', pid), out));
    },
    setCaptains: function (order) { return guard(setDoc(doc(db, 'meta', 'captains'), { order: order })); },
    setPoll: function (data) { return guard(setDoc(doc(db, 'meta', 'poll'), { q: data.q, options: data.options, active: !!data.active })); },
    deletePlayer: function (pid) {
      const p = st.players[pid];
      if (!p) return Promise.resolve();
      if (Object.values(st.matches).some(function (m) { return m.final && m.final[pid]; })) return Promise.reject(denied('Tiene partidos cerrados; se puede renombrar, pero no borrar.'));
      const b = writeBatch(db);
      Object.keys(st.entries).forEach(function (mid) { if (st.entries[mid][pid]) b.delete(doc(db, 'matches', mid, 'entries', pid)); });
      if (p.uid) b.delete(doc(db, 'users', p.uid));
      b.delete(doc(db, 'players', pid));
      return guard(b.commit());
    },
    setAdmin: function (pid, on) {
      const p = st.players[pid];
      if (!p || !p.uid) return Promise.reject(denied('Primero tiene que entrar en la app y elegir su nombre.'));
      if (!on && p.uid === st.uid) return Promise.reject(denied('No puedes quitarte a ti mismo de administrador.'));
      return guard(on ? setDoc(doc(db, 'admins', p.uid), { by: st.uid, at: Date.now() }) : deleteDoc(doc(db, 'admins', p.uid)));
    },
    createMatch: function (data) {
      const id = 'm' + String(data.date).replace(/-/g, '') + Math.random().toString(36).slice(2, 7);
      return guard(setDoc(doc(db, 'matches', id), { date: data.date, time: data.time || '20:30', status: 'open', sa: 0, sb: 0, cob: null, final: null, settled: false, drawAt: data.drawAt || null, drawn: false })).then(function () { return id; });
    },
    updateMatch: function (mid, patch) { return guard(updateDoc(doc(db, 'matches', mid), patch)); },
    drawCollector: function (mid, pid) { return guard(updateDoc(doc(db, 'matches', mid), { cob: pid, drawn: true })); },
    deleteMatch: function (mid) {
      return guard(getDocs(collection(db, 'matches', mid, 'entries')).then(function (snap) {
        const b = writeBatch(db);
        snap.forEach(function (d) { b.delete(d.ref); });
        b.delete(doc(db, 'matches', mid));
        return b.commit();
      }));
    },
    setEntry: function (mid, pid, data) {
      return guard(setDoc(doc(db, 'matches', mid, 'entries', pid), { t: data.t, gk: !!data.gk, at: data.at || Date.now(), g: 0, a: 0, og: 0, paid: false }));
    },
    updateEntry: function (mid, pid, patch) { return guard(updateDoc(doc(db, 'matches', mid, 'entries', pid), patch)); },
    deleteEntry: function (mid, pid) { return guard(deleteDoc(doc(db, 'matches', mid, 'entries', pid))); }
  };
};
