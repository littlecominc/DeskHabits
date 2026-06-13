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

const TOWER_ROWS = 7;

export default async function AnalyticsPage() {
  const s = await loadStats();
  const totalSessions = s.sessionsCompleted + s.sessionsFailed;

  const delayedGratList = s.distractionFreeMinutesBeforeFirstBreak;
  const delayedGratAvg = delayedGratList.length
    ? Math.round(delayedGratList.reduce((a, b) => a + b, 0) / delayedGratList.length)
    : 0;
  const completionRate = totalSessions > 0 ? Math.round((s.sessionsCompleted / totalSessions) * 100) : 0;
  const attentionRatio = s.totalFocusMinutes > 0 ? Math.round(((s.totalFocusMinutes - s.deepWorkBreaks * 10) / s.totalFocusMinutes) * 100) : 0;
  const focusHours = (s.totalFocusMinutes / 60).toFixed(1);
  const stonesLaid = Math.max(0, Math.min(TOWER_ROWS, s.sessionsCompleted));

  return (
    <div className="screen">
      <div className="content fade-in">
        <h2 style={{ marginBottom: 18 }}>Your Progress</h2>

        {totalSessions === 0 ? (
          <div className="card"><p>Complete your first work session to start seeing your numbers here.</p></div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-val">{completionRate}%</div><div className="stat-label">Goal completion</div></div>
              <div className="stat-card"><div className="stat-val">{attentionRatio}%</div><div className="stat-label">Attention ratio</div></div>
              <div className="stat-card"><div className="stat-val">{focusHours}</div><div className="stat-label">Focus hours (7d)</div></div>
              <div className="stat-card"><div className="stat-val">{s.sessionsCompleted}</div><div className="stat-label">Sessions completed</div></div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Delayed Gratification Score</h3>
              <p style={{ marginBottom: 6 }}>Avg. time in deep work before your first break:</p>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{delayedGratAvg} minutes</div>
              {delayedGratList.length > 0 && (
                <div style={{ marginTop: 10, padding: 12, background: 'var(--surface)', borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>
                  ({delayedGratList.join(' + ')}) ÷ {delayedGratList.length} = {delayedGratAvg} min
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Attention Ratio breakdown</h3>
              <p>Share of focus time not lost to deep-work breaks: ({s.totalFocusMinutes} min − {s.deepWorkBreaks} breaks × 10) ÷ {s.totalFocusMinutes} min.</p>
            </div>
          </>
        )}

        <div className="tower-wrap card">
          <h3 style={{ marginBottom: 10 }}>Discipline Tower — Full View</h3>
          <div className="tower">
            {Array.from({ length: TOWER_ROWS }).map((_, i) => (
              <div key={i} className={`stone ${i >= stonesLaid ? 'ghost' : ''}`} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>{stonesLaid} stone{stonesLaid === 1 ? '' : 's'} laid.</div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
