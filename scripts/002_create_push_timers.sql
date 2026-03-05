-- Push timer notifications table
-- Stores QStash message IDs for timer cancellation
create table if not exists push_timers (
  id uuid default gen_random_uuid() primary key,
  timer_id text not null,
  qstash_message_id text,
  label text not null,
  fire_at timestamptz not null,
  created_at timestamptz default now(),

  -- prevent duplicate timers
  constraint push_timers_timer_id_key unique (timer_id)
);

-- RLS: allow all operations (no auth in this app)
alter table push_timers enable row level security;
create policy "Allow all push_timers operations" on push_timers
  for all using (true) with check (true);
