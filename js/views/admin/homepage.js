import { html, icon } from '../../util.js';
import { homeContent, lines } from '../../content.js';
import { editHomepage } from '../../editors.js';
import { confirmDialog, toast } from '../../ui.js';

export default async function homepage({ store, rerender }) {
  const saved = await store.content();
  const c = homeContent(saved);
  const edited = Object.keys(saved).filter((k) => k !== 'domain_summaries' && saved[k] != null).length > 0 || Object.keys(saved.domain_summaries || {}).length > 0;

  const row = (label, value) => html`<tr><td class="muted" style="white-space:nowrap">${label}</td><td>${value}</td></tr>`;

  return {
    html: html`
      <div class="admin-head row-between">
        <div><h1 class="title-lg">Homepage text</h1><p class="muted">Change the headline, intro, scrolling tools strip, section headings, domain card text and the closing banner. Changes show on the home page straight away.</p></div>
        <div class="row row-wrap">
          <a class="btn btn-ghost" href="#/" >${icon('arrow')} View homepage</a>
          <button class="btn btn-primary" id="edit-text">${icon('edit')} Edit text</button>
        </div>
      </div>
      <div class="table-wrap reveal"><table class="table"><tbody>
        ${row('Headline', lines(c.title).join(' / '))}
        ${row('Intro', c.lead)}
        ${row('Tools strip', `${c.tools.length} items: ${c.tools.slice(0, 6).join(', ')}${c.tools.length > 6 ? ', ...' : ''}`)}
        ${row('Domains heading', lines(c.domains_title).join(' / '))}
        ${row('Closing banner', c.cta_title)}
      </tbody></table></div>
      <p class="muted small" style="margin-top:14px">${edited ? 'Some text has been customised.' : 'Showing the original text.'}</p>
      ${edited ? html`<button class="btn btn-danger btn-sm" id="reset-text" style="margin-top:8px">Restore the original text</button>` : ''}`,

    after(root) {
      root.querySelector('#edit-text').addEventListener('click', async () => { if (await editHomepage(saved)) rerender(); });
      root.querySelector('#reset-text')?.addEventListener('click', async () => {
        if (!(await confirmDialog({ title: 'Restore the original text?', message: 'Every edit you made to the homepage text is replaced by the original wording.', confirmLabel: 'Restore', danger: true }))) return;
        try { await store.saveContent({}); toast('Original text restored'); rerender(); } catch (err) { toast(err.message, 'err'); }
      });
    },
  };
}
