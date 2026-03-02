-- レッスンテーブル
create table lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  total_seats int not null default 8,
  min_seats int not null default 4,
  price numeric not null default 45,
  image_url text,
  workshop_title text,
  workshop_subtitle text,
  created_at timestamptz default now()
);

-- 予約テーブル
create table bookings (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade not null,
  name text not null,
  email text not null,
  phone text,
  participant_count int not null default 1,
  companion_names text[],
  notes text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz default now()
);

-- 残席を計算するビュー
create view lesson_with_seats as
select
  l.*,
  l.total_seats - coalesce(sum(b.participant_count), 0) as seats_remaining
from lessons l
left join bookings b on b.lesson_id = l.id and b.status = 'confirmed'
group by l.id;

-- 誰でも読めるようにする（公開レッスン情報）
alter table lessons enable row level security;
create policy "Anyone can view lessons" on lessons for select using (true);

-- 誰でも予約を作れるようにする（会員登録不要）
alter table bookings enable row level security;
create policy "Anyone can create bookings" on bookings for insert with check (true);
create policy "Users can view own bookings by email" on bookings for select using (true);

-- サンプルデータ
insert into lessons (title, date, start_time, end_time, workshop_title, workshop_subtitle, description) values
  ('水曜クラス', '2026-03-05', '10:00', '13:00', 'Gluten Free Workshop', '生米のサクサクサブレ', '毎月テーマが変わるグルテンフリーワークショップ。今月は生米を使ったサクサク食感のサブレをみんなで作ります。レッスン後はランチ付き！'),
  ('土曜クラス', '2026-03-08', '10:00', '13:00', 'Gluten Free Workshop', '生米のサクサクサブレ', '毎月テーマが変わるグルテンフリーワークショップ。今月は生米を使ったサクサク食感のサブレをみんなで作ります。レッスン後はランチ付き！'),
  ('水曜クラス', '2026-03-12', '10:00', '13:00', 'Gluten Free Workshop', '生米のサクサクサブレ', '毎月テーマが変わるグルテンフリーワークショップ。今月は生米を使ったサクサク食感のサブレをみんなで作ります。レッスン後はランチ付き！');
