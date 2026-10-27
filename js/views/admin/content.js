import { html, icon, safeUrl, fmt, ago, $ } from '../../util.js';
import { domainName } from '../../domains.js';
import { confirmDialog, toast } from '../../ui.js';
import { editProject, editPhoto, uploadPhotos, editEvent, editAnnouncement, editResource } from '../../editors.js';
import { statusBadge } from '../shared.js';

const dom = (s) => (s ? domainName(s) : html`<span class="faint">All</span>`);
const yes = (v) => (v ? html`<span class="badge ok">Yes</span>` : html`<span class="faint">No</span>`);

// one entry per admin section, the table layout is shared
const CONFIG = {
  projects: {
    title: 'Projects', lead: 'Everything listed on the Projects page.', add: 'Add project',
    load: (s) => s.projects(), edit: editProject, remove: (s, r) => s.deleteProject(r.id), name: (r) => r.title,
    cols: [
      ['Project', (r) => html`<b>${r.title}</b><div class="muted small">${r.summary || ''}</div>`],
      ['Domain', (r) => dom(r.domain)],
      ['Status', (r) => statusBadge(r.status)],
      ['Featured', (r) => yes(r.featured)],
      ['Year', (r) => r.year || ''],
    ],
  },
  events: {
    title: 'Events', lead: 'Sessions, talks and build nights.', add: 'Add event',
    load: async (s) => (await s.events()).reverse(), edit: editEvent, remove: (s, r) => s.deleteEvent(r.id), name: (r) => r.title,
    cols: [
      ['Event', (r) => html`<b>${r.title}</b><div class="muted small">${r.location || ''}</div>`],
      ['When', (r) => fmt('long', r.starts_at)],
      ['Domain', (r) => dom(r.domain)],
      ['RSVP', (r) => yes(r.rsvp_open)],
    ],
  },
  announcements: {
    title: 'Announcements', lead: 'Notices shown to members only.', add: 'New announcement',
    load: (s) => s.announcements(), edit: editAnnouncement, remove: (s, r) => s.deleteAnnouncement(r.id), name: (r) => r.title,
    cols: [
      ['Title', (r) => html`<b>${r.title}</b><div class="muted small clamp">${r.body}</div>`],
      ['Pinned', (r) => yes(r.pinned)],
      ['Posted', (r) => ago(r.created_at)],
    ],
  },
  resources: {
    title: 'Resources', lead: 'The members only library.', add: 'Add resource',
    load: (s) => s.resources(), edit: editResource, remove: (s, r) => s.deleteResource(r.id), name: (r) => r.title,
    cols: [
      ['Resource', (r) => html`<b>${r.title}</b><div class="muted small">${r.description || ''}</div>`],
      ['Type', (r) => r.kind],
      ['Domain', (r) => dom(r.domain)],
      ['Link', (r) => (safeUrl(r.url) ? html`<a href="${safeUrl(r.url)}" target="_blank" rel="noopener" style="color:var(--cyan)">Open</a>` : '')],
    ],
  },
};

async function gallerySection({ store, rerender }) {
  const photos = await store.photos();
  const albums = [...new Set(photos.map((p) => p.album).filter(Boolean))];
  return {
    html: html`
      <div class="admin-head row-between">
        <div><h1 class="title-lg">Photo catalog</h1><p class="muted">${photos.length} photos in ${albums.length} ${albums.length === 1 ? 'album' : 'albums'}. Changes appear on the public gallery straight away.</p></div>
        <button class="btn btn-primary" id="up">${icon('upload')} Upload photos</button>
      </div>
      ${photos.length
        ? html`<div class="admin-photos">${photos.map((p) => html`
            <figure class="admin-photo reveal">
              <img src="${safeUrl(p.url)}" alt="${p.caption || ''}" loading="lazy">
              <figcaption><b>${p.caption || 'Untitled'}</b><small>${p.album || ''}</small></figcaption>
              <div class="photo-actions"><button class="icon-btn" data-edit="${p.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-del="${p.id}" aria-label="Delete">${icon('trash')}</button></div>
            </figure>`)}</div>`
        : html`<div class="empty">${icon('image')}<h3>The catalog is empty</h3><p>Upload the first batch of photos.</p></div>`}`,
    after(root) {
      $('#up', root).addEventListener('click', async () => { if (await uploadPhotos(albums)) rerender(); });
      root.addEventListener('click', async (e) => {
        const ed = e.target.closest('[data-edit]');
        const del = e.target.closest('[data-del]');
        try {
          if (ed) { if (await editPhoto(photos.find((p) => p.id === ed.dataset.edit), albums)) rerender(); }
          else if (del) {
            const p = photos.find((x) => x.id === del.dataset.del);
            if (await confirmDialog({ title: 'Delete this photo?', message: 'It will be removed from the gallery for everyone.', confirmLabel: 'Delete', danger: true })) {
              await store.deletePhoto(p); toast('Photo deleted'); rerender();
            }
          }
        } catch (err) { toast(err.message, 'err'); }
      });
    },
  };
}

export default async function content(ctx) {
  const { store, section, rerender } = ctx;
  if (section === 'gallery') return gallerySection(ctx);
  const cfg = CONFIG[section];
  const rows = await cfg.load(store);

  return {
    html: html`
      <div class="admin-head row-between">
        <div><h1 class="title-lg">${cfg.title}</h1><p class="muted">${cfg.lead}</p></div>
        <button class="btn btn-primary" id="add">${icon('plus')} ${cfg.add}</button>
      </div>
      ${rows.length
        ? html`<div class="table-wrap reveal"><table class="table"><thead><tr>${cfg.cols.map(([h]) => html`<th>${h}</th>`)}<th></th></tr></thead><tbody>
            ${rows.map((r, i) => html`<tr>${cfg.cols.map(([, cell]) => html`<td>${cell(r)}</td>`)}<td><div class="actions"><button class="icon-btn" data-edit="${i}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-del="${i}" aria-label="Delete">${icon('trash')}</button></div></td></tr>`)}
          </tbody></table></div>`
        : html`<div class="empty">${icon('folder')}<h3>Nothing here yet</h3><p>Use the button above to add the first entry.</p></div>`}`,
    after(root) {
      $('#add', root).addEventListener('click', async () => { if (await cfg.edit(null)) rerender(); });
      root.addEventListener('click', async (e) => {
        const ed = e.target.closest('[data-edit]');
        const del = e.target.closest('[data-del]');
        try {
          if (ed) { if (await cfg.edit(rows[Number(ed.dataset.edit)])) rerender(); }
          else if (del) {
            const r = rows[Number(del.dataset.del)];
            if (await confirmDialog({ title: 'Delete this entry?', message: `"${cfg.name(r)}" will be removed for everyone.`, confirmLabel: 'Delete', danger: true })) {
              await cfg.remove(store, r); toast('Deleted'); rerender();
            }
          }
        } catch (err) { toast(err.message, 'err'); }
      });
    },
  };
}
