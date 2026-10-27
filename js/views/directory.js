import { html, icon, avatar, safeUrl, debounce, $, $$ } from '../util.js';
import { DOMAINS, domainName } from '../domains.js';
import { observeReveals } from '../ui.js';
import { appHeader } from './shared.js';

export default async function directory({ store }) {
  const members = await store.members();
  const state = { d: '', q: '' };

  const card = (m) => {
    const role = m.position ? (m.position === 'Lead' ? domainName(m.lead_domain) + ' Lead' : m.position) : '';
    return html`
      <article class="card spot member-card reveal">
        <div class="row" style="gap:14px">${avatar(m, 'md')}
          <div class="who"><h4>${m.name || m.email.split('@')[0]}</h4><p class="muted small">${[m.branch, m.batch].filter(Boolean).join(' · ') || m.email}</p></div></div>
        <div class="row row-wrap" style="gap:6px">${m.role === 'admin' ? html`<span class="badge info">Admin</span>` : ''}${role ? html`<span class="tag">${role}</span>` : ''}</div>
        ${m.bio ? html`<p class="muted small clamp">${m.bio}</p>` : ''}
        <div class="tags">${(m.domains || []).map((d) => html`<span class="tag dom d-${d}">${domainName(d)}</span>`)}</div>
        ${(m.skills || []).length ? html`<p class="faint small">${m.skills.join(' · ')}</p>` : ''}
        <div class="row" style="gap:8px;margin-top:auto">
          <a class="icon-btn" href="mailto:${m.email}" aria-label="Email ${m.name || ''}">${icon('mail')}</a>
          ${safeUrl(m.github) ? html`<a class="icon-btn" href="${safeUrl(m.github)}" target="_blank" rel="noopener" aria-label="GitHub">${icon('github')}</a>` : ''}
          ${safeUrl(m.linkedin) ? html`<a class="icon-btn" href="${safeUrl(m.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${icon('linkedin')}</a>` : ''}
        </div>
      </article>`;
  };

  return {
    title: 'Directory',
    html: html`
      ${appHeader('/app/members', 'Member directory', `${members.length} people on the roster. Only approved profile details are shown.`)}
      <section class="wrap" style="padding-bottom:96px">
        <div class="filters">
          <div class="tabs" id="dir-tabs"><button data-d="" class="on">Everyone</button>${DOMAINS.map((d) => html`<button data-d="${d.slug}">${d.name}</button>`)}</div>
          <div class="search">${icon('search')}<input class="input" id="dq" type="search" placeholder="Search name, branch or skill" aria-label="Search members"></div>
        </div>
        <div class="grid grid-3" id="dir"></div>
      </section>`,
    after(root) {
      const box = $('#dir', root);
      function draw() {
        const q = state.q.toLowerCase();
        const list = members.filter((m) =>
          (!state.d || (m.domains || []).includes(state.d)) &&
          (!q || [m.name, m.email, m.branch, m.batch, ...(m.skills || [])].join(' ').toLowerCase().includes(q))
        );
        box.innerHTML = list.length ? list.map(card).join('') : html`<div class="empty" style="grid-column:1/-1">${icon('users')}<h3>No one matches</h3><p>Try another domain or a different search.</p></div>`.s;
        observeReveals(box);
      }
      draw();
      $('#dir-tabs', root).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        state.d = b.dataset.d;
        $$('#dir-tabs button', root).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      });
      $('#dq', root).addEventListener('input', debounce((e) => { state.q = e.target.value.trim(); draw(); }, 160));
    },
  };
}
