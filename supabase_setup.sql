-- Reset Database (Drop existing tables to ensure clean schema)
-- WARNING: This deletes all existing data!
drop table if exists public.events cascade;
drop table if exists public.posts cascade;
drop table if exists public.clients cascade;
drop table if exists public.project_settings cascade;

-- Create Clients Table
create table public.clients (
  id text primary key,
  name text not null,
  username text not null unique,
  password text not null, -- Note: In a real app, use Supabase Auth instead of storing passwords
  role text not null check (role in ('agency', 'client')),
  theme_color text default 'indigo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Events Table
create table public.events (
  id text primary key,
  "clientId" text references public.clients(id) on delete cascade not null,
  title text not null,
  date date not null,
  type text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Posts Table
create table public.posts (
  id text primary key,
  "clientId" text references public.clients(id) on delete cascade not null,
  title text not null,
  date date,
  platform text not null,
  content_type text not null,
  brief text,
  status text not null default 'draft',
  image_url text,
  images text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Project Settings Table
create table public.project_settings (
  id int primary key default 1,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Initial Data (Demo Users)
insert into public.clients (id, name, username, password, role)
values 
  ('1', 'Rabbit', 'rabbit', 'password123', 'agency'),
  ('2', 'Coca Cola', 'coke', 'password123', 'client')
on conflict (id) do update 
set name = EXCLUDED.name, username = EXCLUDED.username, password = EXCLUDED.password;

-- Insert Initial Project Settings
insert into public.project_settings (id, name)
values (1, 'ContentCal')
on conflict (id) do nothing;

-- Enable Row Level Security (RLS) - Optional but recommended
alter table public.clients enable row level security;
alter table public.events enable row level security;
alter table public.posts enable row level security;
alter table public.project_settings enable row level security;

-- Create basic policies (Open access for now to match current app logic)
-- You can refine these later to restrict access based on auth.uid() if you switch to Supabase Auth
create policy "Enable all access for all users" on public.clients for all using (true);
create policy "Enable all access for all users" on public.events for all using (true);
create policy "Enable all access for all users" on public.posts for all using (true);
create policy "Enable all access for all users" on public.project_settings for all using (true);