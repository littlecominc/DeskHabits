import BottomNav from '@/components/BottomNav';
import { demoLessons, demoCourse } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default function CoursePage() {
  const lessons = demoLessons;
  const completed = lessons.filter((l) => l.done).length;

  return (
    <main className="px-5 pb-28 pt-8">
      <h1 className="mb-1 font-serif text-2xl">{demoCourse.title}</h1>
      <p className="mb-6 text-sm text-muted">{demoCourse.subtitle}</p>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>Course progress</span>
          <span className="text-muted">{completed} / {lessons.length}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-border">
          <div className="h-2 rounded-full bg-accent" style={{ width: `${(completed / lessons.length) * 100}%` }} />
        </div>
      </section>

      <section className="space-y-3">
        {lessons.map((lesson, i) => (
          <div
            key={lesson.id}
            className={`flex items-center gap-4 rounded-xl2 border p-4 ${
              lesson.done ? 'border-border bg-panel' : 'border-border bg-panel2'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                lesson.done ? 'bg-accent text-ink' : 'border border-border text-muted'
              }`}
            >
              {lesson.done ? '✓' : i + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{lesson.title}</div>
              <div className="text-xs text-muted">{lesson.minutes} min</div>
            </div>
          </div>
        ))}
      </section>

      <BottomNav />
    </main>
  );
}
