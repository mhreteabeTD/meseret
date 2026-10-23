-- Meseret analytics: paste into Supabase → SQL Editor → Run (once).
-- One table of events from the app; views that answer retention, engagement and learning questions.
-- The app writes with the public "anon" key: insert only, never read. Read the views in the Supabase Table Editor
-- or connect Looker Studio / Google Sheets to them.

create table if not exists events (
  id bigint generated always as identity primary key,
  sid text not null,                -- anonymous student id, created on the phone
  at timestamptz not null,          -- when it happened on the phone
  received timestamptz not null default now(),
  kind text not null,               -- session, chapter_open, section_done, answer, practice_start/done, test_start/done, book_start/done, feedback, install, refresher, translate
  lesson text, item text,
  data jsonb not null default '{}'::jsonb,
  grades text, lang text, code text, version text
);
create index if not exists events_sid_at on events (sid, at);
create index if not exists events_kind_at on events (kind, at);
create index if not exists events_lesson on events (lesson);

alter table events enable row level security;
drop policy if exists "app inserts" on events;
create policy "app inserts" on events for insert to anon with check (true);
-- no select policy for anon: the app cannot read anything back

-- ---------- Views (read in the Table Editor, or from Looker Studio) ----------

-- One row per student: first day, last day, days active, sessions
create or replace view students as
select sid,
  min(at)::date as first_day, max(at)::date as last_day,
  count(distinct at::date) as active_days,
  count(*) filter (where kind = 'session') as sessions,
  count(*) filter (where kind = 'answer') as answers,
  count(*) filter (where kind = 'section_done') as sections_done,
  max(grades) as grades, max(code) as class_code, max(lang) as lang
from events group by sid;

-- Daily and weekly active students
create or replace view daily_active as
select at::date as day, count(distinct sid) as students, count(*) filter (where kind = 'answer') as answers
from events group by 1 order by 1 desc;

create or replace view weekly_active as
select date_trunc('week', at)::date as week, count(distinct sid) as students,
  count(distinct sid) filter (where sid in (select sid from students where first_day >= date_trunc('week', events.at)::date)) as new_students
from events group by 1 order by 1 desc;

-- Retention: of students who first appeared on a given day, how many came back 1, 7 and 30 days later (or any time after)
create or replace view retention as
with s as (select sid, first_day from students),
back as (select e.sid, e.at::date - s.first_day as d from events e join s using (sid) where e.at::date > s.first_day group by 1, 2)
select first_day as cohort_day, count(*) as students,
  count(*) filter (where sid in (select sid from back where d = 1)) as day1,
  count(*) filter (where sid in (select sid from back where d between 5 and 9)) as day7,
  count(*) filter (where sid in (select sid from back where d between 25 and 35)) as day30,
  count(*) filter (where sid in (select sid from back)) as came_back
from s group by 1 order by 1 desc;

-- Funnel: opened → chose grade → opened a chapter → finished a section → finished a test → installed
create or replace view funnel as
select
  count(distinct sid) as opened,
  count(distinct sid) filter (where grades <> '') as chose_grade,
  count(distinct sid) filter (where kind = 'chapter_open') as opened_chapter,
  count(distinct sid) filter (where kind = 'section_done') as finished_section,
  count(distinct sid) filter (where kind = 'test_done') as finished_test,
  count(distinct sid) filter (where kind = 'install' and data->>'install' = 'done') as installed
from events;

-- Learning: per lesson, first-try accuracy by difficulty level
create or replace view lesson_scores as
select lesson,
  count(*) as answers, count(distinct sid) as students,
  round(100.0 * count(*) filter (where (data->>'correct')::boolean and (data->>'attempt')::int = 1) / nullif(count(*), 0)) as first_try_pct,
  round(100.0 * count(*) filter (where (data->>'correct')::boolean) / nullif(count(*), 0)) as eventually_pct
from events where kind = 'answer' group by 1 order by first_try_pct nulls last;

-- Hardest questions: items most often wrong on the first try (min 5 answers)
create or replace view hard_items as
select lesson, item, count(*) as answers,
  round(100.0 * count(*) filter (where not (data->>'correct')::boolean and (data->>'attempt')::int = 1) / count(*)) as wrong_first_try_pct
from events where kind = 'answer' and (data->>'attempt')::int = 1 group by 1, 2 having count(*) >= 5 order by 4 desc, 3 desc;

-- Tests: scores and time per attempt
create or replace view test_results as
select sid, at, lesson, (data->>'right')::int as right_answers, (data->>'n')::int as questions,
  round((data->>'ms')::numeric / 60000, 1) as minutes, data->'byLevel' as by_level, code as class_code
from events where kind = 'test_done' order by at desc;

-- Where students stop: last section each student finished per chapter
create or replace view drop_off as
select data->>'chapter' as chapter, lesson, count(distinct sid) as students_finished
from events where kind = 'section_done' group by 1, 2 order by 1, 2;

-- Per class (class code), for teachers
create or replace view class_summary as
select code as class_code, count(distinct sid) as students, count(*) filter (where kind = 'answer') as answers,
  count(*) filter (where kind = 'section_done') as sections_done, max(at)::date as last_active
from events where code is not null group by 1 order by 1;
