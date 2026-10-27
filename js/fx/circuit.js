// animated pcb traces for the hero. traces are drawn once, pulses travel along them.

const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const CELL = 46;

export function startCircuit(canvas) {
  const ctx = canvas.getContext('2d');
  const still = document.createElement('canvas');
  const sctx = still.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0, dpr = 1;
  let paths = [];
  let pulses = [];
  let raf = 0;
  let visible = true;

  const light = () => document.documentElement.dataset.theme === 'light';
  const rand = (a, b) => a + Math.random() * (b - a);

  function makePath() {
    const cols = Math.floor(w / CELL);
    const rows = Math.floor(h / CELL);
    let gx = Math.floor(rand(0, cols));
    let gy = Math.floor(rand(0, rows));
    let d = Math.floor(rand(0, 8)) & 6; // start on a straight axis
    const pts = [[gx * CELL, gy * CELL]];
    const steps = Math.floor(rand(5, 14));
    for (let i = 0; i < steps; i++) {
      if (Math.random() < 0.38) d = (d + (Math.random() < 0.5 ? 1 : 7)) % 8;
      gx += DIRS[d][0]; gy += DIRS[d][1];
      if (gx < 0 || gy < 0 || gx > cols || gy > rows) break;
      pts.push([gx * CELL, gy * CELL]);
    }
    if (pts.length < 3) return null;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    return { pts, cum, total: cum[cum.length - 1] };
  }

  function pointAt(p, dist) {
    if (dist <= 0) return p.pts[0];
    if (dist >= p.total) return p.pts[p.pts.length - 1];
    let i = 1;
    while (p.cum[i] < dist) i++;
    const t = (dist - p.cum[i - 1]) / (p.cum[i] - p.cum[i - 1]);
    const a = p.pts[i - 1], b = p.pts[i];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  function paintStill() {
    still.width = w * dpr; still.height = h * dpr;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.clearRect(0, 0, w, h);
    const base = light() ? '15,143,134' : '52,192,180';
    sctx.lineWidth = 1.2;
    sctx.lineJoin = 'round';
    paths.forEach((p) => {
      sctx.strokeStyle = `rgba(${base},${light() ? 0.16 : 0.1})`;
      sctx.beginPath();
      p.pts.forEach(([x, y], i) => (i ? sctx.lineTo(x, y) : sctx.moveTo(x, y)));
      sctx.stroke();
      [p.pts[0], p.pts[p.pts.length - 1]].forEach(([x, y]) => {
        sctx.beginPath();
        sctx.arc(x, y, 3.2, 0, Math.PI * 2);
        sctx.stroke();
      });
    });
  }

  function build() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    w = rect.width; h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    paths = [];
    const target = Math.round((w * h) / (CELL * CELL * 14));
    for (let tries = 0; paths.length < target && tries < target * 4; tries++) {
      const p = makePath();
      if (p) paths.push(p);
    }
    pulses = paths.filter(() => Math.random() < 0.55).map((p) => ({
      p, pos: rand(-p.total, p.total), speed: rand(70, 150), tail: rand(60, 120), hue: Math.random() < 0.5 ? '75,217,145' : Math.random() < 0.5 ? '52,192,180' : '31,123,232',
    }));
    paintStill();
    draw(0);
  }

  let last = 0;
  function draw(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(still, 0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    pulses.forEach((u) => {
      if (!reduce) u.pos += u.speed * dt;
      if (u.pos - u.tail > u.p.total) { u.pos = rand(-200, -20); u.speed = rand(70, 150); }
      if (u.pos < 0) return;
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = pointAt(u.p, u.pos - (u.tail * i) / n);
        const b = pointAt(u.p, u.pos - (u.tail * (i + 1)) / n);
        ctx.strokeStyle = `rgba(${u.hue},${(1 - i / n) * (light() ? 0.7 : 0.85)})`;
        ctx.lineWidth = 2.2 * (1 - i / (n * 1.4));
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      const head = pointAt(u.p, u.pos);
      ctx.fillStyle = `rgba(${u.hue},0.95)`;
      ctx.shadowColor = `rgba(${u.hue},0.9)`;
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(head[0], head[1], 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function loop(t) {
    if (w && visible && !document.hidden) draw(t);
    raf = requestAnimationFrame(loop);
  }

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  let rt;
  const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(build, 160); });
  ro.observe(canvas);
  build();
  if (!reduce) raf = requestAnimationFrame(loop);

  return {
    redraw() { if (w) { paintStill(); draw(last); } },
    stop() { cancelAnimationFrame(raf); clearTimeout(rt); io.disconnect(); ro.disconnect(); },
  };
}
