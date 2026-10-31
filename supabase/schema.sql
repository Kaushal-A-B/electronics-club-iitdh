-- Electronics Club IITDh site: database schema, access rules and storage.
-- Paste this whole file into the Supabase SQL editor and run it once.
-- It is safe to run again, tables are only created if missing and the
-- policies are rebuilt from scratch each time.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- who is calling
-- ---------------------------------------------------------------------------

create or replace function public.auth_email() returns text
language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

-- the two checks below read the roster with owner rights so the policies
-- on the roster itself do not call themselves. They are plpgsql on purpose,
-- plain sql functions are checked when created and the members table does
-- not exist yet at this point.
create or replace function public.is_member() returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (select 1 from public.members where email = public.auth_email());
end
$$;

create or replace function public.is_admin() returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (select 1 from public.members where email = public.auth_email() and role = 'admin');
end
$$;

-- ---------------------------------------------------------------------------
-- tables
-- ---------------------------------------------------------------------------

create table if not exists public.members (
  email        text primary key check (email = lower(email) and email like '%@iitdh.ac.in'),
  role         text not null default 'member' check (role in ('member', 'admin')),
  name         text check (char_length(name) <= 80),
  roll_no      text check (char_length(roll_no) <= 20),
  branch       text,
  batch        text check (batch ~ '^[0-9]{4}$'),
  bio          text check (char_length(bio) <= 280),
  skills       text[] not null default '{}',
  domains      text[] not null default '{}',
  github       text,
  linkedin     text,
  avatar_url   text,
  position     text check (position in ('Secretary', 'Deputy Secretary', 'Lead')),
  lead_domain  text check (lead_domain in ('digital-vlsi', 'analog-vlsi', 'embedded', 'communication')),
  added_by     text,
  joined_at    timestamptz not null default now(),
  constraint lead_needs_domain check (position is distinct from 'Lead' or lead_domain is not null)
);

create table if not exists public.profile_changes (
  id           uuid primary key default gen_random_uuid(),
  email        text not null references public.members (email) on delete cascade on update cascade,
  data         jsonb not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note         text,
  submitted_at timestamptz not null default now(),
  reviewed_by  text,
  reviewed_at  timestamptz
);
create unique index if not exists one_pending_change_per_member
  on public.profile_changes (email) where status = 'pending';

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) <= 120),
  summary      text check (char_length(summary) <= 200),
  description  text check (char_length(description) <= 5000),
  domain       text not null check (domain in ('digital-vlsi', 'analog-vlsi', 'embedded', 'communication')),
  status       text not null default 'ongoing' check (status in ('ongoing', 'completed', 'planned')),
  tech         text[] not null default '{}',
  team         text[] not null default '{}',
  year         int,
  cover_url    text,
  repo_url     text,
  demo_url     text,
  featured     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  caption     text check (char_length(caption) <= 140),
  album       text not null default 'General' check (char_length(album) <= 60),
  taken_on    date,
  featured    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) <= 120),
  description  text check (char_length(description) <= 2000),
  location     text,
  domain       text check (domain in ('digital-vlsi', 'analog-vlsi', 'embedded', 'communication')),
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  cover_url    text,
  rsvp_open    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.event_rsvps (
  event_id    uuid not null references public.events (id) on delete cascade,
  email       text not null references public.members (email) on delete cascade on update cascade,
  created_at  timestamptz not null default now(),
  primary key (event_id, email)
);

create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) <= 120),
  body        text not null check (char_length(body) <= 3000),
  pinned      boolean not null default false,
  created_by  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.resources (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) <= 140),
  url          text not null,
  kind         text not null default 'Tutorial',
  domain       text check (domain in ('digital-vlsi', 'analog-vlsi', 'embedded', 'communication')),
  description  text check (char_length(description) <= 240),
  created_at   timestamptz not null default now()
);

