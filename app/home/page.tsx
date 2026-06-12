import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { demoProfile, demoStats, demoSchedule, demoCourse, demoTimeline } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { profile: demoProfile, stats: demoStats, schedule: demoSchedule, course: demoCourse, timeline: demoTimeline };

    const [{ data: profile }, { data: schedule }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('schedule_blocks')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheduled_date', new Date().toISOString().slice(0, 10))
        .order('start_time'),
    ]);

    return {
      profile: profile ?? demoProfile,
      stats: demoStats,
      schedule: schedule?.length ? schedule.filter((b: any) => b.block_type !== 'break') : demoSchedule,
      course: demoCourse,
      timeline: demoTimeline,
    };
  } catch {
    return { profile: demoProfile, stats: demoStats, schedule: demoSchedule, course: demoCourse, timeline: demoTimeline };
  }
}

const blockDot: Record<string, string> = {
  deep: 'border-accent',
  light: 'border-yellow',
};

const timelineColor: Record<string, string> = {
  deep: 'bg-accent',
  light: 'bg-yellow',
  break: 'bg-border',
};

export default async function HomePage() {
  const { profile, stats, schedule, course, timeline } = await getDashboardData();
  const name = (profile as any).full_name ?? 'there';
  const s = stats as any;

  const focusHours = (s.totalFocusMinutes / 60).toFixed(1);
  const avgBeforeDistraction = Math.round(
    s.totalDistractionFreeMinutesBeforeFirstBreak.reduce((a: number, b: number) => a + b, 0) /
      s.totalDistractionFreeMinutesBeforeFirstBreak.length,
  );
  const totalTimelineMinutes = timeline.reduce((sum: number, b: any) => sum + b.minutes, 0);

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
          <div className="text-2xl font-semibold text-accent">{avgBeforeDistraction}<span className="text-sm text-muted"> min</span></div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Avg before first break</div>
        </div>
        <div className="rounded-xl2 border border-border bg-panel p-4">
          <div className="text-2xl font-semibold text-text">{s.totalBreaks}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Breaks taken</div>
        </div>
        <div className="rounded-xl2 border border-border bg-panel p-4">
          <div className="text-2xl font-semibold text-text">{s.phonePickupsDuringSessions}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Phone pickups in sessions</div>
        </div>
      </section>

      {/* Course card */}
      <Link href="/course" className="mb-5 block rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-muted">Required course</div>
        <div className="font-serif text-lg">{course.title}</div>
        <div className="text-xs text-muted">{course.subtitle}</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span>{course.lesson_title}</span>
          <span className="text-muted">{course.lesson_minutes} min</span>
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-accent"
            style={{ width: `${(course.completed / course.total) * 100}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[11px] text-muted">{course.completed} / {course.total}</div>
      </Link>

      {/* Focus timeline */}
      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-3 font-serif text-lg">Focus Timeline</div>
        {timeline.length ? (
          <>
            <div className="mb-2 flex h-3 w-full overflow-hidden rounded-full">
              {timeline.map((block: any, i: number) => (
                <div
                  key={i}
                  className={timelineColor[block.type]}
                  style={{ width: `${(block.minutes / totalTimelineMinutes) * 100}%` }}
                />
              ))}
            </div>
            <ul className="space-y-1 text-xs text-muted">
              {timeline.map((block: any, i: number) => (
                <li key={i} className="flex items-center justify-between">
                  <span className={block.type === 'break' ? '' : 'text-text'}>
                    {block.start} – {block.end} · {block.label}
                  </span>
                  <span>{block.minutes} min</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted">No sessions yet today.</p>
        )}
      </section>

      {/* Today's plan */}
      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-serif text-lg">Today's Plan</div>
          <Link href="/home/schedule" className="text-xs text-muted">See full schedule →</Link>
        </div>
        {schedule.length ? (
          <ol className="relative ml-2 border-l border-border">
            {schedule.map((block: any) => {
              const label = block.label ?? block.block_type;
              const dotCls = blockDot[block.block_type] ?? 'border-muted';
              return (
                <li key={block.id} className="relative pb-4 pl-5">
                  <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 bg-panel ${dotCls}`} />
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted">{block.start_time}</span>
                      <span className="ml-3 font-medium">{label}</span>
                    </div>
                    <span className="text-muted">{block.duration_minutes} min</span>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="text-sm text-muted">
            You haven't scheduled today yet.
          </div>
        )}
      </section>

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
