import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { demoSchedule } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

const blockDot: Record<string, string> = {
  deep: 'border-accent',
  light: 'border-yellow',
  break: 'border-green',
  lesson: 'border-accent bg-accent',
  reflect: 'border-muted',
};

async function getSchedule() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return demoSchedule;

    const { data } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheduled_date', new Date().toISOString().slice(0, 10))
      .order('start_time');

    return data?.length ? data : demoSchedule;
  } catch {
    return demoSchedule;
  }
}

export default async function SchedulePage() {
  const schedule = await getSchedule();

  return (
    <main className="px-5 pb-28 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Today's Schedule</h1>
        <Link href="/home" className="text-xs text-muted">← Home</Link>
      </div>

      <ol className="relative ml-2 border-l border-border">
        {schedule.map((block: any) => {
          const label = block.label ?? block.block_type;
          const dotCls = blockDot[block.block_type] ?? 'border-muted';
          const active = block.status === 'active';
          return (
            <li key={block.id} className={`relative pb-5 pl-5 ${active ? 'rounded-md bg-panel2 py-2' : ''}`}>
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

      <BottomNav />
    </main>
  );
}
