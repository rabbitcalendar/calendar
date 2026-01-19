-- Enable UUID extension if not enabled (Supabase usually has this by default)
create extension if not exists "uuid-ossp";

-- Create events table
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  date date not null,
  type text check (type in ('event', 'promotion', 'holiday', 'other')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create posts table
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  date date,
  platform text check (platform in ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok')),
  content_type text check (content_type in ('image', 'video', 'carousel', 'reel', 'story', 'text')),
  brief text,
  status text check (status in ('draft', 'scheduled', 'published', 'approved')),
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create project_settings table (singleton)
create table if not exists project_settings (
  id integer primary key default 1,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint single_row check (id = 1)
);

-- Enable Row Level Security (RLS)
alter table events enable row level security;
alter table posts enable row level security;
alter table project_settings enable row level security;

-- Create policies (for public access for now - REPLACE with authenticated policies for production)
-- These policies allow anyone with the anon key to read/write.
create policy "Public events access" on events for all using (true) with check (true);
create policy "Public posts access" on posts for all using (true) with check (true);
create policy "Public project settings access" on project_settings for all using (true) with check (true);

-- To use authenticated access instead:
-- 1. Remove the public policies above.
-- 2. Create policies that check for auth.uid():
-- create policy "User events access" on events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- (You would need to add a user_id column to tables)
