import { html, raw, icon, safeUrl, avatar, fmt } from '../util.js';
import { domainBySlug, domainName } from '../domains.js';

export const STATUS = {
  ongoing: ['info', 'Ongoing'],
  completed: ['ok', 'Completed'],
  planned: ['neutral', 'Planned'],
};

export const statusBadge = (s) => {
  const [cls, label] = STATUS[s] || STATUS.ongoing;
  return html`<span class="badge ${cls}">${label}</span>`;
};

export function domainTag(slug) {
  if (!slug) return '';
  return html`<span class="tag dom d-${slug}">${domainName(slug)}</span>`;
}

function cover(p) {
  const url = safeUrl(p.cover_url);
  if (url) return html`<img src="${url}" alt="" loading="lazy">`;
  const d = domainBySlug(p.domain);
  return html`<div class="cover-fallback">${icon(d?.icon || 'chip')}</div>`;
}

export function projectCard(p, admin = false) {
  return html`
    <article class="card spot lift project-card d-${p.domain} reveal" data-id="${p.id}">
      <a class="project-link" href="#/projects/${p.id}" aria-label="${p.title}"></a>
      <div class="project-cover">${cover(p)}${p.featured ? html`<span class="feat">${icon('star')} Featured</span>` : ''}</div>
      <div class="project-body">
        <div class="row row-wrap" style="gap:8px">${domainTag(p.domain)}${statusBadge(p.status)}</div>
        <h3>${p.title}</h3>
        <p class="muted">${p.summary || ''}</p>
        <div class="tags">${(p.tech || []).slice(0, 4).map((t) => html`<span class="tag">${t}</span>`)}</div>
      </div>
      ${admin ? html`<div class="card-admin">
        <button class="btn btn-soft btn-sm" data-edit="${p.id}">${icon('edit')} Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${p.id}">${icon('trash')}</button>
      </div>` : ''}
    </article>`;
}

export function eventDate(e) {
  return html`<div class="ev-date"><b>${fmt('day', e.starts_at)}</b><span>${fmt('mon', e.starts_at)}</span></div>`;
}

export function eventCard(e, extra = '') {
  return html`
    <article class="card event-card spot reveal ${e.domain ? 'd-' + e.domain : ''}">
      ${eventDate(e)}
      <div class="ev-main">
        <div class="row row-wrap" style="gap:8px">${e.domain ? domainTag(e.domain) : html`<span class="tag">Open to all</span>`}</div>
        <h3>${e.title}</h3>
        <p class="ev-meta">${icon('clock')} ${fmt('long', e.starts_at)}${e.location ? html` <span class="dotsep"></span> ${icon('pin')} ${e.location}` : ''}</p>
        ${e.description ? html`<p class="muted ev-desc">${e.description}</p>` : ''}
        ${raw(extra)}
      </div>
    </article>`;
}

export function teamCard(m) {
  const lead = m.position === 'Lead';
  const role = lead ? `${domainName(m.lead_domain)} Lead` : m.position;
  return html`
    <article class="card spot lift team-card reveal ${lead ? 'd-' + m.lead_domain : 'top'}">
      ${avatar(m, 'lg')}
      <h3>${m.name || 'Name pending'}</h3>
      <span class="role">${role}</span>
      ${m.bio ? html`<p class="muted">${m.bio}</p>` : ''}
      <div class="row" style="justify-content:center;gap:8px;margin-top:auto">
        ${safeUrl(m.github) ? html`<a class="icon-btn" href="${safeUrl(m.github)}" target="_blank" rel="noopener" aria-label="GitHub">${icon('github')}</a>` : ''}
        ${safeUrl(m.linkedin) ? html`<a class="icon-btn" href="${safeUrl(m.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${icon('linkedin')}</a>` : ''}
      </div>
    </article>`;
}

const APP_TABS = [
  ['/app', 'Dashboard', 'dash'],
  ['/app/profile', 'My profile', 'user'],
  ['/app/members', 'Directory', 'users'],
  ['/app/announcements', 'Announcements', 'bell'],
  ['/app/resources', 'Resources', 'book'],
];

// header + sub navigation shared by every members-area page
export function appHeader(active, title, lead, actions = '') {
  return html`
    <header class="page-head app-head">
      <div class="wrap">
        <span class="eyebrow">Members area</span>
        <div class="page-head-row">
          <div class="stack" style="gap:12px"><h1 class="title-lg">${title}</h1>${lead ? html`<p class="lead">${lead}</p>` : ''}</div>
          ${raw(actions)}
        </div>
        <nav class="subnav" aria-label="Members area">
          ${APP_TABS.map(([p, label, ic]) => html`<a href="#${p}" class="${p === active ? 'on' : ''}">${icon(ic)} ${label}</a>`)}
        </nav>
      </div>
    </header>`;
}

export function pageHeader(eyebrow, title, lead, actions = '') {
  return html`
    <header class="page-head">
      <div class="wrap">
        <span class="eyebrow">${eyebrow}</span>
        <div class="page-head-row">
          <div class="stack" style="gap:14px"><h1 class="title-xl">${title}</h1>${lead ? html`<p class="lead">${lead}</p>` : ''}</div>
          ${raw(actions)}
        </div>
      </div>
    </header>`;
}
