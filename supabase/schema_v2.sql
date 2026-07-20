-- ============================================================
-- BoardroomAI — Schema v2: Live boardroom features
-- Run AFTER schema.sql, in Supabase SQL Editor.
-- Adds: realtime streaming, notes, financial projections,
--       confidence meter, interruptions.
-- ============================================================

-- ---------- 1. Confidence meter + interruptions ----------
-- Each debate message can carry the executive's confidence (0-100)
-- and a flag for dramatic interruptions.

alter table public.debate_messages
  add column if not exists confidence int
    check (confidence is null or (confidence between 0 and 100));

alter table public.debate_messages
  add column if not exists is_interruption boolean not null default false;

-- ---------- 2. Notes (the user's virtual notepad) ----------

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.board_meetings(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notes_meeting on public.notes(meeting_id);

alter table public.notes enable row level security;

drop policy if exists "notes_all_own" on public.notes;
create policy "notes_all_own" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 3. Financial projections (CFO output) ----------
-- One row per meeting per year. Frontend computes profit = revenue - costs
-- and shows alerts when profit is negative.

create table if not exists public.projections (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.board_meetings(id) on delete cascade,
  year        int not null check (year between 1 and 10),
  revenue     numeric(14,2) not null default 0,
  costs       numeric(14,2) not null default 0,
  growth      text,          -- e.g. "3x user growth expected"
  risks       text,          -- e.g. "CAC may exceed LTV in year 1"
  created_at  timestamptz not null default now(),
  unique (meeting_id, year)
);

create index if not exists idx_projections_meeting on public.projections(meeting_id);

alter table public.projections enable row level security;

drop policy if exists "projections_select_own" on public.projections;
create policy "projections_select_own" on public.projections
  for select using (
    exists (
      select 1 from public.board_meetings m
      where m.id = meeting_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "projections_write_own" on public.projections;
create policy "projections_write_own" on public.projections
  for insert with check (
    exists (
      select 1 from public.board_meetings m
      where m.id = meeting_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "projections_update_own" on public.projections;
create policy "projections_update_own" on public.projections
  for update using (
    exists (
      select 1 from public.board_meetings m
      where m.id = meeting_id and m.user_id = auth.uid()
    )
  );

-- ---------- 4. Realtime streaming ----------
-- Lets the frontend subscribe to new debate messages and meeting
-- status changes as they happen — the "live meeting" effect.

do $$ begin
  alter publication supabase_realtime add table public.debate_messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.board_meetings;
exception when duplicate_object then null; end $$;
