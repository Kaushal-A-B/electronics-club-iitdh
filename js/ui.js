import { html, raw, esc, icon, $, $$, splitList, safeUrl, toLocalInput } from './util.js';

/* ---------- toasts ---------- */
export function toast(message, kind = 'ok') {
  let box = $('.toasts');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toasts';
    box.setAttribute('aria-live', 'polite');
    document.body.append(box);
  }
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.innerHTML = `${icon(kind === 'ok' ? 'check' : 'alert')}<span>${esc(message)}</span>`;
  box.append(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, kind === 'ok' ? 3200 : 5200);
}

/* ---------- modal ---------- */
export function openModal({ title, body, footer, size = '', onMount }) {
  const dlg = document.createElement('dialog');
  dlg.className = `modal ${size}`;
  dlg.innerHTML = `
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">${icon('x')}</button></div>
    <div class="modal-body">${body}</div>
    ${footer ? `<div class="modal-foot">${footer}</div>` : ''}`;
  document.body.append(dlg);
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
  });
  dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 200));
  dlg.showModal();
  onMount?.(dlg);
  return dlg;
}

export function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    let answer = false;
    const dlg = openModal({
      title,
      size: 'small',
      body: `<p class="muted">${esc(message)}</p>`,
      footer: `<button class="btn btn-ghost btn-sm" data-close>Cancel</button>
               <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-yes>${esc(confirmLabel)}</button>`,
    });
    $('[data-yes]', dlg).addEventListener('click', () => { answer = true; dlg.close(); });
    dlg.addEventListener('close', () => resolve(answer));
  });
}

