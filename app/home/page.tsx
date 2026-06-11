import Link from 'next/link';
import Tower from '@/components/Tower';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { demoProfile, demoProgress, demoSchedule, demoCourse } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { profile: demoProfile, progress: demoProgress, schedule: demoSchedule, course: demoCourse };

    const [{ data: profile }, { data: progress }, { data: schedule }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('progress').select('*').eq('user_id', user.id).single(),
      supabase
        .from('schedule_blocks')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheduled_date', new Date().toISOString().slice(0, 10))
        .order('start_time'),
    ]);

    return {
      profile: profile ?? demoProfile,
      progress: progress ?? demoProgress,
      schedule: schedule?.length ? schedule : demoSchedule,
      course: demoCourse,
    };
  } catch {
    // Supabase not configured yet — render with demo data so the UI is always reviewable.
    return { profile: demoProfile, progress: demoProgress, schedule: demoSchedule, course: demoCourse };
  }
}

const blockDot: Record<string, string> = {
  deep: 'border-accent',
  light: 'border-yellow',
  break: 'border-green',
  lesson: 'border-accent bg-accent',
  reflect: 'border-muted',
};

export default async function HomePage() {
  const { profile, progress, schedule, course } = await getDashboardData();
  const name = (profile as any).full_name ?? 'there';
  const p = progress as any;

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

      {/* Tower card */}
      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="flex items-center gap-5">
          <Tower stones={p.stones ?? 4} />
          <div className="flex-1">
            <div className="text-sm text-muted">
              Level <span className="font-semibold text-text">{Math.max(1, Math.floor((p.stones ?? 4) / 2))}</span>
            </div>
            <div className="text-xs text-muted">Focused {p.current_streak ?? 18} days</div>
            <div className="mt-3 text-sm font-semibold">Next Brick</div>
            <div className="text-xs text-muted">Stay off your phone for 25 more minutes</div>
            <Link href="/progress" className="mt-2 inline-block text-xs text-accent">
              View Progress →
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted">Average time between breaks</div>
            <div className="mt-1 text-2xl font-semibold">{p.avg_break_minutes ?? 47} <span className="text-sm font-normal text-muted">min</span></div>
          </div>
          <div className="border-l border-border pl-3">
            <div className="text-[10px] uppercase tracking-wide text-muted">Times you reach for your phone</div>
            <div className="mt-1 text-2xl font-semibold">{p.phone_pickups_today ?? 23} <span className="text-sm font-normal text-muted">today</span></div>
          </div>
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

      {/* Today's plan */}
      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-serif text-lg">Today's Plan</div>
          <Link href="/home/schedule" className="text-xs text-muted">See full schedule →</Link>
        </div>
        <ol className="relative ml-2 border-l border-border">
          {schedule.map((block: any) => {
            const label = block.label ?? block.block_type;
            const dotCls = blockDot[block.block_type] ?? 'border-muted';
            const active = block.status === 'active';
            return (
              <li key={block.id} className={`relative pb-4 pl-5 ${active ? 'rounded-md bg-panel2 py-2' : ''}`}>
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
