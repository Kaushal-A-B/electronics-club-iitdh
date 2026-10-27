import { html, icon, avatar, ago, fmt } from '../util.js';
import { domainName } from '../domains.js';
import { appHeader, eventDate } from './shared.js';

export default async function dashboard({ store, session, member, role }) {
  const admin = role === 'admin';
  const [announcements, events, rsvps, change, pending, joins] = await Promise.all([
    store.announcements(),
    store.events(),
    store.rsvps(),
    store.myChange(),
    admin ? store.pendingChanges() : [],
    admin ? store.joinRequests() : [],
  ]);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.ends_at || e.starts_at).getTime() >= now).slice(0, 3);
  const going = (id) => rsvps.some((r) => r.event_id === id && r.email === session.email);
  const first = (member?.name || session.name || '').split(' ')[0];

  const fields = ['name', 'bio', 'branch', 'batch'];
  const filled = fields.filter((k) => member?.[k]).length + ((member?.domains || []).length ? 1 : 0) + ((member?.skills || []).length ? 1 : 0);
  const pct = Math.round((filled / (fields.length + 2)) * 100);

  let status;
  if (change?.status === 'pending') status = html`<span class="badge pending">Changes waiting for approval</span>`;
  else if (change?.status === 'rejected') status = html`<span class="badge bad">Last change was not approved</span>`;
  else if (!member?.name) status = html`<span class="badge neutral">Profile not started</span>`;
  else status = html`<span class="badge ok">Profile approved</span>`;

  return {
    title: 'Dashboard',
    html: html`
      ${appHeader('/app', `Hello, ${first || 'there'}`, 'Here is what is happening in the club.', admin ? html`<a class="btn btn-ghost btn-sm" href="#/admin">${icon('shield')} Admin console</a>` : '')}
      <section class="wrap dash-grid">
        ${admin && (pending.length || joins.length) ? html`
          <a class="notice info dash-alert reveal" href="#/admin/approvals" style="grid-column:1/-1">${icon('inbox')}<div><b>Needs your attention.</b> ${pending.length} profile ${pending.length === 1 ? 'change' : 'changes'} and ${joins.length} join ${joins.length === 1 ? 'request' : 'requests'} waiting for review.</div></a>` : ''}

        <div class="card profile-card reveal">
          <div class="row" style="gap:18px">${avatar({ name: member?.name || session.name, avatar_url: member?.avatar_url }, 'md')}
            <div><h3>${member?.name || session.name}</h3><p class="muted small">${session.email}</p></div></div>
          <div class="row row-wrap" style="gap:8px;margin-top:18px">${admin ? html`<span class="badge info">Admin</span>` : html`<span class="badge ok">Member</span>`}${member?.position ? html`<span class="tag">${member.position === 'Lead' ? domainName(member.lead_domain) + ' Lead' : member.position}</span>` : ''}${status}</div>
          <div class="meter" aria-label="Profile ${pct}% complete"><span style="width:${pct}%"></span></div>
          <p class="muted small">Profile ${pct}% complete</p>
          ${change?.status === 'rejected' && change.note ? html`<div class="notice bad" style="margin-top:14px">${icon('alert')}<div><b>Admin note:</b> ${change.note}</div></div>` : ''}
          <a class="btn btn-soft btn-sm" href="#/app/profile" style="margin-top:18px">${icon('edit')} ${member?.name ? 'Edit profile' : 'Set up profile'}</a>
        </div>

        <div class="card reveal" data-delay="1">
          <div class="card-head"><h3>Announcements</h3><a href="#/app/announcements" class="small" style="color:var(--cyan)">View all</a></div>
          ${announcements.length
            ? html`<ul class="feed">${announcements.slice(0, 3).map((a) => html`<li>${a.pinned ? html`<span class="pin">${icon('pin')}</span>` : ''}<div><b>${a.title}</b><p class="muted small clamp">${a.body}</p><span class="faint small">${ago(a.created_at)}</span></div></li>`)}</ul>`
            : html`<p class="muted">Nothing posted yet.</p>`}
        </div>

        <div class="card reveal" data-delay="2" style="grid-column:1/-1">
          <div class="card-head"><h3>Your next sessions</h3><a href="#/events" class="small" style="color:var(--cyan)">All events</a></div>
          ${upcoming.length
            ? html`<div class="grid grid-3">${upcoming.map((e) => html`<a href="#/events" class="mini-event inline ${e.domain ? 'd-' + e.domain : ''}">${eventDate(e)}<div><h4>${e.title}</h4><p class="muted small">${fmt('time', e.starts_at)}${e.location ? ' · ' + e.location : ''}</p>${going(e.id) ? html`<span class="badge ok">Going</span>` : e.rsvp_open ? html`<span class="badge neutral">RSVP open</span>` : ''}</div></a>`)}</div>`
            : html`<p class="muted">No sessions on the calendar yet.</p>`}
        </div>
      </section>`,
  };
}
