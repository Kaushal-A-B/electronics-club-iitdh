import { html, icon, avatar, ago, safeUrl } from '../../util.js';
import { domainName } from '../../domains.js';
import { openForm, toast } from '../../ui.js';

const LABELS = {
  name: 'Name', roll_no: 'Roll number', branch: 'Branch', batch: 'Batch', bio: 'About',
  skills: 'Skills', domains: 'Domains', github: 'GitHub', linkedin: 'LinkedIn', avatar_url: 'Photo',
};

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null) || (!a && !b);

function show(key, v) {
  if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return html`<span class="faint">empty</span>`;
  if (key === 'avatar_url') return safeUrl(v) ? html`<img class="avatar md" src="${safeUrl(v)}" alt="">` : html`<span class="faint">empty</span>`;
  if (key === 'domains') return v.map(domainName).join(', ');
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

export default async function approvals({ store, pending, rerender }) {
  const changeCard = (c) => {
    const keys = Object.keys(c.data).filter((k) => LABELS[k] && !same(c.data[k], c.current[k]));
    return html`
      <article class="card approval reveal" data-id="${c.id}">
        <div class="row" style="gap:14px">${avatar(c.current, 'md')}
          <div><h3>${c.current.name || c.email}</h3><p class="muted small">${c.email} &middot; sent ${ago(c.submitted_at)}</p></div></div>
        ${keys.length
          ? html`<div class="diff">${keys.map((k) => html`<div class="diff-row"><span class="diff-label">${LABELS[k]}</span><span class="diff-old">${show(k, c.current[k])}</span><span class="diff-arrow">${icon('arrow')}</span><span class="diff-new">${show(k, c.data[k])}</span></div>`)}</div>`
          : html`<p class="muted">The values match the current profile, nothing to apply.</p>`}
        <div class="row" style="margin-top:20px"><button class="btn btn-primary btn-sm" data-approve="${c.id}">${icon('check')} Approve</button><button class="btn btn-danger btn-sm" data-reject="${c.id}">${icon('x')} Reject</button></div>
      </article>`;
  };

  return {
    html: html`
      <div class="admin-head"><h1 class="title-lg">Approvals</h1><p class="muted">Profile edits only go live once you approve them. To let a new student in, add their email on the Members and admins page.</p></div>
      <h2 class="title-md" style="margin:8px 0 18px">Profile changes <span class="count-pill">${pending.length}</span></h2>
      <div class="stack" style="gap:18px">${pending.length ? pending.map(changeCard) : html`<div class="empty">${icon('check')}<h3>All caught up</h3><p>No profile changes are waiting.</p></div>`}</div>`,

    after(root) {
      root.addEventListener('click', async (e) => {
        const ap = e.target.closest('[data-approve]');
        const rj = e.target.closest('[data-reject]');
        try {
          if (ap) {
            ap.classList.add('loading');
            await store.reviewChange(ap.dataset.approve, true);
            toast('Profile change approved');
            rerender();
          } else if (rj) {
            const ok = await openForm({
              title: 'Reject this change', size: 'small', submitLabel: 'Reject',
              fields: [{ name: 'note', label: 'Note for the member', type: 'textarea', rows: 3, max: 300, hint: 'Optional, they will see it on their dashboard.' }],
              async onSubmit(v) { await store.reviewChange(rj.dataset.reject, false, v.note); },
            });
            if (ok) { toast('Change rejected'); rerender(); }
          }
        } catch (err) { toast(err.message, 'err'); rerender(); }
      });
    },
  };
}
