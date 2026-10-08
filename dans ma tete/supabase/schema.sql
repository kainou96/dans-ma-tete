-- ==============================================================================
-- SCHÉMA DE BASE DE DONNÉES SUPABASE POUR LA PLATEFORME MUSICALE MULTI-ARTISTE
-- ==============================================================================
-- À copier-coller directement dans : Supabase Dashboard > SQL Editor > New query
-- Puis cliquer sur "RUN" pour tout initialiser automatiquement !

-- 1. Table des Profils Utilisateurs / Artistes
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text not null,
  artist_name text,
  instagram_username text default '',
  avatar_url text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Active le niveau de sécurité RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Politiques de sécurité pour les Profils
create policy "Les profils sont visibles par tous"
  on public.profiles for select
  using (true);

create policy "Les utilisateurs peuvent modifier leur propre profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Les utilisateurs peuvent insérer leur profil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Table des Titres / Sorties Exclusives
create table if not exists public.releases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  slug text unique,
  title text not null default 'Dans ma tête',
  artist_name text not null default 'Kaïna',
  access_code text not null default '0000',
  release_date text default '16 Octobre 2026',
  cover_url text,
  audio_url text,
  instrumental_url text,
  bio text,
  instagram_username text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.releases enable row level security;

create policy "Toutes les sorties sont consultables"
  on public.releases for select
  using (true);

create policy "Les artistes peuvent créer leurs propres sorties"
  on public.releases for insert
  with check (auth.uid() = user_id);

create policy "Les artistes peuvent modifier leurs propres sorties"
  on public.releases for update
  using (auth.uid() = user_id);

create policy "Les artistes peuvent supprimer leurs propres sorties"
  on public.releases for delete
  using (auth.uid() = user_id);

-- 3. Table des Fans / Auditeurs Débloqués
create table if not exists public.fans_access (
  id uuid default gen_random_uuid() primary key,
  release_id uuid references public.releases(id) on delete cascade not null,
  fan_email text not null,
  has_listened boolean default false,
  listened_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (release_id, fan_email)
);

alter table public.fans_access enable row level security;

create policy "Les fans peuvent enregistrer leur accès"
  on public.fans_access for insert
  with check (true);

create policy "Consultation des fans pour l'artiste créateur"
  on public.fans_access for select
  using (
    exists (
      select 1 from public.releases
      where public.releases.id = public.fans_access.release_id
      and public.releases.user_id = auth.uid()
    )
  );

-- 4. Déclencheur automatique à l'inscription d'un utilisateur Supabase
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, artist_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger pour créer automatiquement le profil
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
