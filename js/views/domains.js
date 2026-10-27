import { html, icon, avatar } from '../util.js';
import { DOMAINS } from '../domains.js';
import { pageHeader } from './shared.js';

export default async function domains({ store, query }) {
  const [team, projects] = await Promise.all([store.team(), store.projects()]);

  const block = (d, i) => {
    const leads = team.filter((m) => m.position === 'Lead' && m.lead_domain === d.slug);
    const count = projects.filter((p) => p.domain === d.slug).length;
    return html`
      <section class="domain-block d-${d.slug} ${i % 2 ? 'flip' : ''}" id="${d.slug}" data-slug="${d.slug}">
        <div class="domain-visual reveal">
          <span class="d-icon big">${icon(d.icon)}</span>
          <span class="domain-num">0${i + 1}</span>
        </div>
        <div class="domain-text">
          <span class="eyebrow reveal">${d.tagline}</span>
          <h2 class="title-lg reveal">${d.name}</h2>
          <p class="lead reveal">${d.about}</p>
          <div class="reveal">
            <h4 class="mini-title">What members work on</h4>
            <ul class="ticks">${d.does.map((x) => html`<li>${icon('check')}<span>${x}</span></li>`)}</ul>
          </div>
          <div class="reveal"><h4 class="mini-title">Tools you will pick up</h4><div class="tags">${d.tools.map((t) => html`<span class="tag">${t}</span>`)}</div></div>
          <div class="domain-foot reveal">
            <div class="leads">
              <h4 class="mini-title">${leads.length === 1 ? 'Lead' : 'Leads'}</h4>
              ${leads.length
                ? html`<div class="row row-wrap">${leads.map((l) => html`<span class="lead-pill">${avatar(l)}<span>${l.name || 'Name pending'}</span></span>`)}</div>`
                : html`<span class="muted">To be announced</span>`}
            </div>
            <a class="btn btn-ghost btn-sm" href="#/projects?d=${d.slug}">${count ? `${count} project${count === 1 ? '' : 's'}` : 'Projects'} ${icon('arrow')}</a>
          </div>
        </div>
      </section>`;
  };

  return {
    title: 'Domains',
    html: html`
      ${pageHeader('Domains', 'Four ways into electronics', 'Each domain has its own leads, its own weekly sessions and its own corner of the lab. You can join more than one.')}
      <div class="wrap domains-wrap">${DOMAINS.map(block)}</div>`,
    after(root) {
      if (query.d) {
        const el = root.querySelector(`[data-slug="${query.d}"]`);
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      }
    },
  };
}
