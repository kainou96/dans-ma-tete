-- Run this once in Supabase Dashboard > SQL Editor.
-- Create your admin user first in Authentication > Users, then add its UUID below.

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;
drop policy if exists "Admins can view their own access" on public.site_admins;
create policy "Admins can view their own access"
  on public.site_admins for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.site_admins to authenticated;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.site_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_site_admin() from public, anon;
grant execute on function public.is_site_admin() to authenticated;

create table if not exists public.site_settings (
  id text primary key check (id = 'main'),
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select to anon, authenticated
  using (true);

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
  on public.site_settings for insert to authenticated
  with check ((select public.is_site_admin()));

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings for update to authenticated
  using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));

drop policy if exists "Admins can delete site settings" on public.site_settings;
create policy "Admins can delete site settings"
  on public.site_settings for delete to authenticated
  using ((select public.is_site_admin()));
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

create table if not exists public.fan_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email))),
  presaved_at timestamptz not null default now(),
  has_played boolean not null default false,
  has_completed boolean not null default false,
  played_at timestamptz,
  completed_at timestamptz
);

alter table public.fan_signups enable row level security;
drop policy if exists "Admins can view fan signups" on public.fan_signups;
create policy "Admins can view fan signups"
  on public.fan_signups for select to authenticated
  using ((select public.is_site_admin()));

drop policy if exists "Admins can update fan signups" on public.fan_signups;
create policy "Admins can update fan signups"
  on public.fan_signups for update to authenticated
  using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));

drop policy if exists "Admins can delete fan signups" on public.fan_signups;
create policy "Admins can delete fan signups"
  on public.fan_signups for delete to authenticated
  using ((select public.is_site_admin()));
grant select, update, delete on public.fan_signups to authenticated;

create or replace function public.register_fan(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_email));
begin
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Adresse email invalide';
  end if;

  insert into public.fan_signups (email)
  values (normalized_email)
  on conflict (email) do nothing;
end;
$$;

revoke all on function public.register_fan(text) from public;
grant execute on function public.register_fan(text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true), ('audio', 'audio', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Admins can upload site media" on storage.objects;
create policy "Admins can upload site media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('covers', 'audio')
    and (select public.is_site_admin())
  );

drop policy if exists "Admins can update site media" on storage.objects;
create policy "Admins can update site media"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('covers', 'audio')
    and (select public.is_site_admin())
  )
  with check (
    bucket_id in ('covers', 'audio')
    and (select public.is_site_admin())
  );

drop policy if exists "Admins can delete site media" on storage.objects;
create policy "Admins can delete site media"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('covers', 'audio')
    and (select public.is_site_admin())
  );

-- After creating your Supabase Auth user, replace the UUID and run:
-- insert into public.site_admins (user_id) values ('YOUR-AUTH-USER-UUID');
