import { html, icon, ago, $ } from '../util.js';
import { config } from '../config.js';
import { toast } from '../ui.js';
import { pageHeader } from './shared.js';

const STEPS = [
  ['Sign in', `Use your @${config.emailDomain} Google account. Nobody else can create an account.`],
  ['Ask to join', 'Tell us a little about yourself and which domain interests you. An admin reads every request.'],
  ['Get approved', 'Once an admin adds you to the roster you unlock the members area.'],
  ['Fill in your profile', 'Add your details. An admin approves the first version and any later edits before they go live.'],
];

export default async function join({ store, session, role, rerender }) {
  let req = null;
  if (session && !role) req = await store.myJoinRequest();

  let panel;
  if (!session) {
    panel = html`<div class="card join-panel"><h3>Ready?</h3><p class="muted">Sign in first, then you can send your request.</p><a class="btn btn-primary" href="#/signin?next=%2Fjoin">Sign in ${icon('arrow')}</a></div>`;
  } else if (role) {
    panel = html`<div class="card join-panel"><span class="badge ok">You are on the roster</span><h3>You are already a member</h3><p class="muted">Head to the dashboard to update your profile or see what is coming up.</p><a class="btn btn-primary" href="#/app">Open dashboard ${icon('arrow')}</a></div>`;
  } else if (req?.status === 'pending') {
    panel = html`<div class="card join-panel"><span class="badge pending">Waiting for an admin</span><h3>Request received</h3><p class="muted">Sent ${ago(req.created_at)} as ${session.email}. You will get access as soon as an admin approves it, just sign in again and refresh.</p></div>`;
  } else {
    panel = html`
      <form class="card join-panel" id="join-form">
        <h3>Request to join</h3>
        ${req?.status === 'rejected' ? html`<div class="notice warn">${icon('alert')}<div>Your last request was not approved. You can send a new one with more detail.</div></div>` : ''}
        <p class="muted">Signed in as <b>${session.email}</b></p>
        <div class="field"><label for="j-name">Your name <span class="req">*</span></label><input class="input" id="j-name" required maxlength="80" value="${session.name && !session.name.includes('@') ? session.name : ''}"></div>
        <div class="field"><label for="j-msg">Why do you want to join?</label><textarea class="textarea" id="j-msg" rows="4" maxlength="600" placeholder="Domains you like, anything you have built, what you want to learn"></textarea></div>
        <button class="btn btn-primary" type="submit">Send request ${icon('arrow')}</button>
      </form>`;
  }

  return {
    title: 'Join',
    html: html`
      ${pageHeader('Join', 'Become a member', `Open to everyone at ${config.college}. No experience needed, curiosity is the entry requirement.`)}
      <section class="wrap join-layout" style="padding-bottom:96px">
        <ol class="steps">${STEPS.map(([t, d], i) => html`<li class="reveal" data-delay="${i + 1}"><span class="step-n">${i + 1}</span><div><h4>${t}</h4><p class="muted">${d}</p></div></li>`)}</ol>
        <div class="reveal">${panel}</div>
      </section>`,
    after(root) {
      $('#join-form', root)?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = $('button[type=submit]', root);
        btn.classList.add('loading');
        try {
          await store.requestJoin({ name: $('#j-name', root).value.trim(), message: $('#j-msg', root).value.trim() || null });
          toast('Request sent');
          rerender();
        } catch (err) { toast(err.message, 'err'); btn.classList.remove('loading'); }
      });
    },
  };
}
