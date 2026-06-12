// Real, computed stats — pulled from the sessions/breaks tables.
// Every number here is derived from rows the user actually created.
// New accounts with no sessions yet get honest zeros, not placeholder data.

import { SupabaseClient } from '@supabase/supabase-js';

export type UserStats = {
  totalFocusMinutes: number;
  totalBreaks: number;
  deepWorkSessions: number;
  deepWorkBreaks: number;
  distractionFreeMinutesBeforeFirstBreak: number[]; // per deep-work session, most recent first
  sessionsCompleted: number;
  sessionsFailed: number;
  weeklyFocusMinutes: number[]; // Mon-Sun, this week
  weeklyLabels: string[];
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export async function getUserStats(supabase: SupabaseClient, userId: string): Promise<UserStats> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, session_type, planned_seconds, actual_seconds, finished_goal, started_at, ended_at')
    .eq('user_id', userId)
    .gte('started_at', sevenDaysAgo.toISOString())
    .order('started_at', { ascending: false });

  const rows = sessions ?? [];
  const sessionIds = rows.map((r) => r.id);

  let breaks: { session_id: string; reason: string; duration_seconds: number | null; taken_at_seconds: number | null }[] = [];
  if (sessionIds.length) {
    const { data } = await supabase
      .from('breaks')
      .select('session_id, reason, duration_seconds, taken_at_seconds')
      .in('session_id', sessionIds);
    breaks = data ?? [];
  }

  const totalFocusMinutes = Math.round(rows.reduce((s, r) => s + (r.actual_seconds ?? 0), 0) / 60);
  const totalBreaks = breaks.length;
  const deepSessions = rows.filter((r) => r.session_type === 'deep');
  const deepWorkSessions = deepSessions.length;
  const deepSessionIds = new Set(deepSessions.map((r) => r.id));
  const deepWorkBreaks = breaks.filter((b) => deepSessionIds.has(b.session_id)).length;

  // For each deep-work session, minutes elapsed before the first break (or full session if none)
  const distractionFreeMinutesBeforeFirstBreak = deepSessions.map((r) => {
    const sessionBreaks = breaks.filter((b) => b.session_id === r.id);
    const firstBreakSeconds = sessionBreaks.length
      ? Math.min(...sessionBreaks.map((b) => b.taken_at_seconds ?? Infinity))
      : r.actual_seconds ?? 0;
    return Math.round((isFinite(firstBreakSeconds) ? firstBreakSeconds : r.actual_seconds ?? 0) / 60);
  });

  const sessionsCompleted = rows.filter((r) => r.finished_goal === true).length;
  const sessionsFailed = rows.filter((r) => r.finished_goal === false).length;

  // Weekly focus minutes, Mon-Sun of the current week
  const weeklyFocusMinutes = [0, 0, 0, 0, 0, 0, 0];
  for (const r of rows) {
    if (!r.started_at) continue;
    const d = new Date(r.started_at);
    const dow = (d.getDay() + 6) % 7; // Mon=0..Sun=6
    weeklyFocusMinutes[dow] += Math.round((r.actual_seconds ?? 0) / 60);
  }

  return {
    totalFocusMinutes,
    totalBreaks,
    deepWorkSessions,
    deepWorkBreaks,
    distractionFreeMinutesBeforeFirstBreak,
    sessionsCompleted,
    sessionsFailed,
    weeklyFocusMinutes,
    weeklyLabels: DAY_LABELS,
  };
}
