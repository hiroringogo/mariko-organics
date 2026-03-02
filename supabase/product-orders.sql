create table product_orders (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  name text not null,
  email text not null,
  quantity int not null default 1,
  total_price numeric not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

alter table product_orders enable row level security;
create policy "Anyone can create orders" on product_orders for insert with check (true);
create policy "Anyone can view orders" on product_orders for select using (true);
create policy "Anyone can update orders" on product_orders for update using (true);
