-- Push timer notifications table
-- Stores scheduled push notifications for cooking timers
create table if not exists push_timers (
  id uuid default gen_random_uuid() primary key,
  timer_id text not null,
  endpoint text not null,
  subscription jsonb not null,
  label text not null,
  fire_at timestamptz not null,
  created_at timestamptz default now(),

  -- prevent duplicate timers
  constraint push_timers_timer_id_key unique (timer_id)
);

-- Index for cron query: find due timers
create index if not exists push_timers_fire_at_idx on push_timers (fire_at);

-- Cleanup policy: auto-delete rows older than 24h
-- (run manually or via pg_cron if available)
-- delete from push_timers where created_at < now() - interval '24 hours';

-- RLS: allow all operations (no auth in this app)
alter table push_timers enable row level security;
create policy "Allow all push_timers operations" on push_timers
  for all using (true) with check (true);