/* ---------- generic form dialog ---------- */
function fieldHtml(f, v) {
  if (f.type === 'heading') return html`<h4 class="mini-title form-section">${f.label}</h4>`;
  const id = `f_${f.name}`;
  const req = f.required ? raw('<span class="req">*</span>') : '';
  const hint = f.hint ? html`<span class="hint">${f.hint}</span>` : '';
  const cls = f.full || f.type === 'textarea' || f.type === 'chips' || f.type === 'image' ? 'field full' : 'field';
  const ro = f.readonly ? 'readonly' : '';
  let control;

  switch (f.type) {
    case 'textarea':
      control = html`<textarea class="textarea" id="${id}" name="${f.name}" rows="${f.rows || 5}" maxlength="${f.max || 4000}" placeholder="${f.placeholder || ''}" ${raw(f.required ? 'required' : '')}>${v ?? ''}</textarea>`;
      break;
    case 'select': {
      const opts = (f.options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
      control = html`<select class="select" id="${id}" name="${f.name}" ${raw(f.required ? 'required' : '')}>
        ${f.required ? '' : html`<option value="">${f.blank || 'None'}</option>`}
        ${opts.map((o) => html`<option value="${o.value}" ${raw(String(o.value) === String(v ?? '') ? 'selected' : '')}>${o.label}</option>`)}
      </select>`;
      break;
    }
    case 'chips': {
      const opts = (f.options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
      const picked = new Set(v || []);
      control = html`<div class="chip-pick">${opts.map((o) => html`<label><input type="checkbox" name="${f.name}" value="${o.value}" ${raw(picked.has(o.value) ? 'checked' : '')}>${o.label}</label>`)}</div>`;
      break;
    }
    case 'switch':
      return html`<div class="field"><label class="switch"><input type="checkbox" name="${f.name}" ${raw(v ? 'checked' : '')}><span>${f.label}</span></label>${hint}</div>`;
    case 'image': {
      const url = typeof v === 'string' ? safeUrl(v) : '';
      control = html`<div class="upload-wrap">
        <label class="upload">
          ${url ? html`<img src="${url}" alt="" data-preview>` : html`<span class="ph" data-preview>${icon('image')}</span>`}
          <div><b data-fname>${url ? 'Replace image' : 'Choose an image'}</b><br><small>JPG or PNG, resized in your browser</small></div>
          <input type="file" accept="image/*" name="${f.name}">
        </label>
        ${url ? html`<button type="button" class="btn btn-ghost btn-sm" data-clear="${f.name}" style="margin-top:8px">Remove image</button>` : ''}
      </div>`;
      break;
    }
    case 'datetime':
      control = html`<input class="input" id="${id}" type="datetime-local" name="${f.name}" value="${toLocalInput(v)}" ${raw(f.required ? 'required' : '')}>`;
      break;
    default:
      if (f.type === 'tags' && f.rows) {
        control = html`<textarea class="textarea" id="${id}" name="${f.name}" rows="${f.rows}" maxlength="2000">${Array.isArray(v) ? v.join(', ') : v ?? ''}</textarea>`;
        break;
      }
      control = html`<input class="input" id="${id}" type="${!f.type || f.type === 'tags' ? 'text' : f.type}" name="${f.name}" value="${f.type === 'tags' && Array.isArray(v) ? v.join(', ') : v ?? ''}" maxlength="${f.max || 200}" placeholder="${f.placeholder || ''}" ${raw(f.required ? 'required' : '')} ${raw(ro)} ${f.type === 'number' ? raw('step="any"') : ''}>`;
  }
  return html`<div class="${cls}"><label for="${id}">${f.label}${req}</label>${control}${hint}</div>`;
}

function readForm(form, fields, values) {
  const fd = new FormData(form);
  const out = {};
  for (const f of fields) {
    if (f.type === 'heading') continue;
    switch (f.type) {
      case 'chips': out[f.name] = fd.getAll(f.name); break;
      case 'switch': out[f.name] = fd.get(f.name) === 'on'; break;
      case 'tags': out[f.name] = splitList(fd.get(f.name)); break;
      case 'number': { const n = fd.get(f.name); out[f.name] = n === '' || n === null ? null : Number(n); break; }
      case 'datetime': { const d = fd.get(f.name); out[f.name] = d ? new Date(d).toISOString() : null; break; }
      case 'image': {
        const file = fd.get(f.name);
        if (form.dataset['cleared_' + f.name]) out[f.name] = null;
        else out[f.name] = file && file.size ? file : values[f.name] ?? null;
        break;
      }
      default: {
        const s = fd.get(f.name);
        out[f.name] = s === null || String(s).trim() === '' ? null : String(s).trim();
      }
    }
  }
  return out;
}

export function openForm({ title, fields, values = {}, submitLabel = 'Save', size = '', intro, onSubmit }) {
  return new Promise((resolve) => {
    let saved = false;
    const body = `${intro ? `<p class="muted" style="margin-bottom:22px">${esc(intro)}</p>` : ''}
      <form id="modal-form" class="form-grid" novalidate>${fields.map((f) => fieldHtml(f, values[f.name]).s).join('')}</form>`;
    const dlg = openModal({
      title,
      size,
      body,
      footer: `<button class="btn btn-ghost btn-sm" data-close>Cancel</button><button class="btn btn-primary btn-sm" data-save>${esc(submitLabel)}</button>`,
    });
    const form = $('#modal-form', dlg);
    const btn = $('[data-save]', dlg);

    $$('input[type=file]', form).forEach((inp) => {
      inp.addEventListener('change', () => {
        const file = inp.files[0];
        if (!file) return;
        const wrap = inp.closest('.upload');
        const prev = $('[data-preview]', wrap);
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.dataset.preview = '';
        prev.replaceWith(img);
        $('[data-fname]', wrap).textContent = file.name;
        delete form.dataset['cleared_' + inp.name];
      });
    });
    $$('[data-clear]', form).forEach((b) =>
      b.addEventListener('click', () => {
        form.dataset['cleared_' + b.dataset.clear] = '1';
        const wrap = b.closest('.upload-wrap');
        const prev = $('[data-preview]', wrap);
        const ph = document.createElement('span');
        ph.className = 'ph'; ph.dataset.preview = ''; ph.innerHTML = icon('image').s;
        prev.replaceWith(ph);
        $('input[type=file]', wrap).value = '';
        $('[data-fname]', wrap).textContent = 'Choose an image';
        b.remove();
      })
    );

    async function submit() {
      if (!form.reportValidity()) return;
      btn.classList.add('loading');
      try {
        await onSubmit(readForm(form, fields, values));
        saved = true;
        dlg.close();
      } catch (err) {
        console.error(err);
        toast(err.message || 'Something went wrong', 'err');
      } finally {
        btn.classList.remove('loading');
      }
    }
    btn.addEventListener('click', submit);
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    dlg.addEventListener('close', () => resolve(saved));
  });
}

/* ---------- lightbox ---------- */
export function openLightbox(items, start = 0, tools) {
  let i = start;
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Photo viewer');
  document.body.append(box);
  document.body.style.overflow = 'hidden';

  function draw() {
    const p = items[i];
    box.innerHTML = `
      <figure><img src="${esc(safeUrl(p.url))}" alt="${esc(p.caption || '')}"></figure>
      <div class="cap"><b>${esc(p.caption || 'Untitled')}</b><small>${esc(p.album || '')}${p.taken_on ? ' · ' + esc(p.taken_on) : ''} · ${i + 1} of ${items.length}</small></div>
      <button class="lb-btn lb-close" aria-label="Close">${icon('x')}</button>
      ${items.length > 1 ? `<button class="lb-btn lb-prev" aria-label="Previous">${icon('arrow')}</button><button class="lb-btn lb-next" aria-label="Next">${icon('arrow')}</button>` : ''}
      ${tools ? `<div class="lb-tools"><button class="btn btn-soft btn-sm" data-edit>${icon('edit')} Edit</button><button class="btn btn-danger btn-sm" data-del>${icon('trash')} Delete</button></div>` : ''}`;
  }
  const go = (d) => { i = (i + d + items.length) % items.length; draw(); };
  const close = () => { box.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' && items.length > 1) go(1);
    else if (e.key === 'ArrowLeft' && items.length > 1) go(-1);
  };
  box.addEventListener('click', async (e) => {
    if (e.target.closest('.lb-close') || e.target === box) return close();
    if (e.target.closest('.lb-next')) return go(1);
    if (e.target.closest('.lb-prev')) return go(-1);
    if (e.target.closest('[data-edit]')) { close(); tools.onEdit(items[i]); }
    if (e.target.closest('[data-del]')) { const p = items[i]; close(); tools.onDelete(p); }
  });
  let x0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (x0 === null || items.length < 2) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    x0 = null;
  });
  document.addEventListener('keydown', onKey);
  draw();
}

/* ---------- page effects ---------- */
let revealIO;
export function observeReveals(root = document) {
  if (!revealIO) {
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          revealIO.unobserve(en.target);
          $$('[data-count]', en.target).forEach(countUp);
          if (en.target.matches('[data-count]')) countUp(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  $$('.reveal:not(.in)', root).forEach((el) => revealIO.observe(el));
  $$('[data-count]:not(.reveal)', root).forEach((el) => revealIO.observe(el));
}

function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const end = Number(el.dataset.count) || 0;
  const suffix = el.dataset.suffix || '';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || end === 0) { el.textContent = end + suffix; return; }
  const dur = 1300;
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// cursor spotlight on cards
export function initSpotlight() {
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.spot');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

export function emptyState(iconName, title, text, action = '') {
  return html`<div class="empty">${icon(iconName)}<h3>${title}</h3><p>${text}</p>${raw(action)}</div>`;
}

export function busy(btn, promise) {
  btn.classList.add('loading');
  return Promise.resolve(promise).finally(() => btn.classList.remove('loading'));
}
