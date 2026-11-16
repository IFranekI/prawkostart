-- Schemat Supabase: platforma teorii prawa jazdy kat. B
create table categories(id serial primary key, slug text unique not null, name text not null, position int not null);

create table questions(
  id serial primary key,
  number int unique not null,                       -- unikalny numer pytania
  category_id int references categories(id),
  text text not null,
  kind text not null check (kind in ('basic','specialist')),  -- basic = TAK/NIE, specialist = A/B/C
  answer_a text, answer_b text, answer_c text,
  correct text not null check (correct in ('T','N','A','B','C')),
  media text,                                        -- nazwa pliku zdjęcia/filmu
  points int not null check (points between 1 and 3),
  explanation text,
  source text not null default 'KATALOG 07/2026',
  active boolean not null default true
);
create index on questions(category_id); create index on questions(kind, points) where active;

create table profiles(id uuid primary key references auth.users on delete cascade,
  display_name text, is_admin boolean not null default false, daily_goal int not null default 20,
  remove_correct_from_wrong boolean not null default false, created_at timestamptz default now());

create table attempts(id bigserial primary key, user_id uuid not null references auth.users on delete cascade,
  question_id int not null references questions on delete cascade, answer text not null, is_correct boolean not null,
  mode text not null check (mode in ('learn','exam','review')), exam_id uuid, created_at timestamptz default now());
create index on attempts(user_id, created_at desc); create index on attempts(user_id, question_id);

create table wrong_questions(user_id uuid references auth.users on delete cascade, question_id int references questions on delete cascade,
  last_answer text not null, wrong_count int not null default 1, updated_at timestamptz default now(), primary key(user_id, question_id));
create table favorites(user_id uuid references auth.users on delete cascade, question_id int references questions on delete cascade,
  created_at timestamptz default now(), primary key(user_id, question_id));

create table exams(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  started_at timestamptz not null default now(), finished_at timestamptz, score int, max_score int not null default 74,
  passed boolean, question_ids int[] not null);
create table question_reports(id bigserial primary key, user_id uuid references auth.users, question_id int references questions on delete cascade,
  message text not null, status text not null default 'open', created_at timestamptz default now());

-- Losowanie egzaminu: 20 podst. (10x3, 6x2, 4x1 = 46 pkt) + 12 spec. (6x3, 4x2, 2x1 = 28 pkt) = 74 pkt
create or replace function draw_exam() returns setof questions language sql security definer as $$
  (select * from (select * from questions where active and kind='basic' and points=3 order by random() limit 10) a)
  union all (select * from (select * from questions where active and kind='basic' and points=2 order by random() limit 6) b)
  union all (select * from (select * from questions where active and kind='basic' and points=1 order by random() limit 4) c)
  union all (select * from (select * from questions where active and kind='specialist' and points=3 order by random() limit 6) d)
  union all (select * from (select * from questions where active and kind='specialist' and points=2 order by random() limit 4) e)
  union all (select * from (select * from questions where active and kind='specialist' and points=1 order by random() limit 2) f);
$$;

-- RLS
alter table profiles enable row level security; alter table attempts enable row level security;
alter table wrong_questions enable row level security; alter table favorites enable row level security;
alter table exams enable row level security; alter table question_reports enable row level security;
alter table questions enable row level security; alter table categories enable row level security;
create policy "read categories" on categories for select using (true);
create policy "read questions" on questions for select using (active or exists(select 1 from profiles p where p.id=auth.uid() and p.is_admin));
create policy "admin write questions" on questions for all using (exists(select 1 from profiles p where p.id=auth.uid() and p.is_admin));
create policy "own profile" on profiles for all using (id=auth.uid());
create policy "own attempts" on attempts for all using (user_id=auth.uid());
create policy "own wrong" on wrong_questions for all using (user_id=auth.uid());
create policy "own favs" on favorites for all using (user_id=auth.uid());
create policy "own exams" on exams for all using (user_id=auth.uid());
create policy "own reports" on question_reports for insert with check (user_id=auth.uid());
create policy "admin reports" on question_reports for all using (exists(select 1 from profiles p where p.id=auth.uid() and p.is_admin));
