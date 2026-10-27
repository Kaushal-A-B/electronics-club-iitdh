import { config } from './config.js';
import { initStore, store } from './store/index.js';
import { define, parseHash, match, go } from './router.js';
import { html, setHtml, icon, logoMark, avatar, esc, $, $$ } from './util.js';
import { toast, observeReveals, initSpotlight, openModal } from './ui.js';

const view = $('#view');
let token = 0;
let cleanup = null;

/* ---------- routes ---------- */
define('/', 'public', () => import('./views/home.js'));
define('/domains', 'public', () => import('./views/domains.js'));
define('/projects', 'public', () => import('./views/projects.js'));
define('/projects/:id', 'public', () => import('./views/project.js'));
define('/gallery', 'public', () => import('./views/gallery.js'));
define('/events', 'public', () => import('./views/events.js'));
define('/team', 'public', () => import('./views/team.js'));
define('/join', 'public', () => import('./views/join.js'));
define('/signin', 'public', () => import('./views/signin.js'));

define('/app', 'member', () => import('./views/dashboard.js'));
define('/app/profile', 'member', () => import('./views/profile.js'));
define('/app/members', 'member', () => import('./views/directory.js'));
define('/app/announcements', 'member', () => import('./views/announcements.js'));
define('/app/resources', 'member', () => import('./views/resources.js'));

define('/admin', 'admin', () => import('./views/admin/index.js'));
define('/admin/:section', 'admin', () => import('./views/admin/index.js'));

/* ---------- navigation chrome ---------- */
const PUBLIC_LINKS = [
  ['/', 'Home'],
  ['/domains', 'Domains'],
  ['/projects', 'Projects'],
  ['/gallery', 'Gallery'],
  ['/events', 'Events'],
  ['/team', 'Team'],
];

function renderNav() {
  const s = store.session;
  const role = store.role;
  const path = parseHash().path;
  const active = (p) => (p === '/' ? path === '/' : path === p || path.startsWith(p + '/'));
  const links = [...PUBLIC_LINKS];
  if (role) links.push(['/app', 'Members area']);
  else links.push(['/join', 'Join']);

  const theme = document.documentElement.dataset.theme === 'light' ? 'sun' : 'moon';
  setHtml($('#nav'), html`
    <div class="wrap">
      <a href="#/" class="brand" aria-label="${config.clubName} home">
        ${logoMark('brand-mark')}
        <span class="brand-text"><b>ELECTRONICS</b><span>CLUB</span></span>
      </a>
      <nav class="nav-links" id="nav-links" aria-label="Main">
        ${links.map(([p, label]) => html`<a href="#${p}" class="${active(p) ? 'active' : ''}">${label}</a>`)}
      </nav>
      <div class="nav-end">
        <button class="icon-btn" id="theme-btn" aria-label="Toggle colour theme">${icon(theme)}</button>
        ${s
          ? html`<div class="user-menu" id="user-menu">
              <button class="user-chip" id="user-chip" aria-haspopup="true">${avatar({ name: s.name, avatar_url: s.avatar_url })}<span class="name">${s.name}</span></button>
              <div class="menu-pop" role="menu">
                <div class="who"><b>${s.name}</b><small>${s.email}</small><div style="margin-top:8px">${role === 'admin' ? html`<span class="badge info">Admin</span>` : role ? html`<span class="badge ok">Member</span>` : html`<span class="badge neutral">Not a member yet</span>`}</div></div>
                ${role ? html`<a href="#/app">${icon('dash')} Dashboard</a><a href="#/app/profile">${icon('user')} My profile</a>` : html`<a href="#/join">${icon('users')} Request to join</a>`}
                ${role === 'admin' ? html`<a href="#/admin">${icon('shield')} Admin console</a>` : ''}
                <button id="signout">${icon('logout')} Sign out</button>
              </div>
            </div>`
          : html`<a href="#/signin" class="btn btn-primary btn-sm">Sign in</a>`}
        <button class="icon-btn nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false">${icon('menu')}</button>
      </div>
    </div>`);

  $('#theme-btn').onclick = toggleTheme;
  $('#nav-toggle').onclick = () => {
    const open = $('#nav-links').classList.toggle('open');
    $('#nav-toggle').setAttribute('aria-expanded', open);
  };
  $$('#nav-links a').forEach((a) => a.addEventListener('click', () => $('#nav-links').classList.remove('open')));
  const um = $('#user-menu');
  if (um) {
    $('#user-chip').onclick = (e) => { e.stopPropagation(); um.classList.toggle('open'); };
    $$('a, button#signout', um).forEach((el) => el.addEventListener('click', () => um.classList.remove('open')));
    $('#signout').onclick = async () => { await store.signOut(); toast('Signed out'); go('/'); };
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#user-menu')) $('#user-menu')?.classList.remove('open');
});

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('ec-theme', next); } catch { /* private mode */ }
  document.dispatchEvent(new CustomEvent('themechange'));
  renderNav();
}

