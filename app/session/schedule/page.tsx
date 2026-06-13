'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { loadSchedule, saveSchedule, type ScheduleItem } from '@/lib/schedule';

type Subject = { id: string; name: string };
type Plan = { category: 'deep' | 'light' | null; minutes: number; done: boolean };

export default function ScheduleBuilderPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [plan, setPlan] = useState<Record<string, Plan>>({});

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('subjects').select('id, name').eq('user_id', user.id).order('created_at');
      const subs = data ?? [];
      setSubjects(subs);

      // Seed from today's existing plan so edits preserve completed work.
      const existing = loadSchedule();
      const map: Record<string, Plan> = {};
      for (const sub of subs) {
        const item = existing?.items.find((i) => i.id === sub.id);
        map[sub.id] = item
          ? { category: item.category, minutes: item.minutes, done: item.done }
          : { category: null, minutes: 30, done: false };
      }
      setPlan(map);
      setLoading(false);
    })();
  }, []);

  function toggleCategory(id: string, cat: 'deep' | 'light') {
    setPlan((p) => ({ ...p, [id]: { ...p[id], category: p[id].category === cat ? null : cat } }));
  }
  function setMinutes(id: string, m: number) {
    setPlan((p) => ({ ...p, [id]: { ...p[id], minutes: m } }));
  }

  const planned = subjects.filter((s) => plan[s.id]?.category || plan[s.id]?.done);
  const totalDeep = subjects
    .filter((s) => plan[s.id]?.category === 'deep' && !plan[s.id]?.done)
    .reduce((a, s) => a + (plan[s.id]?.minutes ?? 0), 0);

  function save(goToSession: boolean) {
    const items: ScheduleItem[] = subjects
      .filter((s) => plan[s.id]?.done || plan[s.id]?.category)
      .map((s) => ({
        id: s.id,
        name: s.name,
        category: plan[s.id].category ?? 'light',
        minutes: plan[s.id].minutes,
        done: plan[s.id].done,
      }));
    saveSchedule(items);
    router.push(goToSession ? '/session' : '/home');
  }

  if (loading) return null;

  if (!subjects.length) {
    return (
      <div className="screen">
        <div className="content center-col" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="ritual-icon">📚</div>
          <h2 style={{ marginBottom: 8 }}>No classes on file yet</h2>
          <p style={{ marginBottom: 24 }}>Add the classes you&apos;re taking so we can build today&apos;s plan.</p>
          <Link href="/profile" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>Go to Profile →</Link>
        </div>
      </div>
    );
  }

  const hasPlannedWork = planned.some((s) => !plan[s.id]?.done);

  return (
    <div className="screen">
      <div className="content fade-in">
        <h1 style={{ marginBottom: 4 }}>Plan your day</h1>
        <p style={{ marginBottom: 18 }}>Pick what you&apos;ll work on and how. You set this once — completed work is locked.</p>

        {subjects.map((s) => {
          const pl = plan[s.id];
          if (!pl) return null;

          if (pl.done) {
            return (
              <div key={s.id} className="card" style={{ opacity: 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>{s.name}</span>
                  <span className="pill pill-break">✓ Completed today</span>
                </div>
              </div>
            );
          }

          return (
            <div key={s.id} className="card">
              <div style={{ fontWeight: 700, marginBottom: 10 }}>{s.name}</div>
              <div className="mc-grid" style={{ marginBottom: pl.category ? 12 : 0 }}>
                <button
                  className="tag"
                  style={pl.category === 'deep' ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(108,99,255,.12)' } : undefined}
                  onClick={() => toggleCategory(s.id, 'deep')}
                >
                  🧠 Deep Work
                </button>
                <button
                  className="tag"
                  style={pl.category === 'light' ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(108,99,255,.12)' } : undefined}
                  onClick={() => toggleCategory(s.id, 'light')}
                >
                  📋 Light Work
                </button>
              </div>
              {pl.category && (
                <>
                  <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>{pl.minutes} min</div>
                  <input type="range" min={10} max={120} step={5} value={pl.minutes} onChange={(e) => setMinutes(s.id, Number(e.target.value))} />
                </>
              )}
              {!pl.category && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Not in today&apos;s plan — tap to include.</div>}
            </div>
          );
        })}

        {totalDeep > 0 && totalDeep < 60 && (
          <div className="card" style={{ borderColor: 'var(--accent)' }}>
            <p style={{ color: 'var(--accent)' }}>
              Deep work pays off most in blocks of an hour or more — you&apos;ve allocated {totalDeep} min so far.
            </p>
          </div>
        )}

        <div style={{ height: 8 }} />
        <button className="btn btn-primary" disabled={!hasPlannedWork} onClick={() => save(true)} style={{ display: 'block' }}>
          Start My Day →
        </button>
        <div style={{ height: 8 }} />
        <button className="btn btn-ghost" onClick={() => save(false)} style={{ display: 'block' }}>
          Save &amp; go home
        </button>
      </div>
    </div>
  );
}
