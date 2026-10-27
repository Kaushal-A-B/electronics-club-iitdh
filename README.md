# Electronics Club website

Website for the Electronics Club at IIT Dharwad. The club has four domains (Digital VLSI, Analog VLSI, Embedded Systems, Communication Systems), a secretary, a deputy secretary and a lead for each domain.

It is a static site, so it is hosted on GitHub Pages for free. The small amount of live data (members, projects, photos, approvals) sits in a Supabase project.

## Who can do what

| | Visitor (no login) | Member | Admin |
|---|---|---|---|
| Home, domains, projects, gallery, events, team | yes | yes | yes |
| Sign in with an `@iitdh.ac.in` account | | yes | yes |
| RSVP to events, member directory, announcements, resource library | | yes | yes |
| Edit own profile (goes to an admin for approval) | | yes | yes |
| Add or remove members and admins, set secretary, deputy and leads | | | yes |
| Approve profile changes and join requests | | | yes |
| Add, edit or delete projects, photos, events, announcements, resources | | | yes |
| Activity log | | | yes |

Admins also get Edit and Delete buttons directly on the public Projects, Gallery and Events pages.

How joining works: a student signs in with their college Google account, sends a join request, and an admin adds them to the roster (or an admin adds them directly by email). The first profile and every later edit is reviewed by an admin before it is shown to anyone else.

## Preview mode

Until the database is connected the site runs in preview mode. It shows sample content and keeps everything in the browser's local storage, and the sign in page lets you pick visitor, member or admin so you can click through every part. Nothing in preview mode is shared with other people.

Preview mode switches off by itself once `js/config.js` has the Supabase details.

## Going live

You need a free Supabase account and a Google account (the college one works best).

1. **Create the project.** On supabase.com make a new project and wait for it to finish setting up.
2. **Load the schema.** Open the SQL editor, paste the whole of `supabase/schema.sql` and run it. This creates the tables, the access rules, the image bucket and the first admin (`ee23bt041@iitdh.ac.in`). It also blocks any non college email from ever creating an account.
3. **Turn on Google sign in.**
   - In the Google Cloud console create an OAuth client of type Web application. If you create the project while signed in with a college account you can set the user type to Internal, which limits sign in to the institute.
   - Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorised redirect URI.
   - In Supabase go to Authentication, Providers, Google, switch it on and paste the client ID and secret.
4. **Tell Supabase where the site lives.** Authentication, URL Configuration: set the Site URL to the GitHub Pages address and add the same address, plus `http://localhost:5173/` if you test locally, to the redirect URLs.
5. **Connect the site.** Copy the Project URL and the anon public key (Project Settings, API) into `js/config.js`, also fill in the contact email there, commit and push. The anon key is meant to be public, the access rules in the schema are what protect the data.

After that, sign in as the admin and open the Admin console to add the secretary, deputy secretary and leads. Give someone a position on the Members and admins page and they show up on the Team page.

## Running it locally

There is no build step. Serve the folder with any static file server and open it in a browser, for example:

```
python -m http.server 5173
```

## Folder layout

```
index.html          page shell
css/                design tokens, components, page styles
js/main.js          startup, navigation, route guards
js/router.js        hash router
js/store/           data layer: live.js (Supabase) and preview.js (browser storage)
js/views/           one file per page, js/views/admin for the console
js/editors.js       the add and edit dialogs used on public pages and in the console
supabase/schema.sql tables, security rules, storage
assets/             logo and favicon
```

## Notes

- Supabase pauses free projects after a week without activity. If the site stops loading data after the holidays, unpause it from the dashboard.
- Uploaded photos are shrunk in the browser before upload, so the free storage quota goes a long way.
- Pages use hash addresses (`#/projects`) so GitHub Pages does not need any rewrite rules.
