-- Timer pushes are now Vercel Workflow runs, cancelled by run ID, so the
-- QStash message ID mapping is no longer used.
--
-- Run this only once the Workflows version has been live for a day: pushes
-- QStash had already queued fail either way (the in-app timer still alarms),
-- but nothing should be reading this table by then.
drop table if exists push_timers;
