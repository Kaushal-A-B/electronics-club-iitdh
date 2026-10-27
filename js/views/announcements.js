import { html, icon, ago, fmt, $ } from '../util.js';
import { confirmDialog, toast } from '../ui.js';
import { editAnnouncement } from '../editors.js';
import { appHeader } from './shared.js';

export default async function announcements({ store, role, rerender }) {
  const list = await store.announcements();
  const admin = role === 'admin';

  return {
    title: 'Announcements',
    html: html`
      ${appHeader('/app/announcements', 'Announcements', 'Notices for members. Public visitors never see this page.', admin ? html`<button class="btn btn-primary btn-sm" id="new-ann">${icon('plus')} New announcement</button>` : '')}
      <section class="wrap wrap-narrow" style="padding-bottom:96px">
        <div class="stack" style="gap:18px" id="ann">
          ${list.length
            ? list.map((a) => html`
              <article class="card ann reveal" data-id="${a.id}">
                <div class="row" style="gap:10px">${a.pinned ? html`<span class="badge info">${icon('pin')} Pinned</span>` : ''}<span class="faint small" title="${fmt('date', a.created_at)}">${ago(a.created_at)}</span><span class="spacer"></span>
                  ${admin ? html`<button class="icon-btn" data-edit="${a.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-del="${a.id}" aria-label="Delete">${icon('trash')}</button>` : ''}</div>
                <h3>${a.title}</h3>
                <p class="ann-body">${a.body}</p>
              </article>`)
            : html`<div class="empty">${icon('bell')}<h3>No announcements</h3><p>${admin ? 'Post the first one with the button above.' : 'Notices from the admins will appear here.'}</p></div>`}
        </div>
      </section>`,
    after(root) {
      if (!admin) return;
      $('#new-ann', root).addEventListener('click', async () => { if (await editAnnouncement(null)) rerender(); });
      $('#ann', root).addEventListener('click', async (e) => {
        const ed = e.target.closest('[data-edit]');
        const del = e.target.closest('[data-del]');
        if (ed) { if (await editAnnouncement(list.find((a) => a.id === ed.dataset.edit))) rerender(); }
        else if (del) {
          if (await confirmDialog({ title: 'Delete announcement?', message: 'Members will no longer see it.', confirmLabel: 'Delete', danger: true })) {
            try { await store.deleteAnnouncement(del.dataset.del); toast('Announcement deleted'); rerender(); } catch (err) { toast(err.message, 'err'); }
          }
        }
      });
    },
  };
}
