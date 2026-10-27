import { html, icon, debounce, $, $$ } from '../util.js';
import { DOMAINS } from '../domains.js';
import { observeReveals, confirmDialog, toast } from '../ui.js';
import { editProject } from '../editors.js';
import { projectCard, pageHeader } from './shared.js';

export default async function projects({ store, role, query, rerender }) {
  const list = await store.projects();
  const admin = role === 'admin';
  const state = { d: query.d || '', status: '', q: '' };

  const add = admin ? html`<button class="btn btn-primary" id="add-project">${icon('plus')} Add project</button>` : '';

  const body = html`
    ${pageHeader('Projects', 'Things we have built', 'Work in progress, finished builds and ideas waiting for hands. Pick one and see who is behind it.', add)}
    <section class="wrap" style="padding-bottom:96px">
      <div class="filters">
        <div class="tabs" id="dom-tabs">
          <button data-d="" class="${state.d ? '' : 'on'}">All</button>
          ${DOMAINS.map((d) => html`<button data-d="${d.slug}" class="${state.d === d.slug ? 'on' : ''}">${d.name}</button>`)}
        </div>
        <select class="select" id="status-filter" style="width:auto" aria-label="Filter by status">
          <option value="">Any status</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="planned">Planned</option>
        </select>
        <div class="search">${icon('search')}<input class="input" id="q" type="search" placeholder="Search projects or tools" aria-label="Search projects"></div>
      </div>
      <div class="grid grid-3" id="grid"></div>
    </section>`;

  return {
    title: 'Projects',
    html: body,
    after(root) {
      const grid = $('#grid', root);
      function draw() {
        const q = state.q.toLowerCase();
        const shown = list.filter((p) =>
          (!state.d || p.domain === state.d) &&
          (!state.status || p.status === state.status) &&
          (!q || [p.title, p.summary, ...(p.tech || [])].join(' ').toLowerCase().includes(q))
        );
        grid.innerHTML = shown.length
          ? shown.map((p) => projectCard(p, admin)).join('')
          : html`<div class="empty" style="grid-column:1/-1">${icon('folder')}<h3>${list.length ? 'Nothing matches those filters' : 'No projects yet'}</h3><p>${list.length ? 'Try a different domain or clear the search.' : admin ? 'Use the Add project button to publish the first one.' : 'Check back soon.'}</p></div>`.s;
        observeReveals(grid);
      }
      draw();

      $('#dom-tabs', root).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        state.d = b.dataset.d;
        $$('#dom-tabs button', root).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      });
      $('#status-filter', root).addEventListener('change', (e) => { state.status = e.target.value; draw(); });
      $('#q', root).addEventListener('input', debounce((e) => { state.q = e.target.value.trim(); draw(); }, 160));

      if (!admin) return;
      $('#add-project', root).addEventListener('click', async () => { if (await editProject(null)) rerender(); });
      grid.addEventListener('click', async (e) => {
        const edit = e.target.closest('[data-edit]');
        const del = e.target.closest('[data-del]');
        if (edit) {
          if (await editProject(list.find((p) => p.id === edit.dataset.edit))) rerender();
        } else if (del) {
          const p = list.find((x) => x.id === del.dataset.del);
          if (await confirmDialog({ title: 'Delete this project?', message: `"${p.title}" will be removed from the site for everyone.`, confirmLabel: 'Delete', danger: true })) {
            try { await store.deleteProject(p.id); toast('Project deleted'); rerender(); } catch (err) { toast(err.message, 'err'); }
          }
        }
      });
    },
  };
}
