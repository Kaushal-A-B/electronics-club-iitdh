import { config } from '../config.js';
import { uid, resizeImage } from '../util.js';

const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
const BUCKET = 'media';
const DENIED = 'Only club members can sign in. Ask a club admin to add your @iitdh.ac.in email.';
const PROFILE_KEYS = ['name', 'roll_no', 'branch', 'batch', 'bio', 'skills', 'domains', 'github', 'linkedin', 'avatar_url'];

function friendly(err) {
  const msg = err?.message || String(err);
  if (/row-level security|permission denied|not authorized/i.test(msg)) return 'You do not have permission to do that.';
  if (/duplicate key/i.test(msg)) return 'That entry already exists.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Could not reach the server. Check your connection and try again.';
  return msg;
}

export async function createLiveStore() {
  const { createClient } = await import(SDK);
  const sb = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });

  const listeners = new Set();
  const state = { user: null, member: null, error: null };
  const emit = () => listeners.forEach((fn) => fn());

  // unwrap a supabase response, throw something readable
  const run = async (req) => {
    const { data, error } = await req;
    if (error) throw new Error(friendly(error));
    return data;
  };

  async function refresh(session) {
    const user = session?.user || null;
    state.user = user;
    state.member = null;
    if (user) {
      const email = user.email.toLowerCase();
      const lookup = () => sb.from('members').select('*').eq('email', email).maybeSingle();
      let { data } = await lookup();
      // new members start with their email name, swap it for the Google account name once
      if (data && data.name === email.split('@')[0]) {
        try { await sb.rpc('sync_google_name'); ({ data } = await lookup()); } catch { /* keeps the placeholder */ }
      }
      const college = user.email.toLowerCase().endsWith('@' + config.emailDomain);
      if (!data || !college) {
        // signed in with google but nobody added this email to the roster
        state.error = DENIED;
        await sb.auth.signOut();
        state.user = null;
      } else {
        state.member = data;
      }
    }
    emit();
  }

  const store = {
    mode: 'live',

    async init() {
      // oauth failures come back as query or hash params
      const desc = new URLSearchParams(location.search).get('error_description');
      if (desc) {
        state.error = /domain|iitdh|member|database error/i.test(desc) ? DENIED : desc.replace(/\+/g, ' ');
      }
      const { data } = await sb.auth.getSession();
      await refresh(data.session);
      sb.auth.onAuthStateChange((evt, session) => {
        if (evt === 'INITIAL_SESSION') return;
        setTimeout(() => refresh(session), 0);
      });
      if (location.search.includes('code=') || desc) history.replaceState(null, '', location.pathname + location.hash);
    },

    get session() {
      const u = state.user;
      if (!u) return null;
      return {
        id: u.id,
        email: u.email.toLowerCase(),
        name: state.member?.name || u.email.split('@')[0],
        avatar_url: state.member?.avatar_url || u.user_metadata?.avatar_url || null,
      };
    },
    get member() { return state.member; },
    get role() { return state.member?.role || null; },
    takeError() { const e = state.error; state.error = null; return e; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async signIn() {
      sessionStorage.setItem('ec-return', location.hash || '#/app');
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: location.origin + location.pathname,
          queryParams: { hd: config.emailDomain, prompt: 'select_account' },
        },
      });
      if (error) throw new Error(friendly(error));
    },
    async signOut() { await sb.auth.signOut(); },

    /* public */
    team: () => run(sb.from('public_team').select('*').order('name')),
    stats: () => run(sb.rpc('public_stats')),
    projects: () => run(sb.from('projects').select('*').order('featured', { ascending: false }).order('created_at', { ascending: false })),
    photos: () => run(sb.from('photos').select('*').order('created_at', { ascending: false })),
    events: () => run(sb.from('events').select('*').order('starts_at')),

    /* members */
    announcements: () => run(sb.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false })),
    resources: () => run(sb.from('resources').select('*').order('created_at', { ascending: false })),
    members: () => run(sb.from('members').select('*').order('name', { nullsFirst: false })),
    rsvps: () => run(sb.from('event_rsvps').select('event_id,email')),
    async rsvp(eventId, going) {
      const email = state.user.email.toLowerCase();
      if (going) await run(sb.from('event_rsvps').upsert({ event_id: eventId, email }, { onConflict: 'event_id,email', ignoreDuplicates: true }));
      else await run(sb.from('event_rsvps').delete().eq('event_id', eventId).eq('email', email));
    },

    /* profile approval */
    async myChange() {
      const rows = await run(sb.from('profile_changes').select('*').eq('email', state.user.email.toLowerCase()).order('submitted_at', { ascending: false }).limit(1));
      return rows[0] || null;
    },
    async submitProfile(data) {
      const clean = {};
      PROFILE_KEYS.forEach((k) => { if (k in data) clean[k] = data[k]; });
      await run(sb.rpc('submit_profile_change', { p: clean }));
    },
    async pendingChanges() {
      const [changes, members] = await Promise.all([
        run(sb.from('profile_changes').select('*').eq('status', 'pending').order('submitted_at')),
        run(sb.from('members').select('*')),
      ]);
      return changes.map((c) => ({ ...c, current: members.find((m) => m.email === c.email) || {} }));
    },
    reviewChange: (id, approve, note) => run(sb.rpc('review_profile_change', { change_id: id, approve, note: note || null })),

    /* admin writes */
    saveProject: (p) => save('projects', p),
    deleteProject: (id) => remove('projects', id),
    savePhoto: (p) => save('photos', p),
    async deletePhoto(p) {
      const path = p.url?.split(`/${BUCKET}/`)[1];
      await remove('photos', p.id);
      if (path) await sb.storage.from(BUCKET).remove([path]);
    },
    saveEvent: (e) => save('events', e),
    deleteEvent: (id) => remove('events', id),
    saveAnnouncement: (a) => save('announcements', { ...a, created_by: state.user.email.toLowerCase() }),
    deleteAnnouncement: (id) => remove('announcements', id),
    saveResource: (r) => save('resources', r),
    deleteResource: (id) => remove('resources', id),

    addMember: (m) => run(sb.from('members').insert({ ...m, email: m.email.trim().toLowerCase(), added_by: state.user.email.toLowerCase() })),
    updateMember: (email, patch) => run(sb.from('members').update(patch).eq('email', email)),
    removeMember: (email) => run(sb.from('members').delete().eq('email', email)),
    activity: () => run(sb.from('activity_log').select('*').order('at', { ascending: false }).limit(150)),

    // returns the public url; strings pass straight through so edits without a new file are free
    async uploadImage(file, folder = 'misc') {
      if (!file || typeof file === 'string') return file || null;
      const blob = await resizeImage(file, folder === 'avatars' ? 480 : 1800, 0.84);
      const owner = folder === 'avatars' ? `avatars/${state.user.id}` : folder;
      const path = `${owner}/${uid()}.jpg`;
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (error) throw new Error(friendly(error));
      return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    },
  };

  async function save(table, row) {
    const { id, ...fields } = row;
    delete fields.created_at;
    if (id) return run(sb.from(table).update(fields).eq('id', id).select().single());
    return run(sb.from(table).insert(fields).select().single());
  }
  const remove = (table, id) => run(sb.from(table).delete().eq('id', id));

  return store;
}
