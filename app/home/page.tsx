import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import TodaySchedule from '@/components/TodaySchedule';
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

async function getData() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { name: 'there', stats: EMPTY };
    const [{ data: profile }, stats] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      getUserStats(supabase, user.id),
    ]);
    const name = profile?.full_name && profile.full_name !== user.email ? profile.full_name : 'there';
    return { name, stats };
  } catch {
    return { name: 'there', stats: EMPTY };
  }
}

const TOWER_ROWS = 7;

export default async function HomePage() {
  const { name, stats: s } = await getData();

  const stonesLaid = Math.max(0, Math.min(TOWER_ROWS, s.sessionsCompleted));
  const avgBeforeBreak = s.distractionFreeMinutesBeforeFirstBreak.length
    ? Math.round(
        s.distractionFreeMinutesBeforeFirstBreak.reduce((a, b) => a + b, 0) /
          s.distractionFreeMinutesBeforeFirstBreak.length,
      )
    : 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <div className="screen">
      <div className="content fade-in">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{today}</div>
          <h1>Your plan for today{name && name !== 'there' ? `, ${name}` : ''}</h1>
        </div>

        <div className="tower-wrap card">
          <h3 style={{ marginBottom: 10 }}>Your Discipline Tower</h3>
          <div className="tower">
            {Array.from({ length: TOWER_ROWS }).map((_, i) => (
              <div key={i} className={`stone ${i >= stonesLaid ? 'ghost' : ''}`} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
            {stonesLaid} stone{stonesLaid === 1 ? '' : 's'} laid. Complete today&apos;s sessions to add another.
          </div>
          <div className="stat-grid-3">
            <div className="stat-box"><div className="v">{avgBeforeBreak}m</div><div className="l">avg before<br />first break</div></div>
            <div className="stat-box"><div className="v">{s.totalBreaks}</div><div className="l">breaks<br />this week</div></div>
            <div className="stat-box"><div className="v">{s.sessionsCompleted}</div><div className="l">sessions<br />completed</div></div>
          </div>
        </div>

        <h3 style={{ marginBottom: 12 }}>Today&apos;s Schedule</h3>
        <TodaySchedule />

        <div className="card" style={{ background: 'rgba(248,113,113,.08)', borderColor: 'rgba(248,113,113,.2)' }}>
          <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>
            ⚡ Big test coming up?
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Switch to Blitz Mode to ramp up intensity.</div>
          <Link href="/session?blitz=1" className="btn btn-blitz btn-sm" style={{ display: 'inline-block', textAlign: 'center' }}>
            ⚡ Switch to Blitz Mode
          </Link>
        </div>

        <Link href="/session" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
          Begin Today&apos;s Plan →
        </Link>
        <div style={{ height: 8 }} />
        <Link href="/session/schedule" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center' }}>
          Edit Schedule
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
