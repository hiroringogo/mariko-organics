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
  price numeric not null default 52,
  image_url text,
  workshop_title text,
  workshop_subtitle text,
  is_published boolean not null default false,
  is_member_published boolean not null default false,
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
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
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
insert into lessons (title, date, start_time, end_time, total_seats, min_seats, price, workshop_title, workshop_subtitle, description) values
  ('火曜クラス', '2026-03-10', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('水曜クラス', '2026-03-11', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('金曜クラス', '2026-03-13', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('土曜クラス', '2026-03-14', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('月曜クラス', '2026-03-16', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('火曜クラス', '2026-03-17', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('木曜クラス', '2026-03-19', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('金曜クラス', '2026-03-20', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('月曜クラス', '2026-03-23', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('火曜クラス', '2026-03-24', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。'),
  ('水曜クラス', '2026-03-25', '10:00', '13:00', 6, 4, 52, 'Gluten Free Workshop', 'Namagome Pão de Ló', 'ポルトガルをテーマに、本場のお菓子パン・ド・ローを作ります。カステラのルーツと言われるふわふわのスポンジケーキを、生米から。ランチにはポルトガル風リゾット付き。');

-- マイページからのキャンセル用（status更新を許可）
create policy "Anyone can update booking status" on bookings for update using (true) with check (true);

-- 会員テーブル（メールアドレスで会員判定）
create table members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz default now()
);

alter table members enable row level security;
create policy "Anyone can check membership" on members for select using (true);
create policy "Anyone can manage members" on members for insert with check (true);
create policy "Anyone can delete members" on members for delete using (true);
