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
      <div className="card" style={{ padding: '16px' }}>
        <p style={{ marginBottom: 10 }}>You haven&apos;t scheduled today yet.</p>
        <Link href="/session/schedule" className="btn btn-ghost btn-sm" style={{ display: 'inline-block', textAlign: 'center' }}>
          Build your plan →
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '8px 14px' }}>
      {items.map((item) => {
        const dotCls = item.category === 'deep' ? 'dot' : 'dot dot-yellow';
        const pillCls = item.category === 'deep' ? 'pill pill-deep' : 'pill pill-light';
        const label = item.category === 'deep' ? 'Deep Work' : 'Light Work';
        return (
          <div key={item.id} className="schedule-item">
            <div className={dotCls} />
            <div className="task-col">
              <div className="task-name" style={item.done ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}>
                {item.name}
              </div>
              <span className={pillCls}>{label} · {item.minutes} min{item.done ? ' · done' : ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
