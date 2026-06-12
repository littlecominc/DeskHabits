'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { saveSchedule, type ScheduleItem } from '@/lib/schedule';

type Subject = { id: string; name: string };

export default function ScheduleBuilderPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [category, setCategory] = useState<'deep' | 'light' | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [done, setDone] = useState(false);

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
      setSubjects(data ?? []);
      setLoading(false);
    })();
  }, []);

  const current = subjects[index];
  const isLast = index === subjects.length - 1;

  const totalLight = items.filter((i) => i.category === 'light').reduce((s, i) => s + i.minutes, 0);

  function next() {
    const newItem: ScheduleItem = {
      id: current.id,
      name: current.name,
      category: category!,
      minutes,
      done: false,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setCategory(null);
    setMinutes(30);

    if (isLast) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
  }

  function addMoreDeepTime(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, minutes: i.minutes + 15 } : i)));
  }

  function finish() {
    saveSchedule(items);
    router.push('/session');
  }

  const finalTotalDeep = items.filter((i) => i.category === 'deep').reduce((s, i) => s + i.minutes, 0);
  const firstDeepItem = items.find((i) => i.category === 'deep');

  if (loading) return null;

  if (!subjects.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
        <h2 className="mb-2 font-serif text-xl">No classes on file yet</h2>
        <p className="mb-6 text-sm text-muted">Add the classes you're taking so we can build today's plan.</p>
        <Link href="/profile" className="w-full rounded-xl2 bg-accent py-4 text-center font-serif text-lg font-semibold text-ink">
          Go to Profile →
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-10">
      {!done ? (
        <div className="flex flex-1 flex-col">
          <p className="mb-1 text-xs uppercase tracking-widest text-muted">
            {index + 1} / {subjects.length}
          </p>
          <h2 className="mb-6 font-serif text-xl">{current.name}</h2>

          <label className="mb-2 text-xs uppercase tracking-wide text-muted">Is this deep or light work?</label>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => setCategory('deep')}
              className={`rounded-xl2 border p-4 text-left ${category === 'deep' ? 'border-accent bg-panel2' : 'border-border bg-panel'}`}
            >
              <div className="font-serif text-lg">Deep Work</div>
              <div className="text-xs text-muted">Requires full focus</div>
            </button>
            <button
              onClick={() => setCategory('light')}
              className={`rounded-xl2 border p-4 text-left ${category === 'light' ? 'border-accent bg-panel2' : 'border-border bg-panel'}`}
            >
              <div className="font-serif text-lg">Light Work</div>
              <div className="text-xs text-muted">Lower-stakes tasks</div>
            </button>
          </div>

          {category && (
            <>
              <label className="mb-2 text-xs uppercase tracking-wide text-muted">How long will this take?</label>
              <div className="mb-2 text-center text-3xl font-semibold text-accent">{minutes} min</div>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="mb-6 w-full accent-[#e8d9b5]"
              />
            </>
          )}

          <div className="flex-1" />
          <button
            disabled={!category}
            onClick={next}
            className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-40"
          >
            {isLast ? 'Review Schedule →' : 'Next Subject →'}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-5 font-serif text-xl">Today's Plan</h2>
          <div className="mb-6 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-panel px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="ml-2 text-xs text-muted">{item.category === 'deep' ? 'Deep' : 'Light'}</span>
                </div>
                <span className="text-muted">{item.minutes} min</span>
              </div>
            ))}
          </div>

          <div className="mb-3 rounded-xl2 border border-border bg-panel p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">Deep work total</span><span>{finalTotalDeep} min</span></div>
            <div className="flex justify-between"><span className="text-muted">Light work total</span><span>{totalLight} min</span></div>
          </div>

          {finalTotalDeep > 0 && finalTotalDeep < 60 && firstDeepItem && (
            <div className="mb-3 rounded-xl2 border border-accent bg-panel2 p-4 text-sm">
              <p className="mb-2 text-accent">
                Deep work sessions work best in blocks of at least one hour. You've only allocated {finalTotalDeep} min total.
              </p>
              <button
                onClick={() => addMoreDeepTime(firstDeepItem.id)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink"
              >
                Add 15 more minutes to {firstDeepItem.name}
              </button>
            </div>
          )}

          <div className="mb-6 rounded-xl2 border border-border bg-panel p-4 text-sm text-muted">
            Consider allocating more time to deep work — it's where the real progress happens.
          </div>

          <div className="flex-1" />
          <button onClick={finish} className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
            Start My Day →
          </button>
        </div>
      )}
    </main>
  );
}
