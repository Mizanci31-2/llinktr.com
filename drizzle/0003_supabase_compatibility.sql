create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  "openId" varchar(128) unique not null,
  email varchar(320),
  name text,
  "loginMethod" varchar(64),
  role varchar(32),
  "lastSignedIn" timestamp default now(),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table if exists public.profiles drop constraint if exists profiles_user_id_fkey;
alter table if exists public.links drop constraint if exists links_user_id_fkey;
alter table if exists public.profiles alter column avatar_url type text;

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists links_user_id_idx on public.links(user_id);

do $$ begin
  create type public.type as enum ('heading','description','text','link','social','location','divider','profile_image');
exception when duplicate_object then null; end $$;

create table if not exists public.bio_pages (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  slug varchar(100) unique not null,
  title varchar(200) not null,
  description text,
  "profileImageUrl" text,
  theme varchar(50) default 'dark_grid',
  "accentColor" varchar(20) default '#DFFF00',
  selected_theme_id varchar(50),
  text_color varchar(20) default '#F8FAFC',
  custom_background_image_url text,
  theme_category varchar(24),
  "isPublished" boolean default true,
  views integer default 0,
  "todayClicks" integer default 0,
  "todayViews" integer default 0,
  "statsDate" varchar(10),
  "createdAt" timestamp default now(),
  "updatedAt" timestamp default now()
);

create table if not exists public.bio_blocks (
  id bigint generated always as identity primary key,
  "pageId" bigint not null,
  type public.type not null,
  "sortOrder" integer default 0,
  "isEnabled" boolean default true,
  clicks integer default 0,
  data json,
  "createdAt" timestamp default now(),
  "updatedAt" timestamp default now()
);

create table if not exists public.short_links (
  id bigint generated always as identity primary key,
  user_id uuid,
  "originalUrl" text not null,
  code varchar(20) unique not null,
  clicks integer default 0,
  "createdAt" timestamp default now()
);
