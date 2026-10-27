// tiny html templating: interpolated values are escaped unless wrapped in raw()
class Safe {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => (s instanceof Safe ? s : new Safe(s));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

function part(v) {
  if (v instanceof Safe) return v.s;
  if (Array.isArray(v)) return v.map(part).join('');
  if (v === null || v === undefined || v === false) return '';
  return esc(v);
}

export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += part(vals[i]) + strings[i + 1];
  return new Safe(out);
}

export const setHtml = (el, safe) => { el.innerHTML = safe instanceof Safe ? safe.s : String(safe); };

// only let http(s) and mailto links through, user supplied urls end up in href/src
export function safeUrl(u) {
  if (!u) return '';
  const s = String(u).trim();
  if (/^(https?:\/\/|mailto:|data:image\/)/i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(s)) return 'https://' + s;
  return '';
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const debounce = (fn, ms = 200) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

const ICONS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  logout: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  calendar: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
  image: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM21 15l-5-5L5 21',
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5ZM4 19.5V21h16',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  pin: 'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  github: 'M9 19c-4 1.5-4-2-6-2m12 4v-3.9a3.4 3.4 0 0 0-1-2.6c3.1-.3 6.4-1.5 6.4-6.9a5.4 5.4 0 0 0-1.5-3.8 5 5 0 0 0-.1-3.7s-1.2-.4-3.9 1.4a13.4 13.4 0 0 0-7 0C6.2 2.5 5 2.9 5 2.9a5 5 0 0 0-.1 3.7A5.4 5.4 0 0 0 3.5 10.4c0 5.4 3.3 6.6 6.4 6.9a3.4 3.4 0 0 0-1 2.6V21',
  linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  mail: 'M3 5h18v14H3zM3 7l9 6 9-6',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  external: 'M18 13v6H5V6h6M15 3h6v6M10 14 21 3',
  chip: 'M6 6h12v12H6zM9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
  wave: 'M2 12c2-8 4-8 6 0s4 8 6 0 4-8 6 0',
  board: 'M4 4h16v16H4zM8 8h3v3H8zM13 13h3v3h-3zM11 9.5h2.5V13M9.5 11v5H13',
  antenna: 'M12 12v9M8 21h8M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  star: 'M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9Z',
  dash: 'M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v7H2v-7Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  alert: 'M12 3 2 20h20ZM12 10v4M12 17h.01',
};

export function icon(name, cls = '') {
  const d = ICONS[name] || ICONS.info;
  return raw(
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`
  );
}

// the club mark, redrawn as svg so it stays sharp and sits on any background
export function logoMark(cls = '') {
  return raw(`<svg class="${cls}" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <g stroke="url(#lg)" stroke-width="2.4" stroke-linecap="round">
      <path d="M23 15V9M32 15V8M41 15V9M23 49v6M32 49v7M41 49v6M15 23H9M15 32H8M15 41H9M49 23h6M49 32h7M49 41h6"/>
    </g>
    <g stroke="url(#lg)" stroke-width="2"><circle cx="23" cy="7" r="2"/><circle cx="32" cy="6" r="2"/><circle cx="41" cy="7" r="2"/><circle cx="23" cy="57" r="2"/><circle cx="32" cy="58" r="2"/><circle cx="41" cy="57" r="2"/><circle cx="7" cy="23" r="2"/><circle cx="6" cy="32" r="2"/><circle cx="7" cy="41" r="2"/><circle cx="57" cy="23" r="2"/><circle cx="58" cy="32" r="2"/><circle cx="57" cy="41" r="2"/></g>
    <rect x="15" y="15" width="34" height="34" rx="6" stroke="url(#lg)" stroke-width="3"/>
    <rect x="20.5" y="20.5" width="23" height="23" rx="3" fill="url(#lg)" opacity=".92"/>
    <path class="mark-wave" pathLength="100" d="M22 32c3-9 5-9 7.5 0s4.5 9 7.5 0c1.4-4 2.6-6 5-6" stroke="#05121a" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  </svg>`);
}

export const initials = (name = '', fallback = '?') => {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  if (!p.length) return fallback;
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
};

export function avatar(person, size = '') {
  const name = person?.name || person?.email || '';
  const url = safeUrl(person?.avatar_url);
  if (url) return html`<img class="avatar ${size}" src="${url}" alt="${name}" loading="lazy" />`;
  return html`<span class="avatar ${size}" aria-hidden="true">${initials(name || person?.email?.[0])}</span>`;
}

// ee23bt041@iitdh.ac.in -> { roll: 'EE23BT041', batch: '2023' }
export function fromEmail(email = '') {
  const local = email.split('@')[0] || '';
  const m = local.match(/^[a-z]{2,4}(\d{2})[a-z]{2}\d{2,4}$/i);
  return { roll: m ? local.toUpperCase() : '', batch: m ? '20' + m[1] : '' };
}

const dtf = {
  date: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  day: new Intl.DateTimeFormat('en-IN', { day: 'numeric' }),
  mon: new Intl.DateTimeFormat('en-IN', { month: 'short' }),
  time: new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
  long: new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true }),
};
export const fmt = (kind, v) => (v ? dtf[kind].format(new Date(v)) : '');

export function ago(v) {
  const s = Math.max(1, Math.round((Date.now() - new Date(v).getTime()) / 1000));
  const steps = [[60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.345, 'week'], [12, 'month'], [Infinity, 'year']];
  let n = s;
  for (const [div, unit] of steps) {
    if (n < div) return `${Math.floor(n)} ${unit}${Math.floor(n) === 1 ? '' : 's'} ago`;
    n /= div;
  }
  return '';
}

export const toLocalInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Math.random().toString(36).slice(2) + Date.now().toString(36));

// shrink a picked image in the browser before upload, keeps the gallery light
export function resizeImage(file, maxDim = 1600, quality = 0.84) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process that image'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not a readable image')); };
    img.src = url;
  });
}

export const blobToDataUrl = (blob) =>
  new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });

export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export const splitList = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
