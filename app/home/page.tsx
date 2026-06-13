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
    if (!user) return { name: 'there', stats: EMPTY, nextTest: null };
    const [{ data: profile }, stats, { data: subjects }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      getUserStats(supabase, user.id),
      supabase.from('subjects').select('name, next_test_date').eq('user_id', user.id).not('next_test_date', 'is', null),
    ]);
    const name = profile?.full_name && profile.full_name !== user.email ? profile.full_name : 'there';

    // Soonest upcoming test (today or later) drives the Blitz card.
    const todayStr = new Date().toISOString().slice(0, 10);
    const upcoming = (subjects ?? [])
      .filter((s: any) => s.next_test_date && s.next_test_date >= todayStr)
      .sort((a: any, b: any) => a.next_test_date.localeCompare(b.next_test_date));
    const nextTest = upcoming.length
      ? { name: upcoming[0].name, days: Math.round((new Date(upcoming[0].next_test_date + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) / 86400000) }
      : null;

    return { name, stats, nextTest };
  } catch {
    return { name: 'there', stats: EMPTY, nextTest: null };
  }
}

const TOWER_ROWS = 7;

export default async function HomePage() {
  const { name, stats: s, nextTest } = await getData();

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
            {nextTest ? `⚠ ${nextTest.name} test ${nextTest.days === 0 ? 'today' : nextTest.days === 1 ? 'tomorrow' : `in ${nextTest.days} days`}` : '⚡ Big test coming up?'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {nextTest ? 'Intensity is ramping up. Lock in with Blitz Mode.' : 'Set a test date in your profile, or jump straight into Blitz Mode.'}
          </div>
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
