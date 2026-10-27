import { store } from './store/index.js';
import { config } from './config.js';
import { DOMAINS, POSITIONS } from './domains.js';
import { openForm, openModal, toast } from './ui.js';
import { esc, $, icon } from './util.js';

const domainOptions = DOMAINS.map((d) => ({ value: d.slug, label: d.name }));

// every editor resolves true when something was saved so callers know to refresh

export function editProject(project) {
  return openForm({
    title: project ? 'Edit project' : 'Add a project',
    size: 'wide',
    values: project || { status: 'ongoing', year: new Date().getFullYear() },
    submitLabel: project ? 'Save changes' : 'Add project',
    fields: [
      { name: 'title', label: 'Title', required: true, max: 120, full: true },
      { name: 'domain', label: 'Domain', type: 'select', required: true, options: domainOptions },
      { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'ongoing', label: 'Ongoing' }, { value: 'completed', label: 'Completed' }, { value: 'planned', label: 'Planned' }] },
      { name: 'summary', label: 'One line summary', max: 200, full: true, hint: 'Shown on the project card.' },
      { name: 'description', label: 'Full description', type: 'textarea', rows: 7, max: 5000 },
      { name: 'tech', label: 'Tools and tech', type: 'tags', hint: 'Comma separated, for example Verilog, Vivado' },
      { name: 'team', label: 'People', type: 'tags', hint: 'Comma separated names' },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'repo_url', label: 'Repository link', type: 'url', placeholder: 'https://github.com/...' },
      { name: 'demo_url', label: 'Demo or report link', type: 'url' },
      { name: 'cover_url', label: 'Cover image', type: 'image' },
      { name: 'featured', label: 'Feature on the home page', type: 'switch' },
    ],
    async onSubmit(v) {
      v.cover_url = await store.uploadImage(v.cover_url, 'projects');
      await store.saveProject({ ...(project ? { id: project.id } : {}), ...v });
      toast(project ? 'Project updated' : 'Project added');
    },
  });
}

export function editPhoto(photo, albums = []) {
  return openForm({
    title: 'Edit photo',
    size: 'small',
    values: photo,
    fields: [
      { name: 'caption', label: 'Caption', max: 140, full: true },
      { name: 'album', label: 'Album', required: true, max: 60, hint: albums.length ? `Existing: ${albums.join(', ')}` : '' },
      { name: 'taken_on', label: 'Date taken', type: 'date' },
      { name: 'featured', label: 'Show on the home page', type: 'switch' },
    ],
    async onSubmit(v) {
      await store.savePhoto({ id: photo.id, ...v });
      toast('Photo updated');
    },
  });
}

