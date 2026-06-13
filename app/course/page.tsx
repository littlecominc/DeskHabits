'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { demoLessons } from '@/lib/demo-data';
import { loadCompletedLessons, markLessonComplete } from '@/lib/course';

export default function CoursePage() {
  const [completed, setCompleted] = useState<number[] | null>(null);

  useEffect(() => {
    setCompleted(loadCompletedLessons());
  }, []);

  if (completed === null) return null;

  function watch(id: number) {
    markLessonComplete(id);
    setCompleted(loadCompletedLessons());
  }

  // A lesson unlocks once the previous one is complete (intro is always open).
  function isUnlocked(i: number) {
    if (i === 0) return true;
    return completed!.includes(demoLessons[i - 1].id);
  }

  return (
    <div className="screen">
      <div className="content fade-in">
        <h2 style={{ marginBottom: 6 }}>Your Focus Course</h2>
        <p style={{ marginBottom: 14 }}>Bite-sized lessons delivered between sessions — not lectures, just what you need right now.</p>

        {demoLessons.map((lesson, i) => {
          const done = completed!.includes(lesson.id);
          const unlocked = isUnlocked(i);
          return (
            <div key={lesson.id} className="card" style={!unlocked ? { opacity: 0.5 } : undefined}>
              <div className={`pill ${unlocked ? 'pill-deep' : 'pill-light'}`} style={{ marginBottom: 8 }}>
                {lesson.intro ? 'INTRO' : `LESSON ${i}`} · {done ? 'COMPLETE' : unlocked ? 'UNLOCKED' : 'LOCKED'}
              </div>
              <h3 style={{ color: 'var(--text)', marginBottom: 6, fontSize: 15, textTransform: 'none', letterSpacing: 0 }}>{lesson.title}</h3>
              <p style={{ marginBottom: unlocked && !done ? 12 : 0 }}>
                {unlocked ? `${lesson.minutes} min lesson.` : 'Complete the previous lesson to unlock.'}
              </p>
              {unlocked && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-block' }}
                  disabled={done}
                  onClick={() => watch(lesson.id)}
                >
                  {done ? 'Watched ✓' : '▶ Watch lesson'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
