-- Fix for Showcase RLS issues
-- Run this in Supabase SQL Editor if you're getting RLS policy errors

-- First, drop existing policies to avoid conflicts
drop policy if exists albums_public_select on albums;
drop policy if exists albums_public_insert on albums;
drop policy if exists albums_public_update on albums;
drop policy if exists albums_public_delete on albums;

drop policy if exists media_public_select on media_items;
drop policy if exists media_public_insert on media_items;
drop policy if exists media_public_update on media_items;
drop policy if exists media_public_delete on media_items;

-- Recreate policies with explicit permissions
create policy albums_public_select on albums
  for select using (true);

create policy albums_public_insert on albums
  for insert with check (true);

create policy albums_public_update on albums
  for update using (true) with check (true);

create policy albums_public_delete on albums
  for delete using (true);

create policy media_public_select on media_items
  for select using (true);

create policy media_public_insert on media_items
  for insert with check (true);

create policy media_public_update on media_items
  for update using (true) with check (true);

create policy media_public_delete on media_items
  for delete using (true);

-- Verify RLS is enabled
alter table albums enable row level security;
alter table media_items enable row level security;

-- Grant permissions to authenticated and anon roles (if needed)
grant usage on schema public to anon, authenticated;
grant all on table albums to anon, authenticated;
grant all on table media_items to anon, authenticated;

-- Verify the type exists
do $$ begin
  create type media_kind as enum ('image','video','audio','pdf','other');
exception when duplicate_object then null; end $$;