function renderFooter() {
  const year = new Date().getFullYear();
  setHtml($('#footer'), html`
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-about">
          <a href="#/" class="brand">${logoMark('brand-mark')}<span class="brand-text"><b>ELECTRONICS</b><span>CLUB</span></span></a>
          <p class="muted">The student electronics club at ${config.college}. Digital and analog VLSI, embedded systems and communication systems.</p>
        </div>
        <div><h4>Explore</h4><ul>
          <li><a href="#/domains">Domains</a></li><li><a href="#/projects">Projects</a></li><li><a href="#/gallery">Gallery</a></li><li><a href="#/events">Events</a></li><li><a href="#/team">Team</a></li>
        </ul></div>
        <div><h4>Members</h4><ul>
          <li><a href="#/signin">Sign in</a></li><li><a href="#/join">How to join</a></li><li><a href="#/app/resources">Resources</a></li>
        </ul></div>
        <div><h4>Find us</h4><ul>
          <li class="muted">Electronics lab, ${config.college}</li>
          ${config.contactEmail ? html`<li><a href="mailto:${config.contactEmail}">${config.contactEmail}</a></li>` : ''}
          ${config.github ? html`<li><a href="${config.github}" target="_blank" rel="noopener">GitHub</a></li>` : ''}
          ${config.instagram ? html`<li><a href="${config.instagram}" target="_blank" rel="noopener">Instagram</a></li>` : ''}
        </ul></div>
      </div>
      <div class="foot-base"><span>&copy; ${year} ${config.clubName}, ${config.college}</span><span class="mono faint">Built by club members</span></div>
    </div>`);
}

function renderPreviewPill() {
  if (store.mode !== 'preview') return;
  const pill = document.createElement('div');
  pill.className = 'preview-pill';
  pill.innerHTML = `<span class="dot"></span><span><b>Preview mode</b> &middot; sample data in this browser</span>
    <button id="pv-info">Why?</button><button id="pv-reset">Reset</button>`;
  document.body.append(pill);
  $('#pv-reset').onclick = () => { store.resetPreview(); toast('Sample data restored'); go('/'); };
  $('#pv-info').onclick = () => openModal({
    title: 'About preview mode',
    size: 'small',
    body: `<p class="muted">The site is not connected to a database yet, so everything you see is sample content saved only in this browser. Sign-in is simulated so you can look at the public, member and admin views.</p>
           <p class="muted" style="margin-top:12px">To go live, add the Supabase project details to <span class="kbd">js/config.js</span>. The steps are in the README.</p>`,
  });
}

