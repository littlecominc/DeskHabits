-- DeskHabits database schema (Supabase / Postgres)
-- Run this in the Supabase SQL editor.

-- Profiles: one row per authenticated user (mirrors auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  desk_habits_score int,           -- onboarding "dependency" score, 0-100
  daily_minutes int,                -- minutes/day they committed during onboarding
  baseline_focus_minutes int,       -- self-reported focus span before drift
  pledge_signed_at timestamptz,
  pledge_signature text,
  subscription_status text default 'free', -- 'free' | 'trialing' | 'active' | 'canceled'
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Classes / subjects a student is taking
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  name text not null,
  next_test_date date,
  syllabus_url text,
  created_at timestamptz default now()
);

-- Generated daily schedule blocks
create table if not exists schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  subject_id uuid references subjects (id) on delete set null,
  scheduled_date date not null,
  start_time time not null,
  duration_minutes int not null,
  block_type text not null check (block_type in ('deep','light','break')),
  status text not null default 'pending' check (status in ('pending','active','complete','skipped')),
  created_at timestamptz default now()
);

-- A single completed (or in-progress) study session
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  schedule_block_id uuid references schedule_blocks (id) on delete set null,
  subject_id uuid references subjects (id) on delete set null,
  session_type text not null check (session_type in ('deep','light','blitz')),
  goal text,
  micro_steps jsonb,                -- array of strings
  depth_rating int,                 -- 1-10, set during ritual
  planned_seconds int not null,
  actual_seconds int,
  brain_dump text,
  finished_goal boolean,
  failure_tags jsonb,               -- array of strings
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Every break taken during a session
create table if not exists breaks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions (id) on delete cascade,
  reason text check (reason in ('natural','focus_broke','need_to_think','water_movement')),
  pushed_back boolean default false, -- true if app suggested "5 more minutes" first
  taken_at_seconds int,               -- elapsed seconds into session when break began
  duration_seconds int,
  created_at timestamptz default now()
);

-- Distraction-button presses during a session
create table if not exists distractions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions (id) on delete cascade,
  elapsed_seconds int not null,
  note text,
  created_at timestamptz default now()
);

-- Mid-session depth-dial check-ins (1-5)
create table if not exists depth_checks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions (id) on delete cascade,
  elapsed_seconds int not null,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- Discipline tower / streaks (one row per user, updated incrementally)
create table if not exists progress (
  user_id uuid primary key references profiles (id) on delete cascade,
  stones int default 0,
  current_streak int default 0,
  longest_streak int default 0,
  discipline_score int default 50,
  attention_score int default 50,
  resilience_score int default 50,
  updated_at timestamptz default now()
);

-- Accountability / peer groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists group_members (
  group_id uuid references groups (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table schedule_blocks enable row level security;
alter table sessions enable row level security;
alter table breaks enable row level security;
alter table distractions enable row level security;
alter table depth_checks enable row level security;
alter table progress enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own subjects" on subjects for all using (auth.uid() = user_id);
create policy "own schedule" on schedule_blocks for all using (auth.uid() = user_id);
create policy "own sessions" on sessions for all using (auth.uid() = user_id);
create policy "own breaks" on breaks for all using (
  auth.uid() = (select user_id from sessions where sessions.id = breaks.session_id)
);
create policy "own distractions" on distractions for all using (
  auth.uid() = (select user_id from sessions where sessions.id = distractions.session_id)
);
create policy "own depth checks" on depth_checks for all using (
  auth.uid() = (select user_id from sessions where sessions.id = depth_checks.session_id)
);
create policy "own progress" on progress for all using (auth.uid() = user_id);
