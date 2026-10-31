import { html, icon, fmt, ago } from '../../util.js';

const NOUN = {
  members: 'member',
  projects: 'project',
  photos: 'photo',
  events: 'event',
  announcements: 'announcement',
  resources: 'resource',
  profile: 'profile change',
  site_content: 'site text',
};
const VERB = { INSERT: 'Added', UPDATE: 'Updated', DELETE: 'Removed', APPROVE: 'Approved', REJECT: 'Rejected' };

export function describe(row) {
  const [op, table] = String(row.action || '').split(' ');
  const noun = NOUN[table] || table;
  return `${VERB[op] || op} ${noun}${row.target ? `: ${row.target}` : ''}`;
}

export default async function activity({ store }) {
  const rows = await store.activity();
  return {
    html: html`
      <div class="admin-head"><h1 class="title-lg">Activity log</h1><p class="muted">The most recent changes made by admins. Entries are written by the database, so they cannot be edited from here.</p></div>
      ${rows.length
        ? html`<div class="table-wrap reveal"><table class="table"><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody>
            ${rows.map((r) => html`<tr><td style="white-space:nowrap" title="${fmt('date', r.at)}">${ago(r.at)}</td><td class="muted">${r.actor || 'system'}</td><td>${describe(r)}</td></tr>`)}
          </tbody></table></div>`
        : html`<div class="empty">${icon('history')}<h3>Nothing yet</h3><p>Changes will be listed here.</p></div>`}`,
  };
}