/* ---------- gate screens ---------- */
function gate(kind) {
  const s = store.session;
  const next = encodeURIComponent(parseHash().path);
  if (kind === 'member' && !s) {
    return { title: 'Members only', html: html`<section class="section"><div class="wrap wrap-narrow"><div class="gate">${icon('lock')}<h1 class="title-lg">Members only</h1><p class="lead">This part of the site is for club members. Sign in with your college email to continue.</p><a class="btn btn-primary" href="#/signin?next=${next}">Sign in</a></div></div></section>` };
  }
  if (!store.role) {
    return { title: 'Not a member yet', html: html`<section class="section"><div class="wrap wrap-narrow"><div class="gate">${icon('users')}<h1 class="title-lg">You are signed in, but not on the roster</h1><p class="lead">${s?.email} has not been added as a member yet. Send a join request and an admin will take a look.</p><a class="btn btn-primary" href="#/join">Request to join</a></div></div></section>` };
  }
  return { title: 'Admins only', html: html`<section class="section"><div class="wrap wrap-narrow"><div class="gate">${icon('shield')}<h1 class="title-lg">Admins only</h1><p class="lead">You need admin access to open this page. If you think that is a mistake, ask one of the club admins.</p><a class="btn btn-ghost" href="#/app">Back to dashboard</a></div></div></section>` };
}

/* ---------- render loop ---------- */
async function render(keepScroll = false) {
  const my = ++token;
  const { path, query } = parseHash();
  const found = match(path);
  cleanup?.();
  cleanup = null;
  renderNav();

  let page;
  const role = store.role;
  const allowed = !found ? true : found.access === 'public' || (found.access === 'member' && role) || (found.access === 'admin' && role === 'admin');

  try {
    if (!found) {
      page = { title: 'Page not found', html: html`<section class="section"><div class="wrap wrap-narrow"><div class="gate">${icon('chip')}<h1 class="title-lg">No such page</h1><p class="lead">That address does not lead anywhere. It may have moved.</p><a class="btn btn-primary" href="#/">Back home</a></div></div></section>` };
    } else if (!allowed) {
      page = gate(found.access);
    } else {
      const mod = await found.loader();
      page = await mod.default({ store, params: found.params, query, path, rerender: () => render(true), session: store.session, role, member: store.member });
    }
  } catch (err) {
    console.error(err);
    page = { title: 'Something broke', html: html`<section class="section"><div class="wrap wrap-narrow"><div class="gate">${icon('alert')}<h1 class="title-lg">That did not load</h1><p class="lead">${err.message || 'Unexpected error.'}</p><button class="btn btn-ghost" onclick="location.reload()">Reload</button></div></div></section>` };
  }
  if (my !== token) return;

  document.title = page.title ? `${page.title} | ${config.clubName}` : `${config.clubName} | ${config.college}`;
  setHtml(view, page.html);
  view.classList.remove('enter');
  void view.offsetWidth;
  view.classList.add('enter');
  if (!keepScroll) window.scrollTo({ top: 0, behavior: 'instant' });
  cleanup = page.after?.(view) || null;
  observeReveals(view);
  $('#nav').classList.toggle('scrolled', window.scrollY > 10);
}

window.addEventListener('hashchange', () => render(false));
window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', window.scrollY > 10), { passive: true });

/* ---------- boot ---------- */
(async function boot() {
  try {
    await initStore();
  } catch (err) {
    console.error(err);
    view.innerHTML = `<section class="section"><div class="wrap wrap-narrow"><div class="gate"><h1 class="title-lg">Could not start</h1><p class="lead">${esc(err.message)}</p></div></div></section>`;
    return;
  }
  initSpotlight();
  renderFooter();
  renderPreviewPill();

  // coming back from google sign in
  const ret = sessionStorage.getItem('ec-return');
  if (store.session && ret) {
    sessionStorage.removeItem('ec-return');
    location.hash = ret.replace(/^#/, '') === '/signin' ? '/app' : ret;
  }
  const authError = store.takeError?.();
  if (authError) toast(authError, 'err');

  let wasRole = store.role;
  let wasEmail = store.session?.email;
  store.onChange(() => {
    const changed = wasRole !== store.role || wasEmail !== store.session?.email;
    wasRole = store.role; wasEmail = store.session?.email;
    const err = store.takeError?.();
    if (err) toast(err, 'err');
    if (changed) render(true);
  });
  document.addEventListener('themechange', () => window.dispatchEvent(new Event('resize')));
  await render(false);
  document.body.classList.add('ready');
})();
