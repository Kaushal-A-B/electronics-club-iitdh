import { html, icon } from '../util.js';
import { DOMAINS } from '../domains.js';
import { teamCard, pageHeader } from './shared.js';

const slot = (role) => html`
  <article class="card team-card slot reveal">
    <span class="avatar lg" aria-hidden="true">?</span>
    <h3>To be announced</h3>
    <span class="role">${role}</span>
  </article>`;

export default async function team({ store }) {
  const people = await store.team();
  const pick = (pos) => people.filter((m) => m.position === pos);
  const officers = [['Secretary', pick('Secretary')], ['Deputy Secretary', pick('Deputy Secretary')]];

  return {
    title: 'Team',
    html: html`
      ${pageHeader('Team', 'The people who run it', 'A secretary, a deputy and a lead for every domain. Ask any of them anything.')}
      <section class="wrap team-wrap">
        <h2 class="title-md reveal">Core team</h2>
        <div class="grid grid-3 team-grid">
          ${officers.map(([role, list]) => (list.length ? list.map(teamCard) : slot(role)))}
        </div>
        ${DOMAINS.map((d) => {
          const leads = people.filter((m) => m.position === 'Lead' && m.lead_domain === d.slug);
          return html`
            <div class="team-group d-${d.slug}">
              <div class="group-head reveal"><span class="d-icon sm">${icon(d.icon)}</span><h2 class="title-md">${d.name}</h2></div>
              <div class="grid grid-3 team-grid">${leads.length ? leads.map(teamCard) : slot(d.name + ' Lead')}</div>
            </div>`;
        })}
      </section>`,
  };
}
