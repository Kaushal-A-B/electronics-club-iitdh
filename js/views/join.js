import { html, icon } from '../util.js';
import { config } from '../config.js';
import { pageHeader } from './shared.js';

const STEPS = [
  ['Ask an admin', `Send your @${config.emailDomain} address to the secretary or any club admin. They add it to the member list.`],
  ['Sign in with Google', `Use that same @${config.emailDomain} account. Any other email is turned away.`],
  ['Fill in your profile', 'Your name starts as the first part of your email. Add your details and an admin approves them before anyone else sees them.'],
];

export default async function join({ session, role }) {
  let panel;
  if (role) {
    panel = html`<div class="card join-panel"><span class="badge ok">You are a member</span><h3>You are already in</h3><p class="muted">Head to the dashboard to update your profile or see what is coming up.</p><a class="btn btn-primary" href="#/app">Open dashboard ${icon('arrow')}</a></div>`;
  } else {
    panel = html`
      <div class="card join-panel">
        <h3>Want to join?</h3>
        <p class="muted">Membership is by invitation from the admins. Write to the club with your college email and which domain interests you.</p>
        ${config.contactEmail
          ? html`<a class="btn btn-primary" href="mailto:${config.contactEmail}?subject=Joining%20Electronics%20Club%20IITDh">${icon('mail')} ${config.contactEmail}</a>`
          : html`<p class="muted">Ask any club member for the admin contact.</p>`}
        ${session ? '' : html`<p class="faint small">Already added? <a href="#/signin" style="color:var(--cyan)">Sign in</a></p>`}
      </div>`;
  }

  return {
    title: 'Join',
    html: html`
      ${pageHeader('Join', 'Become a member', `Open to everyone at ${config.college}. No experience needed, curiosity is the entry requirement.`)}
      <section class="wrap join-layout" style="padding-bottom:96px">
        <ol class="steps">${STEPS.map(([t, d], i) => html`<li class="reveal" data-delay="${i + 1}"><span class="step-n">${i + 1}</span><div><h4>${t}</h4><p class="muted">${d}</p></div></li>`)}</ol>
        <div class="reveal">${panel}</div>
      </section>`,
  };
}
