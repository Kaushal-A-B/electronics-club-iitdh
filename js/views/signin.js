import { html, raw, icon, logoMark, $ } from '../util.js';
import { config } from '../config.js';
import { go } from '../router.js';
import { toast } from '../ui.js';

const GOOGLE_G = raw('<span class="g-badge" aria-hidden="true">G</span>');

export default async function signin({ store, session, query }) {
  const next = query.next ? decodeURIComponent(query.next) : '/app';
  if (session) { setTimeout(() => go(next), 0); return { title: 'Sign in', html: html`<div class="section"></div>` }; }

  const live = store.mode === 'live';
  return {
    title: 'Sign in',
    html: html`
      <section class="auth">
        <div class="auth-card card">
          ${logoMark('auth-mark')}
          <h1 class="title-md">Sign in to the club site</h1>
          <p class="muted">Sign in with your <b>@${config.emailDomain}</b> Google account. Only emails an admin has added to the member list get in. Everyone else can still browse the public pages.</p>
          ${live
            ? html`<button class="btn btn-ghost btn-block google" id="google">${GOOGLE_G} Continue with Google</button>
                   <p class="faint small">Any other email is turned away with a message.</p>`
            : html`<div class="notice info">${icon('info')}<div>Preview mode. Pick a role to look around, no password needed.</div></div>
                   <div class="stack" style="gap:10px">
                     <button class="btn btn-primary btn-block" data-role="admin">${icon('shield')} Continue as admin</button>
                     <button class="btn btn-ghost btn-block" data-role="member">${icon('user')} Continue as member</button>
                     <button class="btn btn-ghost btn-block" data-role="visitor">${icon('users')} Try an email that is not on the list</button>
                   </div>`}
          <a href="#/join" class="small" style="color:var(--cyan)">How do I get added?</a>
        </div>
      </section>`,
    after(root) {
      $('#google', root)?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.classList.add('loading');
        try { await store.signIn(); } catch (err) { toast(err.message, 'err'); btn.classList.remove('loading'); }
      });
      root.querySelectorAll('[data-role]').forEach((b) =>
        b.addEventListener('click', () => {
          if (b.dataset.role !== 'visitor') go(next);
          store.previewSignIn(b.dataset.role);
        })
      );
    },
  };
}
