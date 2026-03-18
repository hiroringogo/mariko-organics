-- Add referred_by column to bookings table
alter table bookings add column if not exists referred_by text;
