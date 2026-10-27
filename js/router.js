const table = [];

export function define(pattern, access, loader) {
  const keys = [];
  const rx = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  table.push({ rx, keys, access, loader });
}

export function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function match(path) {
  for (const r of table) {
    const m = path.match(r.rx);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { ...r, params };
    }
  }
  return null;
}

export const go = (to) => { location.hash = to; };

export function link(path, query) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  return `#${path}${qs}`;
}
