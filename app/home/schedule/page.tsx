'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { loadSchedule, type ScheduleItem } from '@/lib/schedule';

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[] | null>(null);

  useEffect(() => {
    const schedule = loadSchedule();
    setItems(schedule?.items ?? []);
  }, []);

  return (
    <main className="px-5 pb-28 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Today's Schedule</h1>
        <Link href="/home" className="text-xs text-muted">← Home</Link>
      </div>

      {items === null ? null : !items.length ? (
        <div className="rounded-xl2 border border-border bg-panel p-5 text-sm text-muted">
          You haven't scheduled today yet.{' '}
          <Link href="/session/schedule" className="text-accent">Build your plan →</Link>
        </div>
      ) : (
        <ol className="relative ml-2 border-l border-border">
          {items.map((item) => (
            <li key={item.id} className="relative pb-5 pl-5">
              <span
                className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 bg-panel ${
                  item.category === 'deep' ? 'border-accent' : 'border-yellow'
                }`}
              />
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className={item.done ? 'text-muted line-through' : 'font-medium'}>{item.name}</span>
                  <span className="ml-3 text-xs uppercase tracking-wide text-muted">{item.category}</span>
                </div>
                <span className="text-muted">{item.minutes} min{item.done ? ' · done' : ''}</span>
              </div>
            </li>
          ))}
        </ol>
      )}

      <BottomNav />
    </main>
  );
}
