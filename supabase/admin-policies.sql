-- 管理者用のポリシー追加
create policy "Anyone can insert lessons" on lessons for insert with check (true);
create policy "Anyone can update lessons" on lessons for update using (true);
create policy "Anyone can delete lessons" on lessons for delete using (true);
create policy "Anyone can update bookings" on bookings for update using (true);
create policy "Anyone can delete bookings" on bookings for delete using (true);
