import { html, icon, avatar, safeUrl, ago, fromEmail, splitList, $ } from '../util.js';
import { DOMAINS, BRANCHES, domainName } from '../domains.js';
import { toast } from '../ui.js';
import { appHeader } from './shared.js';

const EDITABLE = ['name', 'roll_no', 'branch', 'batch', 'bio', 'skills', 'domains', 'github', 'linkedin', 'avatar_url'];

export default async function profile({ store, session, member, rerender }) {
  const change = await store.myChange();
  const pending = change?.status === 'pending' ? change : null;
  const derived = fromEmail(session.email);

  // what the form starts from: the waiting request if there is one, else the approved profile
  const base = { ...member, ...(pending ? pending.data : {}) };
  const val = { roll_no: derived.roll, batch: derived.batch, ...Object.fromEntries(Object.entries(base).filter(([, v]) => v !== null && v !== '')) };
  const picked = new Set(val.domains || []);

  return {
    title: 'My profile',
    html: html`
      ${appHeader('/app/profile', 'My profile', 'Your public club details. Every change is reviewed by an admin before it shows up for others.')}
      <section class="wrap profile-layout">
        <form class="card profile-form reveal" id="pf" novalidate>
          ${pending ? html`<div class="notice warn" style="margin-bottom:22px">${icon('clock')}<div><b>Waiting for approval.</b> You sent changes ${ago(pending.submitted_at)}. The form shows what you submitted. Sending again replaces that request.</div></div>` : ''}
          ${change?.status === 'rejected' ? html`<div class="notice bad" style="margin-bottom:22px">${icon('alert')}<div><b>Your last change was not approved.</b>${change.note ? html` Admin note: ${change.note}` : ''} The form shows your approved profile.</div></div>` : ''}

          <div class="field full" style="margin-bottom:22px">
            <span class="label">Photo</span>
            <label class="upload"><span id="pf-prev">${avatar({ name: val.name || session.email, avatar_url: val.avatar_url }, 'md')}</span>
              <div><b id="pf-fname">${val.avatar_url ? 'Replace photo' : 'Add a photo'}</b><br><small>A clear, square-ish face photo works best.</small></div>
              <input type="file" id="pf-file" accept="image/*"></label>
          </div>

          <div class="form-grid">
            <div class="field"><label for="pf-name">Full name <span class="req">*</span></label><input class="input" id="pf-name" required maxlength="80" value="${val.name || ''}"></div>
            <div class="field"><label for="pf-email">College email</label><input class="input" id="pf-email" readonly value="${session.email}"></div>
            <div class="field"><label for="pf-roll">Roll number</label><input class="input" id="pf-roll" maxlength="20" value="${val.roll_no || ''}"></div>
            <div class="field"><label for="pf-batch">Batch (joining year)</label><input class="input" id="pf-batch" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" value="${val.batch || ''}"></div>
            <div class="field full"><label for="pf-branch">Branch</label>
              <select class="select" id="pf-branch"><option value="">Select</option>${BRANCHES.map((b) => html`<option ${b === val.branch ? 'selected' : ''}>${b}</option>`)}</select></div>
            <div class="field full"><label for="pf-bio">About you</label><textarea class="textarea" id="pf-bio" rows="4" maxlength="280" placeholder="A line or two. What do you like building?">${val.bio || ''}</textarea><span class="hint" id="pf-count"></span></div>
            <div class="field full"><span class="label">Domains you are into</span>
              <div class="chip-pick">${DOMAINS.map((d) => html`<label><input type="checkbox" name="domains" value="${d.slug}" ${picked.has(d.slug) ? 'checked' : ''}>${d.name}</label>`)}</div></div>
            <div class="field full"><label for="pf-skills">Skills and tools</label><input class="input" id="pf-skills" value="${(val.skills || []).join(', ')}" placeholder="Verilog, KiCad, MATLAB"><span class="hint">Comma separated.</span></div>
            <div class="field"><label for="pf-gh">GitHub</label><input class="input" id="pf-gh" type="url" placeholder="https://github.com/you" value="${val.github || ''}"></div>
            <div class="field"><label for="pf-li">LinkedIn</label><input class="input" id="pf-li" type="url" placeholder="https://linkedin.com/in/you" value="${val.linkedin || ''}"></div>
          </div>
          <div class="row" style="margin-top:28px"><button class="btn btn-primary" type="submit">Send for approval ${icon('arrow')}</button><span class="muted small">Nothing changes publicly until an admin approves it.</span></div>
        </form>

        <aside class="stack reveal" data-delay="1">
          <div class="card">
            <h4 class="mini-title">Currently approved</h4>
            <div class="row" style="gap:14px;margin:12px 0">${avatar(member || {}, 'md')}<div><b>${member?.name || 'Not set yet'}</b><p class="muted small">${member?.branch || ''}${member?.batch ? ' · ' + member.batch : ''}</p></div></div>
            ${member?.bio ? html`<p class="muted small">${member.bio}</p>` : ''}
            ${(member?.domains || []).length ? html`<div class="tags" style="margin-top:12px">${member.domains.map((d) => html`<span class="tag dom d-${d}">${domainName(d)}</span>`)}</div>` : ''}
          </div>
          <div class="card">
            <h4 class="mini-title">Set by admins</h4>
            <ul class="plain small" style="margin-top:10px">
              <li>Access: <b>${member?.role === 'admin' ? 'Admin' : 'Member'}</b></li>
              <li>Position: <b>${member?.position ? (member.position === 'Lead' ? domainName(member.lead_domain) + ' Lead' : member.position) : 'None'}</b></li>
            </ul>
            <p class="faint small" style="margin-top:12px">These can only be changed by an admin.</p>
          </div>
        </aside>
      </section>`,

    after(root) {
      const bio = $('#pf-bio', root);
      const count = $('#pf-count', root);
      const upd = () => { count.textContent = `${bio.value.length} / 280`; };
      bio.addEventListener('input', upd); upd();

      let file = null;
      $('#pf-file', root).addEventListener('change', (e) => {
        file = e.target.files[0] || null;
        if (!file) return;
        $('#pf-prev', root).innerHTML = `<img class="avatar md" src="${URL.createObjectURL(file)}" alt="">`;
        $('#pf-fname', root).textContent = file.name;
      });

      $('#pf', root).addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form.reportValidity()) return;
        const text = (id) => $(id, root).value.trim() || null;
        const data = {
          name: text('#pf-name'),
          roll_no: text('#pf-roll'),
          batch: text('#pf-batch'),
          branch: text('#pf-branch'),
          bio: text('#pf-bio'),
          domains: [...form.querySelectorAll('[name=domains]:checked')].map((c) => c.value),
          skills: splitList($('#pf-skills', root).value),
          github: text('#pf-gh'),
          linkedin: text('#pf-li'),
          avatar_url: val.avatar_url || null,
        };
        const norm = (o) => JSON.stringify(EDITABLE.map((k) => (Array.isArray(o[k]) ? o[k] : o[k] || null)));
        if (!file && norm(data) === norm({ roll_no: derived.roll, batch: derived.batch, ...base }) && !pending) {
          toast('Nothing has changed yet', 'err');
          return;
        }
        const btn = $('button[type=submit]', root);
        btn.classList.add('loading');
        try {
          if (file) data.avatar_url = await store.uploadImage(file, 'avatars');
          await store.submitProfile(data);
          toast('Sent to the admins for approval');
          rerender();
        } catch (err) {
          toast(err.message, 'err');
          btn.classList.remove('loading');
        }
      });
    },
  };
}
