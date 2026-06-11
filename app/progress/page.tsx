import Tower from '@/components/Tower';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { demoProgress } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

async function getProgress() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return demoProgress;

    const { data } = await supabase.from('progress').select('*').eq('user_id', user.id).single();
    return data ?? demoProgress;
  } catch {
    return demoProgress;
  }
}

const scoreBars = [
  { key: 'discipline_score', label: 'Discipline', color: 'bg-accent' },
  { key: 'attention_score', label: 'Attention', color: 'bg-green' },
  { key: 'resilience_score', label: 'Resilience', color: 'bg-yellow' },
] as const;

export default async function ProgressPage() {
  const p = (await getProgress()) as any;
  const stones = p.stones ?? 0;
  const level = Math.max(1, Math.floor(stones / 2));
  const stonesToNext = 2 - (stones % 2 === 0 ? 0 : stones % 2);

  return (
    <main className="px-5 pb-28 pt-8">
      <h1 className="mb-1 font-serif text-2xl">Your Progress</h1>
      <p className="mb-6 text-xs uppercase tracking-widest text-muted">Brick by brick.</p>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5 text-center">
        <Tower stones={stones} />
        <div className="mt-3 text-lg font-semibold">Level {level}</div>
        <div className="text-xs text-muted">
          {stones % 2 === 0 ? 'Earn 2 more stones to reach the next level' : `Earn ${stonesToNext} more stone to level up`}
        </div>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl2 border border-border bg-panel p-4 text-center">
          <div className="text-3xl font-bold text-accent">{p.current_streak ?? 0}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Current Streak (days)</div>
        </div>
        <div className="rounded-xl2 border border-border bg-panel p-4 text-center">
          <div className="text-3xl font-bold text-accent">{p.longest_streak ?? 0}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Longest Streak (days)</div>
        </div>
      </section>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-4 font-serif text-lg">Scores</div>
        <div className="space-y-4">
          {scoreBars.map(({ key, label, color }) => {
            const value = p[key] ?? 0;
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-muted">{value}/100</span>
                </div>
                <div className="h-2 w-full rounded-full bg-border">
                  <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
