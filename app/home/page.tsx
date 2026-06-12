import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import TodaySchedule from '@/components/TodaySchedule';
import CourseCard from '@/components/CourseCard';
import { createClient } from '@/lib/supabase/server';
import { getUserStats, type UserStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

const EMPTY: UserStats = {
  totalFocusMinutes: 0,
  totalBreaks: 0,
  deepWorkSessions: 0,
  deepWorkBreaks: 0,
  distractionFreeMinutesBeforeFirstBreak: [],
  sessionsCompleted: 0,
  sessionsFailed: 0,
  weeklyFocusMinutes: [0, 0, 0, 0, 0, 0, 0],
  weeklyLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

async function getDashboardData() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { name: 'there', stats: EMPTY };

    const [{ data: profile }, stats] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      getUserStats(supabase, user.id),
    ]);

    return { name: profile?.full_name ?? 'there', stats };
  } catch {
    return { name: 'there', stats: EMPTY };
  }
}

export default async function HomePage() {
  const { name, stats: s } = await getDashboardData();

  const focusHours = (s.totalFocusMinutes / 60).toFixed(1);
  const avgBeforeBreak = s.distractionFreeMinutesBeforeFirstBreak.length
    ? Math.round(
        s.distractionFreeMinutesBeforeFirstBreak.reduce((a, b) => a + b, 0) /
          s.distractionFreeMinutesBeforeFirstBreak.length,
      )
    : 0;

  return (
    <main className="px-5 pb-28 pt-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl">Good morning, {name}.</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted">Discipline builds freedom.</p>
        </div>
        <span className="text-xl">🔔</span>
      </div>

      {/* Metrics */}
      <section className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl2 border border-border bg-panel p-4">
          <div className="text-2xl font-semibold text-accent">{focusHours}<span className="text-sm text-muted"> hrs</span></div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Focused this week</div>
        </div>
        <div className="rounded-xl2 border border-border bg-panel p-4">
          <div className="text-2xl font-semibold text-accent">{avgBeforeBreak}<span className="text-sm text-muted"> min</span></div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Avg before first break</div>
        </div>
        <div className="rounded-xl2 border border-border bg-panel p-4">
          <div className="text-2xl font-semibold text-text">{s.totalBreaks}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Breaks taken</div>
        </div>
        <div className="rounded-xl2 border border-border bg-panel p-4">
          <div className="text-2xl font-semibold text-text">{s.sessionsCompleted}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Sessions completed</div>
        </div>
      </section>

      {/* Course card */}
      <CourseCard />

      {/* Today's plan (from localStorage schedule) */}
      <TodaySchedule />

      {/* Start session CTA */}
      <Link
        href="/session"
        className="flex items-center justify-center gap-2 rounded-xl2 bg-accent py-4 text-center font-serif text-lg font-semibold text-ink"
      >
        ▶ Start Focus Session
      </Link>

      <BottomNav />
    </main>
  );
}
