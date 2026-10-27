import { html, icon, safeUrl } from '../util.js';
import { domainBySlug } from '../domains.js';
import { confirmDialog, toast } from '../ui.js';
import { editProject } from '../editors.js';
import { domainTag, statusBadge } from './shared.js';
import { go } from '../router.js';

export default async function project({ store, params, role, rerender }) {
  const all = await store.projects();
  const p = all.find((x) => x.id === params.id);
  if (!p) {
    return { title: 'Project not found', html: html`<section class="section"><div class="wrap wrap-narrow"><div class="gate">${icon('folder')}<h1 class="title-lg">Project not found</h1><p class="lead">It may have been removed.</p><a class="btn btn-primary" href="#/projects">All projects</a></div></div></section>` };
  }
  const admin = role === 'admin';
  const d = domainBySlug(p.domain);
  const related = all.filter((x) => x.domain === p.domain && x.id !== p.id).slice(0, 3);
  const paras = String(p.description || '').split(/\n{2,}/).filter(Boolean);

  return {
    title: p.title,
    html: html`
      <article class="project-page d-${p.domain}">
        <header class="page-head">
          <div class="wrap">
            <a class="back" href="#/projects">${icon('arrow')} All projects</a>
            <div class="row row-wrap" style="gap:10px;margin:22px 0 16px">${domainTag(p.domain)}${statusBadge(p.status)}${p.year ? html`<span class="tag">${p.year}</span>` : ''}</div>
            <h1 class="title-xl" style="max-width:900px">${p.title}</h1>
            ${p.summary ? html`<p class="lead" style="margin-top:18px">${p.summary}</p>` : ''}
            ${admin ? html`<div class="row" style="margin-top:26px"><button class="btn btn-soft btn-sm" id="edit">${icon('edit')} Edit project</button><button class="btn btn-danger btn-sm" id="del">${icon('trash')} Delete</button></div>` : ''}
          </div>
        </header>
        <div class="wrap project-layout">
          <div class="project-main">
            ${safeUrl(p.cover_url) ? html`<img class="project-hero reveal" src="${safeUrl(p.cover_url)}" alt="">` : ''}
            <div class="prose reveal">${paras.length ? paras.map((t) => html`<p>${t}</p>`) : html`<p class="muted">No write-up yet.</p>`}</div>
          </div>
          <aside class="project-side reveal">
            <div class="card side-card">
              <h4 class="mini-title">Domain</h4><p>${d?.name || ''}</p>
              ${(p.tech || []).length ? html`<h4 class="mini-title">Built with</h4><div class="tags">${p.tech.map((t) => html`<span class="tag">${t}</span>`)}</div>` : ''}
              ${(p.team || []).length ? html`<h4 class="mini-title">People</h4><ul class="plain">${p.team.map((t) => html`<li>${t}</li>`)}</ul>` : ''}
              ${safeUrl(p.repo_url) || safeUrl(p.demo_url) ? html`<h4 class="mini-title">Links</h4><div class="stack" style="gap:10px">
                ${safeUrl(p.repo_url) ? html`<a class="btn btn-ghost btn-sm" href="${safeUrl(p.repo_url)}" target="_blank" rel="noopener">${icon('github')} Repository</a>` : ''}
                ${safeUrl(p.demo_url) ? html`<a class="btn btn-ghost btn-sm" href="${safeUrl(p.demo_url)}" target="_blank" rel="noopener">${icon('external')} Demo or report</a>` : ''}</div>` : ''}
            </div>
          </aside>
        </div>
        ${related.length ? html`<section class="wrap" style="padding:20px 24px 96px"><h3 class="title-md" style="margin-bottom:24px">More from ${d?.name}</h3><div class="grid grid-3">${related.map((r) => html`<a class="card spot lift mini-project d-${r.domain}" href="#/projects/${r.id}"><h4>${r.title}</h4><p class="muted">${r.summary || ''}</p></a>`)}</div></section>` : ''}
      </article>`,
    after(root) {
      if (!admin) return;
      root.querySelector('#edit').addEventListener('click', async () => { if (await editProject(p)) rerender(); });
      root.querySelector('#del').addEventListener('click', async () => {
        if (!(await confirmDialog({ title: 'Delete this project?', message: `"${p.title}" will be removed from the site for everyone.`, confirmLabel: 'Delete', danger: true }))) return;
        try { await store.deleteProject(p.id); toast('Project deleted'); go('/projects'); } catch (err) { toast(err.message, 'err'); }
      });
    },
  };
}
