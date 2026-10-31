import { config } from '../config.js';
import { uid, resizeImage, blobToDataUrl } from '../util.js';
import { buildSeed } from './seed.js';

const KEY = 'ec-preview-v2';
const PROFILE_KEYS = ['name', 'roll_no', 'branch', 'batch', 'bio', 'skills', 'domains', 'github', 'linkedin', 'avatar_url'];

// same shape as the live store, backed by localStorage so the whole site
// can be clicked through before the database exists
export async function createPreviewStore() {
  let db;
  let sessionEmail = null;
  let error = null;
  const listeners = new Set();

  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ db, sessionEmail })); }
    catch { throw new Error('Preview storage is full. Reset the demo data from the banner.'); }
  };
  const restore = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved?.db) { db = saved.db; sessionEmail = saved.sessionEmail; return; }
    } catch { /* fall through to a fresh seed */ }
    db = buildSeed();
    sessionEmail = null;
  };
  restore();

  const emit = () => listeners.forEach((fn) => fn());
  const me = () => db.members.find((m) => m.email === sessionEmail) || null;
  const needRole = (role) => {
    const m = me();
    if (!m || (role === 'admin' && m.role !== 'admin')) throw new Error('You do not have permission to do that.');
  };
  const log = (action, target) => {
    db.activity.unshift({ id: Date.now() + Math.random(), actor: sessionEmail, action, target, at: new Date().toISOString() });
    db.activity.length = Math.min(db.activity.length, 200);
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));

  function saveRow(table, label, row, extra = {}) {
    needRole('admin');
    const list = db[table];
    if (row.id) {
      const i = list.findIndex((r) => r.id === row.id);
      list[i] = { ...list[i], ...row, ...extra };
      log(`UPDATE ${table}`, row[label]);
      persist();
      return clone(list[i]);
    }
    const created = { ...row, ...extra, id: uid(), created_at: new Date().toISOString() };
    list.push(created);
    log(`INSERT ${table}`, created[label]);
    persist();
    return clone(created);
  }
  function removeRow(table, label, id) {
    needRole('admin');
    const i = db[table].findIndex((r) => r.id === id);
    if (i < 0) return;
    log(`DELETE ${table}`, db[table][i][label]);
    db[table].splice(i, 1);
    persist();
  }

  const store = {
    mode: 'preview',
    async init() {},
    get session() {
      if (!sessionEmail) return null;
      const m = me();
      return { email: sessionEmail, name: m?.name || sessionEmail.split('@')[0], avatar_url: m?.avatar_url || null, id: 'preview-user' };
    },
    get member() { return me(); },
    get role() { return me()?.role || null; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async signIn() { throw new Error('Pick a role on the sign in page while in preview mode.'); },
    previewSignIn(kind) {
      sessionEmail = kind === 'admin' ? config.previewAdmin : kind === 'member' ? 'member@' + config.emailDomain : 'visitor@' + config.emailDomain;
      if (!me()) { sessionEmail = null; error = 'Only club members can sign in. Ask a club admin to add your @iitdh.ac.in email.'; }
      persist(); emit();
    },
    takeError() { const e = error; error = null; return e; },
    async signOut() { sessionEmail = null; persist(); emit(); },
    resetPreview() { localStorage.removeItem(KEY); restore(); emit(); },

    /* public */
    async team() {
      return clone(db.members.filter((m) => m.position)).map(({ email, role, ...rest }) => rest);
    },
    async stats() {
      return { members: db.members.length, projects: db.projects.length, events: db.events.length, domains: 4 };
    },
    async projects() { return clone(db.projects).sort((a, b) => Number(b.featured) - Number(a.featured) || b.created_at.localeCompare(a.created_at)); },
    async photos() { return clone(db.photos).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async events() { return clone(db.events).sort((a, b) => a.starts_at.localeCompare(b.starts_at)); },

    /* members */
    async announcements() { needRole(); return clone(db.announcements).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at)); },
    async resources() { needRole(); return clone(db.resources); },
    async members() { needRole(); return clone(db.members); },
    async rsvps() { needRole(); return clone(db.rsvps); },
    async rsvp(eventId, going) {
      needRole();
      db.rsvps = db.rsvps.filter((r) => !(r.event_id === eventId && r.email === sessionEmail));
      if (going) db.rsvps.push({ event_id: eventId, email: sessionEmail });
      persist();
    },

    /* profile approval */
    async myChange() {
      const mine = db.profile_changes.filter((c) => c.email === sessionEmail).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
      return mine[0] ? clone(mine[0]) : null;
    },
    async submitProfile(data) {
      needRole();
      const clean = {};
      PROFILE_KEYS.forEach((k) => { if (k in data) clean[k] = data[k]; });
      if (clean.avatar_url instanceof Blob) clean.avatar_url = await blobToDataUrl(clean.avatar_url);
      db.profile_changes = db.profile_changes.filter((c) => !(c.email === sessionEmail && c.status === 'pending'));
      db.profile_changes.push({ id: uid(), email: sessionEmail, data: clean, status: 'pending', note: null, submitted_at: new Date().toISOString(), reviewed_by: null, reviewed_at: null });
      persist();
    },
    async pendingChanges() {
      needRole('admin');
      return clone(db.profile_changes.filter((c) => c.status === 'pending')).map((c) => ({ ...c, current: clone(db.members.find((m) => m.email === c.email) || {}) }));
    },
    async reviewChange(id, approve, note) {
      needRole('admin');
      const c = db.profile_changes.find((x) => x.id === id);
      if (!c || c.status !== 'pending') throw new Error('That request was already handled.');
      if (approve) {
        const m = db.members.find((x) => x.email === c.email);
        if (m) Object.assign(m, c.data);
      }
      Object.assign(c, { status: approve ? 'approved' : 'rejected', note: note || null, reviewed_by: sessionEmail, reviewed_at: new Date().toISOString() });
      log(approve ? 'APPROVE profile' : 'REJECT profile', c.email);
      persist();
    },

    /* admin writes */
    saveProject: (p) => saveRow('projects', 'title', p),
    deleteProject: (id) => removeRow('projects', 'title', id),
    savePhoto: (p) => saveRow('photos', 'caption', p),
    deletePhoto: (p) => removeRow('photos', 'caption', p.id),
    saveEvent: (e) => saveRow('events', 'title', e),
    deleteEvent: (id) => removeRow('events', 'title', id),
    saveAnnouncement: (a) => saveRow('announcements', 'title', a, { created_by: sessionEmail }),
    deleteAnnouncement: (id) => removeRow('announcements', 'title', id),
    saveResource: (r) => saveRow('resources', 'title', r),
    deleteResource: (id) => removeRow('resources', 'title', id),

    async addMember(m) {
      needRole('admin');
      const email = m.email.trim().toLowerCase();
      if (db.members.some((x) => x.email === email)) throw new Error('That person is already on the roster.');
      db.members.push({ roll_no: '', batch: '', branch: '', bio: '', skills: [], domains: [], github: '', linkedin: '', avatar_url: null, position: null, lead_domain: null, ...m, name: m.name || email.split('@')[0], email, joined_at: new Date().toISOString() });
      log('INSERT members', email);
      persist();
    },
    async updateMember(email, patch) {
      needRole('admin');
      const m = db.members.find((x) => x.email === email);
      if (m.role === 'admin' && patch.role === 'member' && db.members.filter((x) => x.role === 'admin').length < 2) throw new Error('There has to be at least one admin.');
      Object.assign(m, patch);
      if (!m.name) m.name = email.split('@')[0];
      log('UPDATE members', email);
      persist();
    },
    async removeMember(email) {
      needRole('admin');
      const m = db.members.find((x) => x.email === email);
      if (m?.role === 'admin' && db.members.filter((x) => x.role === 'admin').length < 2) throw new Error('There has to be at least one admin.');
      db.members = db.members.filter((x) => x.email !== email);
      db.profile_changes = db.profile_changes.filter((c) => c.email !== email);
      log('DELETE members', email);
      persist();
    },
    async activity() { needRole('admin'); return clone(db.activity); },

    async uploadImage(file) {
      if (!file || typeof file === 'string') return file || null;
      const blob = await resizeImage(file, 1200, 0.78);
      return blobToDataUrl(blob);
    },
  };
  return store;
}
