import { html, icon, $, $$ } from '../util.js';
import { observeReveals, confirmDialog, toast } from '../ui.js';
import { editEvent } from '../editors.js';
import { eventCard, pageHeader } from './shared.js';

export default async function events({ store, role, session, rerender }) {
  const [list, rsvps] = await Promise.all([store.events(), role ? store.rsvps() : []]);
  const admin = role === 'admin';
  const now = Date.now();
  const isPast = (e) => new Date(e.ends_at || e.starts_at).getTime() < now;
  const upcoming = list.filter((e) => !isPast(e));
  const past = list.filter(isPast).reverse();
  let tab = 'upcoming';

  const count = (id) => rsvps.filter((r) => r.event_id === id).length;
  const going = (id) => rsvps.some((r) => r.event_id === id && r.email === session?.email);

  function actions(e) {
    const bits = [];
    if (!isPast(e) && e.rsvp_open) {
      if (role) bits.push(`<button class="btn ${going(e.id) ? 'btn-soft' : 'btn-primary'} btn-sm" data-rsvp="${e.id}">${going(e.id) ? icon('check').s + ' You are going' : 'RSVP'}</button>`);
      else bits.push(`<a class="btn btn-ghost btn-sm" href="#/signin?next=%2Fevents">Sign in to RSVP</a>`);
    }
    if (role) bits.push(`<span class="muted rsvp-count">${count(e.id)} going</span>`);
    if (admin) bits.push(`<button class="btn btn-soft btn-sm" data-edit="${e.id}">${icon('edit').s} Edit</button><button class="btn btn-danger btn-sm" data-del="${e.id}">${icon('trash').s}</button>`);
    return bits.length ? `<div class="row row-wrap ev-actions">${bits.join('')}</div>` : '';
  }

  return {
    title: 'Events',
    html: html`
      ${pageHeader('Events', 'Sessions, talks and build nights', 'Everything on the calendar is open to look at. Members can RSVP so we know how many chairs and soldering irons to set out.', admin ? html`<button class="btn btn-primary" id="add-event">${icon('plus')} Add event</button>` : '')}
      <section class="wrap" style="padding-bottom:96px">
        <div class="filters"><div class="tabs" id="ev-tabs"><button data-t="upcoming" class="on">Upcoming (${upcoming.length})</button><button data-t="past">Past (${past.length})</button></div></div>
        <div class="stack" id="ev-list" style="gap:20px"></div>
      </section>`,
    after(root) {
      const box = $('#ev-list', root);
      function draw() {
        const items = tab === 'upcoming' ? upcoming : past;
        box.innerHTML = items.length
          ? items.map((e) => eventCard(e, actions(e))).join('')
          : html`<div class="empty">${icon('calendar')}<h3>${tab === 'upcoming' ? 'Nothing scheduled' : 'No past events'}</h3><p>${tab === 'upcoming' ? 'New sessions will be posted here.' : 'Past sessions will be listed here.'}</p></div>`.s;
        observeReveals(box);
      }
      draw();

      $('#ev-tabs', root).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        tab = b.dataset.t;
        $$('#ev-tabs button', root).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      });

      box.addEventListener('click', async (e) => {
        const r = e.target.closest('[data-rsvp]');
        const ed = e.target.closest('[data-edit]');
        const del = e.target.closest('[data-del]');
        try {
          if (r) {
            r.classList.add('loading');
            await store.rsvp(r.dataset.rsvp, !going(r.dataset.rsvp));
            toast(going(r.dataset.rsvp) ? 'RSVP removed' : 'See you there');
            rerender();
          } else if (ed) {
            if (await editEvent(list.find((x) => x.id === ed.dataset.edit))) rerender();
          } else if (del) {
            const ev = list.find((x) => x.id === del.dataset.del);
            if (await confirmDialog({ title: 'Delete this event?', message: `"${ev.title}" and its RSVPs will be removed.`, confirmLabel: 'Delete', danger: true })) {
              await store.deleteEvent(ev.id); toast('Event deleted'); rerender();
            }
          }
        } catch (err) { toast(err.message, 'err'); rerender(); }
      });
      $('#add-event', root)?.addEventListener('click', async () => { if (await editEvent(null)) rerender(); });
    },
  };
}
