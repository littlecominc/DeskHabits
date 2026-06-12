import BottomNav from '@/components/BottomNav';
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

async function loadStats(): Promise<UserStats> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return EMPTY;
    return await getUserStats(supabase, user.id);
  } catch {
    return EMPTY;
  }
}

export default async function InsightsPage() {
  const i = await loadStats();
  const max = Math.max(1, ...i.weeklyFocusMinutes);
  const hasAny = i.weeklyFocusMinutes.some((m) => m > 0);

  return (
    <main className="px-5 pb-28 pt-8">
      <h1 className="mb-1 font-serif text-2xl">Insights</h1>
      <p className="mb-6 text-xs uppercase tracking-widest text-muted">The receipts.</p>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-4 font-serif text-lg">Focus minutes this week</div>
        {hasAny ? (
          <div className="flex h-32 items-end justify-between gap-2">
            {i.weeklyFocusMinutes.map((minutes, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-accent"
                  style={{ height: `${(minutes / max) * 100}%` }}
                />
                <span className="text-[10px] text-muted">{i.weeklyLabels[idx]}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No sessions logged yet this week.</p>
        )}
      </section>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl2 border border-border bg-panel p-4">
          <div className="text-2xl font-bold text-green">{i.sessionsCompleted}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Sessions Completed</div>
        </div>
        <div className="rounded-xl2 border border-border bg-panel p-4">
          <div className="text-2xl font-bold text-red">{i.sessionsFailed}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Sessions Failed</div>
        </div>
      </section>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5 text-sm text-muted">
        You logged <span className="text-text">{i.totalBreaks}</span> break{i.totalBreaks === 1 ? '' : 's'} this week. See the Analytics tab for
        the math behind how these affect your focus.
      </section>

      <BottomNav />
    </main>
  );
}
