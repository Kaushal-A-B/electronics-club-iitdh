import { html, icon, safeUrl, $, $$ } from '../util.js';
import { DOMAINS } from '../domains.js';
import { observeReveals, confirmDialog, toast } from '../ui.js';
import { editResource } from '../editors.js';
import { appHeader, domainTag } from './shared.js';

export default async function resources({ store, role, rerender }) {
  const list = await store.resources();
  const admin = role === 'admin';
  let dom = '';

  return {
    title: 'Resources',
    html: html`
      ${appHeader('/app/resources', 'Resource library', 'Tutorials, datasheets and reading lists the club keeps in one place.', admin ? html`<button class="btn btn-primary btn-sm" id="new-res">${icon('plus')} Add resource</button>` : '')}
      <section class="wrap" style="padding-bottom:96px">
        <div class="filters"><div class="tabs" id="res-tabs"><button data-d="" class="on">All</button>${DOMAINS.map((d) => html`<button data-d="${d.slug}">${d.name}</button>`)}</div></div>
        <div class="grid grid-2" id="res"></div>
      </section>`,
    after(root) {
      const box = $('#res', root);
      function draw() {
        const items = list.filter((r) => !dom || r.domain === dom || !r.domain);
        box.innerHTML = items.length
          ? items.map((r) => html`
            <article class="card spot res-card reveal ${r.domain ? 'd-' + r.domain : ''}">
              <div class="row row-wrap" style="gap:8px"><span class="tag">${r.kind}</span>${r.domain ? domainTag(r.domain) : ''}<span class="spacer"></span>
                ${admin ? html`<button class="icon-btn" data-edit="${r.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-del="${r.id}" aria-label="Delete">${icon('trash')}</button>` : ''}</div>
              <h3><a href="${safeUrl(r.url)}" target="_blank" rel="noopener">${r.title} ${icon('external')}</a></h3>
              ${r.description ? html`<p class="muted">${r.description}</p>` : ''}
            </article>`).join('')
          : html`<div class="empty" style="grid-column:1/-1">${icon('book')}<h3>Nothing here yet</h3><p>${admin ? 'Add a link, datasheet or tutorial.' : 'Resources will be added soon.'}</p></div>`.s;
        observeReveals(box);
      }
      draw();
      $('#res-tabs', root).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        dom = b.dataset.d;
        $$('#res-tabs button', root).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      });
      if (!admin) return;
      $('#new-res', root).addEventListener('click', async () => { if (await editResource(null)) rerender(); });
      box.addEventListener('click', async (e) => {
        const ed = e.target.closest('[data-edit]');
        const del = e.target.closest('[data-del]');
        if (ed) { if (await editResource(list.find((r) => r.id === ed.dataset.edit))) rerender(); }
        else if (del) {
          if (await confirmDialog({ title: 'Remove this resource?', message: 'It will disappear from the library.', confirmLabel: 'Remove', danger: true })) {
            try { await store.deleteResource(del.dataset.del); toast('Resource removed'); rerender(); } catch (err) { toast(err.message, 'err'); }
          }
        }
      });
    },
  };
}
