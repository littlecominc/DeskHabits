'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadSchedule, type ScheduleItem } from '@/lib/schedule';

export default function TodaySchedule() {
  const [items, setItems] = useState<ScheduleItem[] | null>(null);

  useEffect(() => {
    const schedule = loadSchedule();
    setItems(schedule?.items ?? []);
  }, []);

  if (items === null) return null;

  if (!items.length) {
    return (
      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-3 font-serif text-lg">Today's Plan</div>
        <div className="text-sm text-muted">You haven't scheduled today yet.</div>
      </section>
    );
  }

  const totalMinutes = items.reduce((s, i) => s + i.minutes, 0);
  const doneMinutes = items.filter((i) => i.done).reduce((s, i) => s + i.minutes, 0);

  return (
    <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-serif text-lg">Today's Plan</div>
        <span className="text-xs text-muted">{doneMinutes} / {totalMinutes} min</span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-panel2 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${item.category === 'deep' ? 'bg-accent' : 'bg-yellow'}`} />
              <span className={item.done ? 'text-muted line-through' : ''}>{item.name}</span>
            </div>
            <span className="text-muted">{item.minutes} min{item.done ? ' · done' : ''}</span>
          </li>
        ))}
      </ul>
      {items.every((i) => i.done) && (
        <Link href="/session/schedule" className="mt-3 block text-center text-xs text-accent">
          Plan tomorrow's session →
        </Link>
      )}
    </section>
  );
}
