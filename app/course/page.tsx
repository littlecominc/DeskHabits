'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { demoLessons, demoCourse } from '@/lib/demo-data';
import { loadCompletedLessons, markLessonComplete } from '@/lib/course';

export default function CoursePage() {
  const [completed, setCompleted] = useState<number[] | null>(null);

  useEffect(() => {
    setCompleted(loadCompletedLessons());
  }, []);

  if (completed === null) return null;

  const completedCount = completed.length;

  function watchLesson(id: number) {
    markLessonComplete(id);
    setCompleted(loadCompletedLessons());
  }

  return (
    <main className="px-5 pb-28 pt-8">
      <h1 className="mb-1 font-serif text-2xl">{demoCourse.title}</h1>
      <p className="mb-6 text-sm text-muted">{demoCourse.subtitle}</p>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>Course progress</span>
          <span className="text-muted">{completedCount} / {demoLessons.length}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-border">
          <div className="h-2 rounded-full bg-accent" style={{ width: `${(completedCount / demoLessons.length) * 100}%` }} />
        </div>
      </section>

      <section className="space-y-3">
        {demoLessons.map((lesson, i) => {
          const done = completed.includes(lesson.id);
          return (
            <button
              key={lesson.id}
              onClick={() => watchLesson(lesson.id)}
              disabled={done}
              className={`flex w-full items-center gap-4 rounded-xl2 border p-4 text-left ${
                done ? 'border-border bg-panel' : 'border-border bg-panel2'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  done ? 'bg-accent text-ink' : 'border border-border text-muted'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{lesson.title}</div>
                <div className="text-xs text-muted">{lesson.minutes} min{!done ? ' · tap to watch' : ''}</div>
              </div>
            </button>
          );
        })}
      </section>

      <BottomNav />
    </main>
  );
}
