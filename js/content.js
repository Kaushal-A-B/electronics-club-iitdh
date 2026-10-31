import { raw, esc } from './util.js';
import { config } from './config.js';
import { DOMAINS } from './domains.js';

// the homepage text as shipped. admins can overwrite any of it from the admin
// console, whatever they leave empty falls back to what is written here.
export const HOME_DEFAULTS = {
  eyebrow: `${config.college} · student club`,
  title: 'We design\n*chips,*\nprogram boards\nand chase *signals.*',
  lead: 'Four domains, one lab bench and a steady supply of half soldered ideas. Come and build something with us.',
  primary_btn: 'See what we build',
  hero_tags: ['Verilog', 'SPICE', 'STM32', 'SDR'],
  tools: ['Verilog', 'SPICE', 'STM32', 'GNU Radio', 'KiCad', 'Vivado', 'FreeRTOS', 'MATLAB', 'ESP32', 'Cadence', 'LoRa', 'OpenLane', 'RTL-SDR', 'LTspice', 'Zephyr', 'SystemVerilog'],
  stat_members: 'Members',
  stat_projects: 'Projects built',
  stat_sessions: 'Sessions run',
  stat_domains: 'Domains',
  domains_eyebrow: 'What we do',
  domains_title: 'Four domains.\n*Pick one or try them all.*',
  domain_summaries: Object.fromEntries(DOMAINS.map((d) => [d.slug, d.summary])),
  projects_eyebrow: 'Projects',
  projects_title: 'Recent work from the lab',
  events_eyebrow: 'Coming up',
  events_title: 'Next on the calendar',
  gallery_eyebrow: 'Gallery',
  gallery_title: 'Around the bench',
  cta_title: `Part of ${config.college}? Come build with us.`,
  cta_text: 'Ask an admin to add your college email, then sign in. Members get the resources library, the directory and first call on lab time.',
};

const filled = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : v != null);

// saved text on top of the defaults, empty values fall back
export function homeContent(saved = {}) {
  const out = { ...HOME_DEFAULTS };
  for (const key of Object.keys(HOME_DEFAULTS)) {
    if (key === 'domain_summaries') {
      out.domain_summaries = { ...HOME_DEFAULTS.domain_summaries };
      for (const [slug, text] of Object.entries(saved.domain_summaries || {})) if (filled(text)) out.domain_summaries[slug] = text;
    } else if (filled(saved[key])) {
      out[key] = saved[key];
    }
  }
  return out;
}

// *word* gets the gradient colour, everything else is escaped
export function accent(text) {
  const parts = String(text ?? '').split('*');
  return raw(parts.map((p, i) => (i % 2 ? `<span class="grad-text">${esc(p)}</span>` : esc(p))).join(''));
}

export const lines = (text) => String(text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);

const stars = 'Put *stars* around words to colour them.';

export function homeFields() {
  return [
    { type: 'heading', label: 'Top of the page' },
    { name: 'eyebrow', label: 'Small line above the headline', max: 80, full: true },
    { name: 'title', label: 'Headline', type: 'textarea', rows: 4, max: 200, hint: `One line per row. ${stars}` },
    { name: 'lead', label: 'Intro text', type: 'textarea', rows: 3, max: 300 },
    { name: 'primary_btn', label: 'Main button text', max: 40 },
    { name: 'hero_tags', label: 'Floating tags beside the logo', type: 'tags', hint: 'Four fit well, comma separated.' },

    { type: 'heading', label: 'Scrolling tools strip' },
    { name: 'tools', label: 'Tools and keywords', type: 'tags', rows: 3, full: true, hint: 'Comma separated. They scroll across the page.' },

    { type: 'heading', label: 'Numbers under the headline' },
    { name: 'stat_members', label: 'Members label', max: 30 },
    { name: 'stat_projects', label: 'Projects label', max: 30 },
    { name: 'stat_sessions', label: 'Sessions label', max: 30 },
    { name: 'stat_domains', label: 'Domains label', max: 30 },

    { type: 'heading', label: 'Domains section' },
    { name: 'domains_eyebrow', label: 'Small line', max: 60 },
    { name: 'domains_title', label: 'Heading', type: 'textarea', rows: 2, max: 140, hint: stars },
    ...DOMAINS.map((d) => ({ name: `ds_${d.slug}`, label: `${d.name} card text`, max: 140, full: true })),

    { type: 'heading', label: 'Projects, events and gallery headings' },
    { name: 'projects_eyebrow', label: 'Projects small line', max: 60 },
    { name: 'projects_title', label: 'Projects heading', max: 100 },
    { name: 'events_eyebrow', label: 'Events small line', max: 60 },
    { name: 'events_title', label: 'Events heading', max: 100 },
    { name: 'gallery_eyebrow', label: 'Gallery small line', max: 60 },
    { name: 'gallery_title', label: 'Gallery heading', max: 100 },

    { type: 'heading', label: 'Closing banner' },
    { name: 'cta_title', label: 'Banner heading', max: 120, full: true },
    { name: 'cta_text', label: 'Banner text', type: 'textarea', rows: 3, max: 300 },
  ];
}

// form values come flat, the saved shape keeps the domain texts together
export function toFormValues(content) {
  const flat = { ...content };
  for (const d of DOMAINS) flat[`ds_${d.slug}`] = content.domain_summaries?.[d.slug];
  return flat;
}

export function fromFormValues(values) {
  const out = { domain_summaries: {} };
  for (const [key, val] of Object.entries(values)) {
    if (key.startsWith('ds_')) { if (filled(val)) out.domain_summaries[key.slice(3)] = val; }
    else if (filled(val)) out[key] = val;
  }
  return out;
}