export function uploadPhotos(albums = []) {
  return new Promise((resolve) => {
    let saved = false;
    const dlg = openModal({
      title: 'Upload photos',
      body: `<form id="up-form" class="stack" novalidate>
        <label class="upload" id="up-drop">
          <span class="ph">${icon('upload').s}</span>
          <div><b id="up-label">Choose photos</b><br><small>Pick as many as you like. Each one is resized before upload.</small></div>
          <input type="file" id="up-files" accept="image/*" multiple>
        </label>
        <div class="form-grid">
          <div class="field"><label for="up-album">Album</label><input class="input" id="up-album" list="up-albums" value="${esc(albums[0] || 'General')}" maxlength="60" required><datalist id="up-albums">${albums.map((a) => `<option value="${esc(a)}">`).join('')}</datalist></div>
          <div class="field"><label for="up-date">Date taken</label><input class="input" id="up-date" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
          <div class="field full"><label for="up-cap">Caption</label><input class="input" id="up-cap" maxlength="140" placeholder="Leave empty to use each file name"><span class="hint">Applies to every photo in this batch. You can edit captions one by one afterwards.</span></div>
        </div>
        <div id="up-progress" class="muted" style="font-size:14px"></div>
      </form>`,
      footer: `<button class="btn btn-ghost btn-sm" data-close>Cancel</button><button class="btn btn-primary btn-sm" id="up-go" disabled>Upload</button>`,
    });
    const input = $('#up-files', dlg);
    const go = $('#up-go', dlg);
    input.addEventListener('change', () => {
      const n = input.files.length;
      $('#up-label', dlg).textContent = n ? `${n} photo${n === 1 ? '' : 's'} selected` : 'Choose photos';
      go.disabled = !n;
    });
    go.addEventListener('click', async () => {
      const files = [...input.files];
      const album = $('#up-album', dlg).value.trim() || 'General';
      const cap = $('#up-cap', dlg).value.trim();
      const date = $('#up-date', dlg).value || null;
      go.classList.add('loading');
      let done = 0;
      try {
        for (const file of files) {
          $('#up-progress', dlg).textContent = `Uploading ${done + 1} of ${files.length}...`;
          const url = await store.uploadImage(file, 'gallery');
          await store.savePhoto({ url, album, taken_on: date, featured: false, caption: cap || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
          done++;
        }
        saved = true;
        toast(`${done} photo${done === 1 ? '' : 's'} added`);
        dlg.close();
      } catch (err) {
        toast(err.message, 'err');
        if (done) saved = true;
        $('#up-progress', dlg).textContent = done ? `${done} uploaded before the error.` : '';
      } finally {
        go.classList.remove('loading');
      }
    });
    dlg.addEventListener('close', () => resolve(saved));
  });
}

export function editEvent(event) {
  return openForm({
    title: event ? 'Edit event' : 'Add an event',
    values: event || { rsvp_open: true },
    submitLabel: event ? 'Save changes' : 'Add event',
    fields: [
      { name: 'title', label: 'Title', required: true, max: 120, full: true },
      { name: 'starts_at', label: 'Starts', type: 'datetime', required: true },
      { name: 'ends_at', label: 'Ends', type: 'datetime' },
      { name: 'location', label: 'Location', max: 120 },
      { name: 'domain', label: 'Domain', type: 'select', options: domainOptions, blank: 'All domains' },
      { name: 'description', label: 'Details', type: 'textarea', rows: 5, max: 2000 },
      { name: 'rsvp_open', label: 'Members can RSVP', type: 'switch' },
    ],
    async onSubmit(v) {
      if (v.ends_at && v.starts_at && v.ends_at < v.starts_at) throw new Error('The event cannot end before it starts.');
      await store.saveEvent({ ...(event ? { id: event.id } : {}), ...v });
      toast(event ? 'Event updated' : 'Event added');
    },
  });
}

export function editAnnouncement(item) {
  return openForm({
    title: item ? 'Edit announcement' : 'New announcement',
    values: item || {},
    submitLabel: item ? 'Save changes' : 'Post',
    fields: [
      { name: 'title', label: 'Title', required: true, max: 120, full: true },
      { name: 'body', label: 'Message', type: 'textarea', required: true, rows: 6, max: 3000 },
      { name: 'pinned', label: 'Pin to the top', type: 'switch' },
    ],
    async onSubmit(v) {
      await store.saveAnnouncement({ ...(item ? { id: item.id } : {}), ...v });
      toast(item ? 'Announcement updated' : 'Announcement posted');
    },
  });
}

export function editResource(item) {
  return openForm({
    title: item ? 'Edit resource' : 'Add a resource',
    values: item || { kind: 'Tutorial' },
    submitLabel: item ? 'Save changes' : 'Add resource',
    fields: [
      { name: 'title', label: 'Title', required: true, max: 140, full: true },
      { name: 'url', label: 'Link', type: 'url', required: true, full: true, max: 500 },
      { name: 'kind', label: 'Type', type: 'select', required: true, options: ['Tutorial', 'Book', 'Datasheet', 'Docs', 'Video', 'Sheet', 'Other'] },
      { name: 'domain', label: 'Domain', type: 'select', options: domainOptions, blank: 'All domains' },
      { name: 'description', label: 'Note', max: 240, full: true },
    ],
    async onSubmit(v) {
      await store.saveResource({ ...(item ? { id: item.id } : {}), ...v });
      toast(item ? 'Resource updated' : 'Resource added');
    },
  });
}

export function editMember(member) {
  const editing = Boolean(member);
  return openForm({
    title: editing ? 'Edit roster entry' : 'Add a member',
    intro: editing ? '' : 'They can sign in with this college email as soon as you save. Their profile is filled in by them and approved by an admin.',
    values: member || { role: 'member' },
    submitLabel: editing ? 'Save changes' : 'Add to roster',
    fields: [
      { name: 'email', label: 'College email', type: 'email', required: true, readonly: editing, full: true, placeholder: `name@${config.emailDomain}` },
      { name: 'name', label: 'Name', max: 80, hint: 'Optional, they can set it themselves.' },
      { name: 'role', label: 'Access level', type: 'select', required: true, options: [{ value: 'member', label: 'Member' }, { value: 'admin', label: 'Admin' }] },
      { name: 'position', label: 'Club position', type: 'select', options: POSITIONS, blank: 'None' },
      { name: 'lead_domain', label: 'Lead of', type: 'select', options: DOMAINS.map((d) => ({ value: d.slug, label: d.name })), blank: 'Not a lead', hint: 'Only used when the position is Lead.' },
    ],
    async onSubmit(v) {
      const email = (v.email || '').toLowerCase();
      if (!email.endsWith('@' + config.emailDomain)) throw new Error(`Use a @${config.emailDomain} address.`);
      if (v.position === 'Lead' && !v.lead_domain) throw new Error('Pick the domain this person leads.');
      if (v.position !== 'Lead') v.lead_domain = null;
      if (editing) {
        const { email: _drop, ...patch } = v;
        await store.updateMember(member.email, patch);
        toast('Roster entry updated');
      } else {
        await store.addMember({ ...v, email });
        toast('Member added');
      }
    },
  });
}
