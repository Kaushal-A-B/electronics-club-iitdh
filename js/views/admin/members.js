import { html, icon, avatar, debounce, fmt, $, $$ } from '../../util.js';
import { domainName } from '../../domains.js';
import { confirmDialog, toast } from '../../ui.js';
import { editMember } from '../../editors.js';

export default async function members({ store, session, rerender }) {
  const list = await store.members();
  const state = { f: 'all', q: '' };

  const filters = [
    ['all', `Everyone (${list.length})`],
    ['admin', `Admins (${list.filter((m) => m.role === 'admin').length})`],
    ['member', 'Members'],
    ['officer', 'Officers and leads'],
  ];

  const row = (m) => {
    const self = m.email === session.email;
    const pos = m.position ? (m.position === 'Lead' ? `${domainName(m.lead_domain)} Lead` : m.position) : '';
    return html`
      <tr>
        <td><div class="cell-person">${avatar(m)}<div><b>${m.name || 'No name yet'}${self ? html` <span class="faint">(you)</span>` : ''}</b><small>${m.email}</small></div></div></td>
        <td>${m.role === 'admin' ? html`<span class="badge info">Admin</span>` : html`<span class="badge neutral">Member</span>`}</td>
        <td>${pos || html`<span class="faint">None</span>`}</td>
        <td class="muted" style="white-space:nowrap">${fmt('date', m.joined_at)}</td>
        <td><div class="actions">
          <button class="btn btn-soft btn-sm" data-toggle="${m.email}" title="${m.role === 'admin' ? 'Make this person a regular member' : 'Give admin access'}">${m.role === 'admin' ? 'Remove admin' : 'Make admin'}</button>
          <button class="icon-btn" data-edit="${m.email}" aria-label="Edit">${icon('edit')}</button>
          <button class="icon-btn" data-del="${m.email}" aria-label="Remove from roster">${icon('trash')}</button>
        </div></td>
      </tr>`;
  };

  return {
    html: html`
      <div class="admin-head row-between">
        <div><h1 class="title-lg">Members and admins</h1><p class="muted">Anyone on this roster can sign in with their college email. Admins can manage everything on this page and the rest of the console.</p></div>
        <button class="btn btn-primary" id="add-member">${icon('plus')} Add member</button>
      </div>
      <div class="filters">
        <div class="tabs" id="m-tabs">${filters.map(([k, label]) => html`<button data-f="${k}" class="${k === 'all' ? 'on' : ''}">${label}</button>`)}</div>
        <div class="search">${icon('search')}<input class="input" id="mq" type="search" placeholder="Search name or email" aria-label="Search roster"></div>
      </div>
      <div class="table-wrap reveal"><table class="table"><thead><tr><th>Person</th><th>Access</th><th>Position</th><th>Added</th><th></th></tr></thead><tbody id="m-body"></tbody></table></div>`,

    after(root) {
      const body = $('#m-body', root);
      function draw() {
        const q = state.q.toLowerCase();
        const shown = list.filter((m) =>
          (state.f === 'all' || (state.f === 'officer' ? m.position : m.role === state.f)) &&
          (!q || `${m.name || ''} ${m.email}`.toLowerCase().includes(q))
        );
        body.innerHTML = shown.length ? shown.map(row).join('') : `<tr><td colspan="5" class="muted" style="text-align:center;padding:40px">No one matches.</td></tr>`;
      }
      draw();

      $('#m-tabs', root).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        state.f = b.dataset.f;
        $$('#m-tabs button', root).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      });
      $('#mq', root).addEventListener('input', debounce((e) => { state.q = e.target.value.trim(); draw(); }, 140));
      $('#add-member', root).addEventListener('click', async () => { if (await editMember(null)) rerender(); });

      body.addEventListener('click', async (e) => {
        const toggle = e.target.closest('[data-toggle]');
        const edit = e.target.closest('[data-edit]');
        const del = e.target.closest('[data-del]');
        try {
          if (edit) {
            if (await editMember(list.find((m) => m.email === edit.dataset.edit))) rerender();
          } else if (toggle) {
            const m = list.find((x) => x.email === toggle.dataset.toggle);
            const making = m.role !== 'admin';
            const self = m.email === session.email;
            const ok = await confirmDialog({
              title: making ? 'Give admin access?' : self ? 'Remove your own admin access?' : 'Remove admin access?',
              message: making ? `${m.name || m.email} will be able to manage members, content and approvals.` : `${m.name || m.email} will stay on the roster as a regular member.`,
              confirmLabel: making ? 'Make admin' : 'Remove admin',
              danger: !making,
            });
            if (ok) { await store.updateMember(m.email, { role: making ? 'admin' : 'member' }); toast(making ? 'Admin added' : 'Admin removed'); rerender(); }
          } else if (del) {
            const m = list.find((x) => x.email === del.dataset.del);
            const ok = await confirmDialog({
              title: 'Remove from the roster?',
              message: `${m.name || m.email} will lose access to the members area. Their pending profile changes are discarded.`,
              confirmLabel: 'Remove',
              danger: true,
            });
            if (ok) { await store.removeMember(m.email); toast('Removed from the roster'); rerender(); }
          }
        } catch (err) { toast(err.message, 'err'); }
      });
    },
  };
}
