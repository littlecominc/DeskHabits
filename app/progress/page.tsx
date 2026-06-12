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

export default async function AnalyticsPage() {
  const s = await loadStats();
  const totalSessions = s.sessionsCompleted + s.sessionsFailed;

  const delayedGratList = s.distractionFreeMinutesBeforeFirstBreak;
  const delayedGratAvg = delayedGratList.length
    ? delayedGratList.reduce((a, b) => a + b, 0) / delayedGratList.length
    : 0;

  const attentionRatio = s.totalFocusMinutes > 0 ? (s.totalFocusMinutes - s.deepWorkBreaks * 10) / s.totalFocusMinutes : 0;
  const breaksPerDeepSession = s.deepWorkSessions > 0 ? s.deepWorkBreaks / s.deepWorkSessions : 0;
  const completionRate = totalSessions > 0 ? s.sessionsCompleted / totalSessions : 0;

  return (
    <main className="px-5 pb-28 pt-8">
      <h1 className="mb-1 font-serif text-2xl">Analytics</h1>
      <p className="mb-6 text-xs uppercase tracking-widest text-muted">The math behind your focus.</p>

      {totalSessions === 0 ? (
        <section className="mb-5 rounded-xl2 border border-border bg-panel p-5 text-sm text-muted">
          Complete your first work session to start seeing your numbers here.
        </section>
      ) : (
        <>
          <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
            <div className="mb-1 font-serif text-lg">Delayed Gratification Score</div>
            <div className="mb-2 text-3xl font-bold text-accent">{delayedGratAvg.toFixed(1)} <span className="text-sm text-muted">min</span></div>
            <p className="text-xs text-muted">
              Average uninterrupted focus time before your first break, across your last{' '}
              {delayedGratList.length} deep work session{delayedGratList.length === 1 ? '' : 's'}.
            </p>
            {delayedGratList.length > 0 && (
              <div className="mt-3 rounded-lg bg-panel2 p-3 font-mono text-[11px] text-muted">
                ({delayedGratList.join(' + ')}) ÷ {delayedGratList.length} = {delayedGratAvg.toFixed(1)} min
              </div>
            )}
          </section>

          <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
            <div className="mb-1 font-serif text-lg">Attention Ratio</div>
            <div className="mb-2 text-3xl font-bold text-accent">{Math.round(attentionRatio * 100)}%</div>
            <p className="text-xs text-muted">Share of your total focus time that wasn't lost to breaks during deep work.</p>
            {s.totalFocusMinutes > 0 && (
              <div className="mt-3 rounded-lg bg-panel2 p-3 font-mono text-[11px] text-muted">
                ({s.totalFocusMinutes} − {s.deepWorkBreaks} × 10) ÷ {s.totalFocusMinutes} = {Math.round(attentionRatio * 100)}%
              </div>
            )}
          </section>

          <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
            <div className="mb-1 font-serif text-lg">Breaks per Deep Work Session</div>
            <div className="mb-2 text-3xl font-bold text-accent">{breaksPerDeepSession.toFixed(2)}</div>
            <p className="text-xs text-muted">
              Breaks during deep work hurt your progress most. Light work tolerates more.
            </p>
            {s.deepWorkSessions > 0 && (
              <div className="mt-3 rounded-lg bg-panel2 p-3 font-mono text-[11px] text-muted">
                {s.deepWorkBreaks} breaks ÷ {s.deepWorkSessions} sessions = {breaksPerDeepSession.toFixed(2)}
              </div>
            )}
          </section>

          <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
            <div className="mb-1 font-serif text-lg">Goal Completion Rate</div>
            <div className="mb-2 text-3xl font-bold text-accent">{Math.round(completionRate * 100)}%</div>
            <p className="text-xs text-muted">
              Of the sessions you've run, how often you finished what you set out to do.
            </p>
            <div className="mt-3 rounded-lg bg-panel2 p-3 font-mono text-[11px] text-muted">
              {s.sessionsCompleted} ÷ {totalSessions} = {Math.round(completionRate * 100)}%
            </div>
          </section>
        </>
      )}

      <BottomNav />
    </main>
  );
}
