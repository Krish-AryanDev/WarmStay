-- StudentPG MVP schema. Single table, JSONB for nested data.
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists pgs (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  address       text not null,
  area          text,
  distance_km   numeric(4,2),
  gender        text not null check (gender in ('boys','girls','both')),
  starting_price integer not null,
  owner_name    text,
  owner_phone   text,
  amenities     jsonb not null default '{}'::jsonb,
  room_types    jsonb not null default '[]'::jsonb,
  photos        jsonb not null default '[]'::jsonb,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists pgs_active_idx on pgs (is_active);
create index if not exists pgs_gender_idx on pgs (gender);
create index if not exists pgs_price_idx  on pgs (starting_price);

-- Public read access for active listings only.
alter table pgs enable row level security;

drop policy if exists "public read active pgs" on pgs;
create policy "public read active pgs"
  on pgs for select
  using (is_active = true);

-- Inquiries table: stores form submissions even though WhatsApp is the primary channel,
-- so we keep a record if the student abandons the WA step.
create table if not exists inquiries (
  id              uuid primary key default gen_random_uuid(),
  pg_id           uuid references pgs(id) on delete set null,
  pg_slug         text,
  student_name    text not null,
  student_phone   text not null,
  move_in_date    date,
  budget          integer,
  room_preference text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists inquiries_pg_idx on inquiries (pg_id);
create index if not exists inquiries_created_idx on inquiries (created_at desc);

alter table inquiries enable row level security;

-- Anyone can insert; nobody can read via the anon key (admin reads in Studio).
drop policy if exists "anyone can submit inquiry" on inquiries;
create policy "anyone can submit inquiry"
  on inquiries for insert
  with check (true);
