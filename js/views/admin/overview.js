import { html, icon, ago } from '../../util.js';
import { describe } from './activity.js';

export default async function overview({ store, session, pending, joins }) {
  const [members, projects, photos, events, activity] = await Promise.all([store.members(), store.projects(), store.photos(), store.events(), store.activity()]);
  const admins = members.filter((m) => m.role === 'admin').length;

  const tiles = [
    ['Members', members.length, 'users', '#/admin/members'],
    ['Admins', admins, 'shield', '#/admin/members'],
    ['Projects', projects.length, 'folder', '#/admin/projects'],
    ['Photos', photos.length, 'image', '#/admin/gallery'],
    ['Events', events.length, 'calendar', '#/admin/events'],
    ['Waiting for review', pending.length + joins.length, 'inbox', '#/admin/approvals'],
  ];

  return {
    html: html`
      <div class="admin-head"><h1 class="title-lg">Overview</h1><p class="muted">Signed in as ${session.email}</p></div>
      <div class="tile-grid">
        ${tiles.map(([label, n, ic, href], i) => html`<a href="${href}" class="card spot tile-stat reveal" data-delay="${(i % 3) + 1}">${icon(ic)}<b>${n}</b><span>${label}</span></a>`)}
      </div>
      <div class="admin-cols">
        <div class="card reveal">
          <div class="card-head"><h3>Quick actions</h3></div>
          <div class="stack" style="gap:10px">
            <a class="btn btn-soft" href="#/admin/members">${icon('users')} Add a member or admin</a>
            <a class="btn btn-soft" href="#/admin/approvals">${icon('inbox')} Review pending requests</a>
            <a class="btn btn-soft" href="#/admin/gallery">${icon('image')} Upload photos</a>
            <a class="btn btn-soft" href="#/admin/projects">${icon('folder')} Edit projects</a>
          </div>
        </div>
        <div class="card reveal" data-delay="1">
          <div class="card-head"><h3>Recent activity</h3><a class="small" href="#/admin/activity" style="color:var(--cyan)">See all</a></div>
          ${activity.length
            ? html`<ul class="feed compact">${activity.slice(0, 6).map((a) => html`<li><div><b>${describe(a)}</b><p class="muted small">${a.actor || 'system'} &middot; ${ago(a.at)}</p></div></li>`)}</ul>`
            : html`<p class="muted">No activity recorded yet.</p>`}
        </div>
      </div>
      ${store.mode === 'preview' ? html`<div class="notice info reveal" style="margin-top:24px">${icon('info')}<div><b>Preview mode.</b> Changes here are saved only in this browser. Connect the database to make the site live, the README has the steps.</div></div>` : ''}`,
  };
}
