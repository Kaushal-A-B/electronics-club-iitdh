import { html, icon, logoMark, safeUrl, fmt } from '../util.js';
import { DOMAINS } from '../domains.js';
import { config } from '../config.js';
import { startCircuit } from '../fx/circuit.js';
import { openLightbox } from '../ui.js';
import { projectCard, eventDate } from './shared.js';

const TOOLS = ['Verilog', 'SPICE', 'STM32', 'GNU Radio', 'KiCad', 'Vivado', 'FreeRTOS', 'MATLAB', 'ESP32', 'Cadence', 'LoRa', 'OpenLane', 'RTL-SDR', 'LTspice', 'Zephyr', 'SystemVerilog'];

export default async function home({ store, session, role }) {
  const [stats, projects, events, photos] = await Promise.all([store.stats(), store.projects(), store.events(), store.photos()]);
  const now = Date.now();
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const showcase = featured.length ? featured : projects.slice(0, 3);
  const upcoming = events.filter((e) => new Date(e.ends_at || e.starts_at).getTime() >= now).slice(0, 3);
  const strip = (photos.filter((p) => p.featured).length >= 4 ? photos.filter((p) => p.featured) : photos).slice(0, 6);

  const tiles = [
    [stats.members, 'Members', ''],
    [stats.projects, 'Projects built', ''],
    [stats.events, 'Sessions run', ''],
    [4, 'Domains', ''],
  ];

  const page = html`
    <section class="hero">
      <canvas class="hero-canvas" aria-hidden="true"></canvas>
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <span class="eyebrow rise" style="--i:0">${config.college} &middot; student club</span>
          <h1 class="title-xl hero-title">
            <span class="rise" style="--i:1">We design</span>
            <span class="rise grad-text" style="--i:2">chips,</span>
            <span class="rise" style="--i:3">program boards</span>
            <span class="rise" style="--i:4">and chase <span class="grad-text">signals.</span></span>
          </h1>
          <p class="lead rise" style="--i:5">Four domains, one lab bench and a steady supply of half soldered ideas. Come and build something with us.</p>
          <div class="row row-wrap rise" style="--i:6;margin-top:10px">
            <a class="btn btn-primary" href="#/projects">See what we build ${icon('arrow')}</a>
            ${role ? html`<a class="btn btn-ghost" href="#/app">Members area</a>` : html`<a class="btn btn-ghost" href="#/join">Join the club</a>`}
          </div>
        </div>
        <div class="hero-art rise" style="--i:3" aria-hidden="true">
          <div class="orbit o1"></div><div class="orbit o2"></div>
          ${logoMark('hero-mark')}
          <span class="float-tag f1">Verilog</span>
          <span class="float-tag f2">SPICE</span>
          <span class="float-tag f3">STM32</span>
          <span class="float-tag f4">SDR</span>
        </div>
      </div>
      <div class="wrap">
        <div class="stats">
          ${tiles.map(([n, label], i) => html`<div class="stat reveal" data-delay="${i + 1}"><b data-count="${n}">0</b><span>${label}</span></div>`)}
        </div>
      </div>
    </section>

    <div class="marquee" aria-hidden="true"><div class="marquee-track">${[...TOOLS, ...TOOLS].map((t) => html`<span>${t}</span>`)}</div></div>

    <section class="section">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="eyebrow">What we do</span>
          <h2 class="title-lg">Four domains.<br><span class="grad-text">Pick one or try them all.</span></h2>
        </div>
        <div class="grid grid-4">
          ${DOMAINS.map((d, i) => html`
            <a href="#/domains?d=${d.slug}" class="card spot lift domain-card d-${d.slug} reveal" data-delay="${i + 1}">
              <span class="d-icon">${icon(d.icon)}</span>
              <h3>${d.name}</h3>
              <p class="muted">${d.summary}</p>
              <span class="more">Learn more ${icon('arrow')}</span>
            </a>`)}
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap">
        <div class="section-head row reveal">
          <div class="stack" style="gap:16px"><span class="eyebrow">Projects</span><h2 class="title-lg">Recent work from the lab</h2></div>
          <a class="btn btn-ghost btn-sm" href="#/projects">All projects ${icon('arrow')}</a>
        </div>
        ${showcase.length
          ? html`<div class="grid grid-3">${showcase.map((p) => projectCard(p))}</div>`
          : html`<div class="empty">${icon('folder')}<h3>Projects will show up here</h3><p>Admins can add the first one from the Projects page.</p></div>`}
      </div>
    </section>

    <section class="section">
      <div class="wrap two-col">
        <div>
          <div class="section-head reveal"><span class="eyebrow">Coming up</span><h2 class="title-lg">Next on the calendar</h2></div>
          <div class="stack">
            ${upcoming.length
              ? upcoming.map((e) => html`
                <a class="mini-event card spot reveal ${e.domain ? 'd-' + e.domain : ''}" href="#/events">
                  ${eventDate(e)}
                  <div><h4>${e.title}</h4><p class="muted">${fmt('long', e.starts_at)}${e.location ? ' · ' + e.location : ''}</p></div>
                  ${icon('arrow')}
                </a>`)
              : html`<div class="empty">${icon('calendar')}<h3>Nothing scheduled right now</h3><p>New sessions are announced here first.</p></div>`}
          </div>
          <a class="btn btn-ghost btn-sm" href="#/events" style="margin-top:22px">Full calendar ${icon('arrow')}</a>
        </div>
        <div>
          <div class="section-head reveal"><span class="eyebrow">Gallery</span><h2 class="title-lg">Around the bench</h2></div>
          ${strip.length
            ? html`<div class="photo-strip">${strip.map((p, i) => html`<button class="strip-item reveal" data-delay="${(i % 3) + 1}" data-photo="${i}"><img src="${safeUrl(p.url)}" alt="${p.caption || ''}" loading="lazy"></button>`)}</div>
                   <a class="btn btn-ghost btn-sm" href="#/gallery" style="margin-top:22px">Open gallery ${icon('arrow')}</a>`
            : html`<div class="empty">${icon('image')}<h3>No photos yet</h3><p>The gallery fills up as the club does things.</p></div>`}
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta reveal">
          <div class="cta-copy">
            <h2 class="title-lg">Part of ${config.college}? Come build with us.</h2>
            <p class="lead">Ask an admin to add your college email, then sign in. Members get the resources library, the directory and first call on lab time.</p>
          </div>
          <div class="row row-wrap">
            ${role ? html`<a class="btn btn-primary" href="#/app">Open dashboard ${icon('arrow')}</a>` : html`<a class="btn btn-primary" href="#/signin">Sign in ${icon('arrow')}</a><a class="btn btn-ghost" href="#/join">How joining works</a>`}
          </div>
        </div>
      </div>
    </section>`;

  return {
    title: '',
    html: page,
    after(root) {
      const fx = startCircuit(root.querySelector('.hero-canvas'));
      const onTheme = () => fx.redraw();
      document.addEventListener('themechange', onTheme);
      root.querySelectorAll('[data-photo]').forEach((b) =>
        b.addEventListener('click', () => openLightbox(strip, Number(b.dataset.photo)))
      );
      const hero = root.querySelector('.hero');
      const move = (e) => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--hx', `${e.clientX - r.left}px`);
        hero.style.setProperty('--hy', `${e.clientY - r.top}px`);
      };
      hero.addEventListener('pointermove', move);
      return () => { fx.stop(); document.removeEventListener('themechange', onTheme); };
    },
  };
}
