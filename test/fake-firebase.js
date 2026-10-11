// Firebase de mentira, en memoria, solo para probar src/firebase.js sin red. No comprueba permisos.
const store = (window.__store = window.__store || new Map());
const listeners = new Set();
let n = 0;
const rid = () => 'x' + (++n) + Math.random().toString(36).slice(2, 7);
const notify = () => setTimeout(() => listeners.forEach(l => l()), 0);
const docSnap = path => ({ id: path.split('/').pop(), ref: { type: 'doc', path, id: path.split('/').pop() }, exists: () => store.has(path), data: () => JSON.parse(JSON.stringify(store.get(path))) });
const colSnap = path => { const ds = [...store.keys()].filter(k => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/')).map(docSnap); return { forEach: f => ds.forEach(f), size: ds.length }; };
export function initializeApp() { return {}; }
export function getAuth() { return {}; }
export function onAuthStateChanged(a, cb) { a.cb = cb; setTimeout(() => cb(null), 0); }
export function signInAnonymously(a) { return new Promise(r => setTimeout(() => { a.cb({ uid: window.__uid || 'u-test' }); r(); }, 5)); }
export function getFirestore() { return {}; }
export function collection(db, ...segs) { return { type: 'col', path: segs.join('/') }; }
export function doc(a, ...segs) { const path = a && a.type === 'col' ? a.path + '/' + (segs[0] || rid()) : segs.join('/'); return { type: 'doc', path, id: path.split('/').pop() }; }
export function onSnapshot(ref, next) { const l = () => next(ref.type === 'col' ? colSnap(ref.path) : docSnap(ref.path)); listeners.add(l); setTimeout(l, 3); return () => listeners.delete(l); }
const apply = (op) => {
  if (op.k === 'set') store.set(op.ref.path, JSON.parse(JSON.stringify(op.data)));
  else if (op.k === 'update') { if (!store.has(op.ref.path)) throw Object.assign(new Error('not-found'), { code: 'not-found' }); store.set(op.ref.path, Object.assign({}, store.get(op.ref.path), JSON.parse(JSON.stringify(op.data)))); }
  else store.delete(op.ref.path);
};
const run = ops => new Promise((ok, ko) => { try { ops.forEach(apply); notify(); setTimeout(ok, 8); } catch (e) { ko(e); } });
export function setDoc(ref, data) { return run([{ k: 'set', ref, data }]); }
export function updateDoc(ref, data) { return run([{ k: 'update', ref, data }]); }
export function deleteDoc(ref) { return run([{ k: 'del', ref }]); }
export function getDocs(ref) { return Promise.resolve(colSnap(ref.path)); }
export function writeBatch() { const ops = []; const b = { set: (ref, data) => (ops.push({ k: 'set', ref, data }), b), update: (ref, data) => (ops.push({ k: 'update', ref, data }), b), delete: ref => (ops.push({ k: 'del', ref }), b), commit: () => run(ops) }; return b; }
