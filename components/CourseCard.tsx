'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { demoCourse, demoLessons } from '@/lib/demo-data';
import { loadCompletedLessons } from '@/lib/course';

export default function CourseCard() {
  const [completed, setCompleted] = useState<number[] | null>(null);

  useEffect(() => {
    setCompleted(loadCompletedLessons());
  }, []);

  if (completed === null) return null;

  const nextLesson = demoLessons.find((l) => !completed.includes(l.id)) ?? demoLessons[demoLessons.length - 1];

  return (
    <Link href="/course" className="mb-5 block rounded-xl2 border border-border bg-panel p-5">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-muted">Required course</div>
      <div className="font-serif text-lg">{demoCourse.title}</div>
      <div className="text-xs text-muted">{demoCourse.subtitle}</div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span>{nextLesson.title}</span>
        <span className="text-muted">{nextLesson.minutes} min</span>
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-border">
        <div
          className="h-1 rounded-full bg-accent"
          style={{ width: `${(completed.length / demoLessons.length) * 100}%` }}
        />
      </div>
      <div className="mt-1 text-right text-[11px] text-muted">{completed.length} / {demoLessons.length}</div>
    </Link>
  );
}
