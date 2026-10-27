import { html, icon, safeUrl, $, $$ } from '../util.js';
import { openLightbox, observeReveals, confirmDialog, toast } from '../ui.js';
import { editPhoto, uploadPhotos } from '../editors.js';
import { pageHeader } from './shared.js';

export default async function gallery({ store, role, rerender }) {
  const photos = await store.photos();
  const admin = role === 'admin';
  const albums = [...new Set(photos.map((p) => p.album).filter(Boolean))];
  let current = '';

  const add = admin ? html`<button class="btn btn-primary" id="upload">${icon('upload')} Upload photos</button>` : '';

  return {
    title: 'Gallery',
    html: html`
      ${pageHeader('Gallery', 'Life at the bench', 'Workshops, build nights, talks and the occasional smoke test.', add)}
      <section class="wrap" style="padding-bottom:96px">
        ${albums.length > 1 ? html`<div class="filters"><div class="tabs" id="album-tabs"><button data-a="" class="on">All photos</button>${albums.map((a) => html`<button data-a="${a}">${a}</button>`)}</div></div>` : ''}
        <div class="masonry" id="wall"></div>
      </section>`,
    after(root) {
      const wall = $('#wall', root);
      const shown = () => photos.filter((p) => !current || p.album === current);

      function draw() {
        const list = shown();
        wall.innerHTML = list.length
          ? list.map((p, i) => html`<figure class="tile reveal" data-i="${i}"><img src="${safeUrl(p.url)}" alt="${p.caption || ''}" loading="lazy"><figcaption><b>${p.caption || ''}</b><small>${p.album || ''}</small></figcaption></figure>`).join('')
          : html`<div class="empty" style="column-span:all">${icon('image')}<h3>No photos here yet</h3><p>${admin ? 'Use Upload photos to add some.' : 'Photos from club events will appear here.'}</p></div>`.s;
        observeReveals(wall);
      }
      draw();

      const tools = admin
        ? {
            async onEdit(p) { if (await editPhoto(p, albums)) rerender(); },
            async onDelete(p) {
              if (!(await confirmDialog({ title: 'Delete this photo?', message: 'It will be removed from the gallery for everyone.', confirmLabel: 'Delete', danger: true }))) return;
              try { await store.deletePhoto(p); toast('Photo deleted'); rerender(); } catch (err) { toast(err.message, 'err'); }
            },
          }
        : null;

      wall.addEventListener('click', (e) => {
        const t = e.target.closest('.tile');
        if (t) openLightbox(shown(), Number(t.dataset.i), tools);
      });
      $('#album-tabs', root)?.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        current = b.dataset.a;
        $$('#album-tabs button', root).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      });
      $('#upload', root)?.addEventListener('click', async () => { if (await uploadPhotos(albums)) rerender(); });
    },
  };
}
