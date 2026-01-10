-- Showcase feature tables
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  title text not null,
  description text,
  year int,
  cover_url text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_albums_festival on albums(festival_id);
create index if not exists idx_albums_year on albums(year);

do $$ begin
  create type media_kind as enum ('image','video','audio','pdf','other');
exception when duplicate_object then null; end $$;

create table if not exists media_items (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  type media_kind not null,
  title text,
  description text,
  url text not null,
  mime_type text,
  size_bytes bigint,
  duration_sec int,
  thumbnail_url text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_media_album on media_items(album_id);
create index if not exists idx_media_type on media_items(type);

-- Enable RLS and allow public CRUD (similar to other app tables)
alter table albums enable row level security;
alter table media_items enable row level security;

create policy if not exists albums_public_select on albums for select using (true);
create policy if not exists albums_public_insert on albums for insert with check (true);
create policy if not exists albums_public_update on albums for update using (true);
create policy if not exists albums_public_delete on albums for delete using (true);

create policy if not exists media_public_select on media_items for select using (true);
create policy if not exists media_public_insert on media_items for insert with check (true);
create policy if not exists media_public_update on media_items for update using (true);
create policy if not exists media_public_delete on media_items for delete using (true);

-- Note: Create a public storage bucket named 'showcase' in Supabase Storage and make it public.
-- App will upload files to storage and persist public URLs in media_items.url.
