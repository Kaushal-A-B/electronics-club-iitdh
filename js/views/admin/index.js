import { html, icon, $ } from '../../util.js';
import { observeReveals } from '../../ui.js';

const SECTIONS = [
  ['overview', 'Overview', 'dash'],
  ['members', 'Members and admins', 'users'],
  ['approvals', 'Approvals', 'inbox'],
  ['projects', 'Projects', 'folder'],
  ['gallery', 'Photo catalog', 'image'],
  ['events', 'Events', 'calendar'],
  ['announcements', 'Announcements', 'bell'],
  ['resources', 'Resources', 'book'],
  ['activity', 'Activity log', 'history'],
];

const loaders = {
  overview: () => import('./overview.js'),
  members: () => import('./members.js'),
  approvals: () => import('./approvals.js'),
  projects: () => import('./content.js'),
  gallery: () => import('./content.js'),
  events: () => import('./content.js'),
  announcements: () => import('./content.js'),
  resources: () => import('./content.js'),
  activity: () => import('./activity.js'),
};

export default async function admin(ctx) {
  const section = ctx.params.section || 'overview';
  if (!loaders[section]) {
    return { title: 'Admin', html: html`<section class="section"><div class="wrap wrap-narrow"><div class="gate">${icon('shield')}<h1 class="title-lg">Unknown admin page</h1><a class="btn btn-primary" href="#/admin">Back to overview</a></div></div></section>` };
  }

  const [mod, pending] = await Promise.all([loaders[section](), ctx.store.pendingChanges()]);
  const waiting = pending.length;
  const inner = await mod.default({ ...ctx, section, pending });

  return {
    title: `Admin: ${SECTIONS.find((s) => s[0] === section)[1]}`,
    html: html`
      <div class="admin-shell">
        <aside class="admin-side">
          <div class="side-title">${icon('shield')} Admin console</div>
          <nav>
            ${SECTIONS.map(([key, label, ic]) => html`
              <a href="#/admin/${key === 'overview' ? '' : key}" class="${key === section ? 'on' : ''}">${icon(ic)}<span>${label}</span>${key === 'approvals' && waiting ? html`<b class="count">${waiting}</b>` : ''}</a>`)}
          </nav>
        </aside>
        <div class="admin-main" id="admin-main">${inner.html}</div>
      </div>`,
    after(root) {
      observeReveals(root);
      return inner.after?.($('#admin-main', root));
    },
  };
}
