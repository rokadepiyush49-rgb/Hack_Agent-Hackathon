-- ============================================================
-- BoardroomAI — Database Schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run (idempotent where possible).
-- ============================================================

-- ---------- ENUMS ----------

do $$ begin
  create type meeting_status as enum ('pending', 'in_progress', 'completed', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type final_decision as enum ('invest', 'pivot', 'reject');
exception when duplicate_object then null; end $$;

do $$ begin
  create type agent_role as enum ('ceo', 'cto', 'cfo', 'cmo', 'vc', 'moderator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type score_category as enum (
    'market_opportunity', 'technology', 'finance', 'marketing',
    'innovation', 'execution', 'risk'
  );
exception when duplicate_object then null; end $$;

-- ---------- TABLES ----------

-- 1. Profiles: one row per auth user, auto-created by trigger below.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Pitches: the founder's startup idea (entry point of the app).
create table if not exists public.pitches (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  startup_name      text not null,
  problem_statement text not null,
  solution          text not null,
  target_audience   text not null,
  business_model    text not null,
  revenue_model     text not null,
  deck_path         text,          -- storage path of uploaded pitch deck (optional)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 3. Board meetings: one debate session over a pitch.
create table if not exists public.board_meetings (
  id             uuid primary key default gen_random_uuid(),
  pitch_id       uuid not null references public.pitches(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  status         meeting_status not null default 'pending',
  decision       final_decision,          -- null until completed
  overall_score  numeric(4,1),            -- e.g. 72.5
  started_at     timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz not null default now()
);

-- 4. Debate messages: what each executive says, in order.
create table if not exists public.debate_messages (
  id           uuid primary key default gen_random_uuid(),
  meeting_id   uuid not null references public.board_meetings(id) on delete cascade,
  agent        agent_role not null,
  content      text not null,
  round        int not null default 1,   -- debate round number
  order_index  int not null,             -- global ordering within the meeting
  created_at   timestamptz not null default now()
);

-- 5. Scores: each executive scores each category.
create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.board_meetings(id) on delete cascade,
  agent       agent_role not null,
  category    score_category not null,
  value       int not null check (value between 0 and 100),
  created_at  timestamptz not null default now(),
  unique (meeting_id, agent, category)
);

-- 6. Reports: the AI-generated executive report (JSON, rendered by frontend).
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null unique references public.board_meetings(id) on delete cascade,
  content     jsonb not null,  -- { executive_summary, strengths, weaknesses, risks, swot, verdict, action_plan, investor_memo }
  created_at  timestamptz not null default now()
);

-- ---------- INDEXES ----------

create index if not exists idx_pitches_user        on public.pitches(user_id);
create index if not exists idx_meetings_pitch      on public.board_meetings(pitch_id);
create index if not exists idx_meetings_user       on public.board_meetings(user_id);
create index if not exists idx_messages_meeting    on public.debate_messages(meeting_id, order_index);
create index if not exists idx_scores_meeting      on public.scores(meeting_id);

-- ---------- TRIGGERS ----------

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_pitches_updated on public.pitches;
create trigger trg_pitches_updated
  before update on public.pitches
  for each row execute function public.set_updated_at();

-- ---------- ROW LEVEL SECURITY ----------
-- Rule: users can only touch their own data. The service role key
-- (server-side only) bypasses RLS for the AI pipeline when needed.

alter table public.profiles        enable row level security;
alter table public.pitches         enable row level security;
alter table public.board_meetings  enable row level security;
alter table public.debate_messages enable row level security;
alter table public.scores          enable row level security;
alter table public.reports         enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Pitches
drop policy if exists "pitches_all_own" on public.pitches;
create policy "pitches_all_own" on public.pitches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Board meetings
drop policy if exists "meetings_all_own" on public.board_meetings;
create policy "meetings_all_own" on public.board_meetings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Debate messages: readable if you own the parent meeting.
-- Inserts happen server-side (service role) or by the owner.
drop policy if exists "messages_select_own" on public.debate_messages;
create policy "messages_select_own" on public.debate_messages
  for select using (
    exists (
      select 1 from public.board_meetings m
      where m.id = meeting_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_own" on public.debate_messages;
create policy "messages_insert_own" on public.debate_messages
  for insert with check (
    exists (
      select 1 from public.board_meetings m
      where m.id = meeting_id and m.user_id = auth.uid()
    )
  );

-- Scores: same pattern.
drop policy if exists "scores_select_own" on public.scores;
create policy "scores_select_own" on public.scores
  for select using (
    exists (
      select 1 from public.board_meetings m
      where m.id = meeting_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "scores_insert_own" on public.scores;
create policy "scores_insert_own" on public.scores
  for insert with check (
    exists (
      select 1 from public.board_meetings m
      where m.id = meeting_id and m.user_id = auth.uid()
    )
  );

-- Reports: same pattern.
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (
    exists (
      select 1 from public.board_meetings m
      where m.id = meeting_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (
    exists (
      select 1 from public.board_meetings m
      where m.id = meeting_id and m.user_id = auth.uid()
    )
  );

-- ---------- STORAGE ----------
-- Private bucket for pitch decks. Files stored at: {user_id}/{filename}

insert into storage.buckets (id, name, public)
values ('pitch-decks', 'pitch-decks', false)
on conflict (id) do nothing;

drop policy if exists "decks_insert_own" on storage.objects;
create policy "decks_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'pitch-decks'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "decks_select_own" on storage.objects;
create policy "decks_select_own" on storage.objects
  for select using (
    bucket_id = 'pitch-decks'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "decks_delete_own" on storage.objects;
create policy "decks_delete_own" on storage.objects
  for delete using (
    bucket_id = 'pitch-decks'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