create table if not exists public.activity_log (
  id      bigint generated always as identity primary key,
  actor   text,
  action  text not null,
  target  text,
  at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- only people an admin has added to the roster can ever create an account
-- ---------------------------------------------------------------------------

create or replace function public.enforce_college_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(coalesce(new.email, '')) not like '%@iitdh.ac.in'
     or not exists (select 1 from public.members where email = lower(new.email)) then
    raise exception 'Only club members can sign in';
  end if;
  return new;
end
$$;

drop trigger if exists college_email_only on auth.users;
create trigger college_email_only
  before insert or update of email on auth.users
  for each row execute function public.enforce_college_email();

-- a member without a name shows up under the first part of their email
create or replace function public.default_member_name() returns trigger
language plpgsql as $$
begin
  if new.name is null or btrim(new.name) = '' then
    new.name := split_part(new.email, '@', 1);
  end if;
  return new;
end
$$;

drop trigger if exists member_default_name on public.members;
create trigger member_default_name
  before insert or update on public.members
  for each row execute function public.default_member_name();

-- ---------------------------------------------------------------------------
-- never lock the club out of its own admin console
-- ---------------------------------------------------------------------------

create or replace function public.keep_one_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin') then
    if not exists (select 1 from public.members where role = 'admin' and email <> old.email) then
      raise exception 'There has to be at least one admin.';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists keep_one_admin on public.members;
create trigger keep_one_admin
  before update or delete on public.members
  for each row execute function public.keep_one_admin();

-- ---------------------------------------------------------------------------
-- audit trail, written by the database so it cannot be skipped from the browser
-- ---------------------------------------------------------------------------

create or replace function public.log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if tg_op = 'DELETE' then r := to_jsonb(old); else r := to_jsonb(new); end if;
  insert into public.activity_log (actor, action, target)
  values (public.auth_email(), tg_op || ' ' || tg_table_name, coalesce(r ->> 'title', r ->> 'email', r ->> 'caption', r ->> 'id'));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

do $$
declare t text;
begin
  foreach t in array array['members', 'projects', 'photos', 'events', 'announcements', 'resources'] loop
    execute format('drop trigger if exists log_%1$s on public.%1$I', t);
    execute format('create trigger log_%1$s after insert or update or delete on public.%1$I for each row execute function public.log_change()', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- functions the site calls
-- ---------------------------------------------------------------------------

-- members can only queue a change, an admin applies it
create or replace function public.submit_profile_change(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  me text := public.auth_email();
  clean jsonb;
begin
  if not public.is_member() then
    raise exception 'Only members can edit a profile';
  end if;

  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into clean
  from jsonb_each(p) as t(k, v)
  where k in ('name', 'roll_no', 'branch', 'batch', 'bio', 'skills', 'domains', 'github', 'linkedin', 'avatar_url');

  if char_length(coalesce(clean ->> 'name', '')) > 80 then raise exception 'Name is too long'; end if;
  if char_length(coalesce(clean ->> 'bio', '')) > 280 then raise exception 'Bio is limited to 280 characters'; end if;
  if (clean ->> 'batch') is not null and (clean ->> 'batch') !~ '^[0-9]{4}$' then raise exception 'Batch should be a four digit year'; end if;

  delete from public.profile_changes where email = me and status = 'pending';
  insert into public.profile_changes (email, data) values (me, clean);
end
$$;

create or replace function public.review_profile_change(change_id uuid, approve boolean, note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare c public.profile_changes;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;

  select * into c from public.profile_changes where id = change_id and status = 'pending' for update;
  if not found then raise exception 'That request was already handled.'; end if;

  if approve then
    update public.members m set
      name       = case when c.data ? 'name'       then nullif(c.data ->> 'name', '')       else m.name end,
      roll_no    = case when c.data ? 'roll_no'    then nullif(c.data ->> 'roll_no', '')    else m.roll_no end,
      branch     = case when c.data ? 'branch'     then nullif(c.data ->> 'branch', '')     else m.branch end,
      batch      = case when c.data ? 'batch'      then nullif(c.data ->> 'batch', '')      else m.batch end,
      bio        = case when c.data ? 'bio'        then nullif(c.data ->> 'bio', '')        else m.bio end,
      github     = case when c.data ? 'github'     then nullif(c.data ->> 'github', '')     else m.github end,
      linkedin   = case when c.data ? 'linkedin'   then nullif(c.data ->> 'linkedin', '')   else m.linkedin end,
      avatar_url = case when c.data ? 'avatar_url' then nullif(c.data ->> 'avatar_url', '') else m.avatar_url end,
      skills     = case when jsonb_typeof(c.data -> 'skills') = 'array'
                        then array(select jsonb_array_elements_text(c.data -> 'skills')) else m.skills end,
      domains    = case when jsonb_typeof(c.data -> 'domains') = 'array'
                        then array(select jsonb_array_elements_text(c.data -> 'domains')) else m.domains end
    where m.email = c.email;
  end if;

  update public.profile_changes
     set status = case when approve then 'approved' else 'rejected' end,
         note = review_profile_change.note,
         reviewed_by = public.auth_email(),
         reviewed_at = now()
   where id = c.id;

  insert into public.activity_log (actor, action, target)
  values (public.auth_email(), case when approve then 'APPROVE profile' else 'REJECT profile' end, c.email);
end
$$;

-- first sign in: swap the email-name placeholder for the name on the Google account.
-- only fills a placeholder, a name an admin or member has set is never touched.
create or replace function public.sync_google_name() returns void
language plpgsql security definer set search_path = public as $$
declare
  me text := public.auth_email();
  g text := nullif(btrim(coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', '')), '');
begin
  if g is null or me = '' then return; end if;
  if g = upper(g) then g := initcap(lower(g)); end if;
  update public.members
     set name = left(g, 80)
   where email = me and (name is null or btrim(name) = '' or name = split_part(email, '@', 1));
end
$$;
-- numbers for the public home page, nothing personal in here
create or replace function public.public_stats() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'members',  (select count(*) from public.members),
    'projects', (select count(*) from public.projects),
    'events',   (select count(*) from public.events),
    'domains',  4
  )
$$;

-- the team page shows officers and leads only, and no email addresses
create or replace view public.public_team as
  select name, position, lead_domain, bio, avatar_url, github, linkedin, batch
  from public.members
  where position is not null;

revoke execute on function public.sync_google_name() from public, anon;
revoke execute on function public.submit_profile_change(jsonb) from public, anon;
revoke execute on function public.review_profile_change(uuid, boolean, text) from public, anon;
grant execute on function public.sync_google_name() to authenticated;
grant execute on function public.submit_profile_change(jsonb) to authenticated;
grant execute on function public.review_profile_change(uuid, boolean, text) to authenticated;
grant execute on function public.public_stats() to anon, authenticated;
grant select on public.public_team to anon, authenticated;

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------

alter table public.members         enable row level security;
alter table public.profile_changes enable row level security;
alter table public.projects        enable row level security;
alter table public.photos          enable row level security;
alter table public.events          enable row level security;
alter table public.event_rsvps     enable row level security;
alter table public.announcements   enable row level security;
alter table public.resources       enable row level security;
alter table public.activity_log    enable row level security;

do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end
$$;

-- roster: members can read it, only admins can change it
create policy members_read  on public.members for select to authenticated using (public.is_member());
create policy members_admin on public.members for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- profile changes: you see your own, admins see all, writes go through the functions above
create policy changes_read on public.profile_changes for select to authenticated
  using (email = public.auth_email() or public.is_admin());

-- public content: anyone can read, admins write
create policy projects_read  on public.projects for select to anon, authenticated using (true);
create policy projects_admin on public.projects for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy photos_read    on public.photos   for select to anon, authenticated using (true);
create policy photos_admin   on public.photos   for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy events_read    on public.events   for select to anon, authenticated using (true);
create policy events_admin   on public.events   for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- members only content
create policy announcements_read  on public.announcements for select to authenticated using (public.is_member());
create policy announcements_admin on public.announcements for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy resources_read      on public.resources     for select to authenticated using (public.is_member());
create policy resources_admin     on public.resources     for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- rsvps
create policy rsvps_read   on public.event_rsvps for select to authenticated using (public.is_member());
create policy rsvps_insert on public.event_rsvps for insert to authenticated
  with check (email = public.auth_email() and public.is_member()
              and exists (select 1 from public.events e where e.id = event_id and e.rsvp_open));
create policy rsvps_delete on public.event_rsvps for delete to authenticated using (email = public.auth_email());

-- audit log is for admins to read, nobody writes it directly
create policy activity_read on public.activity_log for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- image storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists media_admin_all    on storage.objects;
drop policy if exists media_avatar_add   on storage.objects;
drop policy if exists media_avatar_edit  on storage.objects;
drop policy if exists media_avatar_drop  on storage.objects;

create policy media_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

-- members can drop a profile photo into their own folder, it only goes live once an admin approves the profile change
create policy media_avatar_add on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_member()
              and (storage.foldername(name))[1] = 'avatars'
              and (storage.foldername(name))[2] = auth.uid()::text);
create policy media_avatar_edit on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);
create policy media_avatar_drop on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- starting roster
-- ---------------------------------------------------------------------------

-- admins
insert into public.members (email, role)
values ('ee23bt041@iitdh.ac.in', 'admin')
on conflict (email) do nothing;

-- the club account is the secretary's login
insert into public.members (email, role, name, batch, branch, domains, position)
values ('electronicsclub@iitdh.ac.in', 'admin', 'Maanas Khatokar N', '2024', 'Electronics and Communication Engineering', '{digital-vlsi}', 'Secretary')
on conflict (email) do update
  set role = 'admin', name = excluded.name, batch = excluded.batch, branch = excluded.branch,
      domains = excluded.domains, position = excluded.position;

-- members
insert into public.members (email, role, roll_no, batch)
values ('ee25bt004@iitdh.ac.in', 'member', 'EE25BT004', '2025')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- cleanup
-- ---------------------------------------------------------------------------

drop function if exists public.resolve_join_request(text, boolean);
drop table if exists public.join_requests;

update public.members set name = split_part(email, '@', 1) where name is null or btrim(name) = '';
