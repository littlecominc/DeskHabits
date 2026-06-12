// Course progress — which lessons the user has watched/completed.
// Persisted locally per device (same pattern as lib/schedule.ts).

const KEY = 'deskhabits_completed_lessons';

export function loadCompletedLessons(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function markLessonComplete(id: number) {
  if (typeof window === 'undefined') return;
  const current = loadCompletedLessons();
  if (current.includes(id)) return;
  window.localStorage.setItem(KEY, JSON.stringify([...current, id]));
}

export function hasCompletedIntro(): boolean {
  return loadCompletedLessons().includes(0);
}
